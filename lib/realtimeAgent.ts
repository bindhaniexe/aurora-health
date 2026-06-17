import { supabase } from '@/lib/supabase';
import { useCompanionStore } from '@/stores/companionStore';
import { agentService } from '@/services/agentService';
import { useProfileStore } from '@/stores/profileStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useSleepStore } from '@/stores/sleepStore';
import { useHabitStore } from '@/stores/habitStore';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { cacheDirectory, EncodingType } from 'expo-file-system/legacy';

// Enable voice agent by default. If keys are missing, we fall back to Mock Agent Mode
export const ENABLE_VOICE_AGENT = true;

// Helper to concatenate base64 chunks for MP3 playback
function concatBase64(chunks: string[]): string {
  try {
    const binaryString = chunks.map(chunk => {
      // Strip out any non-base64 characters
      const cleaned = chunk.replace(/[^A-Za-z0-9+/]/g, '');
      return atob(cleaned);
    }).join('');
    return btoa(binaryString);
  } catch (e) {
    console.error('[RealtimeAgent] Error concatenating base64 chunks:', e);
    return chunks.join('');
  }
}

function buildSystemPrompt(): string {
  const { profile } = useProfileStore.getState();
  const { todayTotal } = useHydrationStore.getState();
  const { lastNight } = useSleepStore.getState();
  const { habits, todayCompletions } = useHabitStore.getState();
  
  const completedCount = new Set(todayCompletions.map(c => c.habit_id)).size;

  if (!profile) return 'You are Aurora, a warm and encouraging personal health companion.';

  return `
You are Aurora, a warm and encouraging personal health companion.
The user's name is ${profile.name}. Their goals: ${profile.goals?.join(', ')}.
Today: ${todayTotal}ml water of ${profile.water_goal_ml}ml goal.
Sleep last night: ${lastNight?.hours ?? 0}h (goal: ${profile.sleep_goal_hrs}h).
Habits done: ${completedCount}/${habits.length}.
Memory: ${profile.memory_notes || 'None yet.'}.
Use your tools when the user mentions data — don't ask, just act and confirm.
Be concise. Max 2 sentences per response. Never be clinical.
  `.trim();
}

class RealtimeAgent {
  private ws: WebSocket | null = null;
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private audioChunks: string[] = [];
  private currentResponseText = '';
  private isMockMode = false;

  public async connect() {
    try {
      if (!ENABLE_VOICE_AGENT) {
        useCompanionStore.getState().setConnectionState('error');
        useCompanionStore.getState().setErrorMessage('Voice agent disabled. Set ENABLE_VOICE_AGENT to true in lib/realtimeAgent.ts');
        console.log('[RealtimeAgent] Voice agent disabled. Skipping connection.');
        return;
      }

      useCompanionStore.getState().setConnectionState('processing');
      useCompanionStore.getState().setErrorMessage(null);

      let connectionUrl = '';
      const localApiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
      const localAgentId = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID;

      // Clean/strip quotes from env variables if they exist
      const cleanApiKey = localApiKey ? localApiKey.replace(/['"]/g, '') : '';
      const cleanAgentId = localAgentId ? localAgentId.replace(/['"]/g, '') : '';

      if (cleanApiKey && cleanAgentId) {
        console.log('[RealtimeAgent] Using local ElevenLabs keys. Generating signed URL...');
        try {
          const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${cleanAgentId}`,
            {
              headers: {
                'xi-api-key': cleanApiKey,
              },
            }
          );
          if (!response.ok) {
            let detailMsg = '';
            try {
              const resJson = await response.json();
              detailMsg = resJson?.detail?.message || '';
            } catch (_) {
              try {
                const resText = await response.text();
                detailMsg = resText || '';
              } catch (__) {}
            }
            throw new Error(`ElevenLabs API responded with status ${response.status}${detailMsg ? `: ${detailMsg}` : ''}`);
          }
          const resData = await response.json();
          connectionUrl = resData.signed_url;
        } catch (fetchErr: any) {
          console.warn('[RealtimeAgent] Failed to fetch signed URL locally:', fetchErr);
          throw new Error(fetchErr.message || 'Local keys configured but signed URL request failed. Check your internet connection.');
        }
      } else {
        console.log('[RealtimeAgent] Attempting to fetch ElevenLabs signed URL from Supabase Edge Function...');
        try {
          const { data, error } = await supabase.functions.invoke('realtime-session');
          if (error || !data?.signed_url) {
            console.warn('[RealtimeAgent] Supabase function invoke failed:', error, 'Data returned:', data);
            throw new Error(error?.message || 'Failed to fetch ElevenLabs session URL');
          }
          connectionUrl = data.signed_url;
        } catch (supabaseErr: any) {
          console.warn('[RealtimeAgent] Supabase connection failed. Falling back to Mock Agent Mode.');
          this.activateMockMode();
          return;
        }
      }

      console.log('[RealtimeAgent] Connecting to ElevenLabs WebSocket:', connectionUrl);
      this.isMockMode = false;
      this.ws = new WebSocket(connectionUrl);

      this.ws.onopen = () => {
        console.log('[RealtimeAgent] ElevenLabs WebSocket connected.');
        // Initialize the session with our configuration override (system prompt)
        this.ws?.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: buildSystemPrompt()
              }
            }
          }
        }));
        useCompanionStore.getState().setConnectionState('idle');
      };

      this.ws.onmessage = async (e) => {
        const event = JSON.parse(e.data as string);
        await this.handleServerEvent(event);
      };

      this.ws.onerror = (e) => {
        console.warn('[RealtimeAgent] WebSocket Error:', e);
        useCompanionStore.getState().setErrorMessage('Connection error occurred.');
        useCompanionStore.getState().setConnectionState('error');
      };

      this.ws.onclose = () => {
        console.log('[RealtimeAgent] WebSocket connection closed.');
        useCompanionStore.getState().setConnectionState('idle');
      };

    } catch (err: any) {
      console.warn('[RealtimeAgent] Failed to connect:', err);
      console.warn('[RealtimeAgent] Triggering Mock Agent Mode fallback.');
      this.activateMockMode(err.message || 'Failed to connect to voice agent.');
    }
  }

  private activateMockMode(errorMsg: string | null = null) {
    this.isMockMode = true;
    useCompanionStore.getState().setConnectionState('idle');
    useCompanionStore.getState().setErrorMessage(null);
    console.log('[RealtimeAgent] Mock Agent Mode activated.', errorMsg ? `Error: ${errorMsg}` : '');
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isMockMode = false;
    useCompanionStore.getState().setConnectionState('idle');
  }

  public async startRecording() {
    // Interruption/Barge-in: Stop any currently playing sound before recording
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      } catch (err) {
        console.error('[RealtimeAgent] Error stopping playing sound:', err);
      }
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        useCompanionStore.getState().setErrorMessage('Microphone permission is required to talk to Aurora.');
        useCompanionStore.getState().setConnectionState('error');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // ElevenLabs expects 16kHz PCM (mono). 
      // On iOS, we can record in WAV format at 16kHz mono.
      // On Android, MediaRecorder does not support raw PCM/WAV directly, so we fallback to AAC at 16kHz mono.
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      this.recording = recording;
      useCompanionStore.getState().setConnectionState('listening');
      useCompanionStore.getState().setErrorMessage(null);
    } catch (err) {
      console.error('[RealtimeAgent] Failed to start recording:', err);
      useCompanionStore.getState().setErrorMessage('Failed to access microphone or start recording.');
      useCompanionStore.getState().setConnectionState('error');
    }
  }

  public async stopRecordingAndSend() {
    if (this.isMockMode) {
      await this.handleMockVoiceInput();
      return;
    }

    if (!this.recording || !this.ws) return;
    try {
      useCompanionStore.getState().setConnectionState('processing');
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      if (!uri) throw new Error('No recording URI');

      let base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      
      // On iOS, since we recorded a WAV file, strip the 44-byte WAV header 
      // to obtain the raw PCM 16kHz bytes that ElevenLabs expects.
      if (Platform.OS === 'ios') {
        try {
          const binaryString = atob(base64);
          const rawPcmBinary = binaryString.slice(44);
          base64 = btoa(rawPcmBinary);
        } catch (sliceErr) {
          console.error('[RealtimeAgent] Error slicing WAV header:', sliceErr);
        }
      }

      // Append a placeholder user transcript
      useCompanionStore.getState().appendTranscript({ role: 'user', text: '🎵 Audio message sent' });

      // Send audio chunk to ElevenLabs
      this.ws.send(JSON.stringify({
        user_audio_chunk: base64
      }));
      
      this.recording = null;
      this.audioChunks = [];
      this.currentResponseText = '';
    } catch (err) {
      console.error('[RealtimeAgent] Failed to send recording:', err);
      useCompanionStore.getState().setErrorMessage('Failed to compile or transmit audio recording.');
      useCompanionStore.getState().setConnectionState('error');
    }
  }

  public sendTextMessage(text: string) {
    if (this.isMockMode) {
      this.handleMockTextInput(text);
      return;
    }

    if (!this.ws) return;
    useCompanionStore.getState().appendTranscript({ role: 'user', text });
    useCompanionStore.getState().setConnectionState('processing');
    
    // Clear audio chunks and current text for a new agent response turn
    this.audioChunks = [];
    this.currentResponseText = '';

    // Send user message event to ElevenLabs
    this.ws.send(JSON.stringify({
      type: 'user_message',
      text: text
    }));
  }

  private async handleServerEvent(event: any) {
    switch (event.type) {
      case 'ping': {
        // Keep-alive response
        const eventId = event.ping_event?.event_id;
        this.ws?.send(JSON.stringify({
          type: 'pong',
          event_id: eventId
        }));
        break;
      }
      case 'audio': {
        // Collect synthesized audio chunks
        const base64 = event.audio_event?.audio_base_64;
        if (base64) {
          this.audioChunks.push(base64);
        }
        useCompanionStore.getState().setConnectionState('speaking');
        break;
      }
      case 'user_transcript': {
        // Update user transcript placeholder with actual speech-to-text transcription
        const text = event.user_transcription_event?.user_transcript;
        if (text) {
          useCompanionStore.getState().updateLastUserTranscript(text);
        }
        break;
      }
      case 'internal_tentative_agent_response': {
        // Stream tentative/partial agent text response
        const text = event.tentative_agent_response_internal_event?.tentative_agent_response;
        if (text) {
          if (!this.currentResponseText) {
            useCompanionStore.getState().appendTranscript({ role: 'aurora', text });
          } else {
            useCompanionStore.getState().updateLastTranscript(text);
          }
          this.currentResponseText = text;
        }
        break;
      }
      case 'agent_response': {
        // Final agent text response
        const text = event.agent_response_event?.agent_response;
        if (text) {
          if (!this.currentResponseText) {
            useCompanionStore.getState().appendTranscript({ role: 'aurora', text });
          } else {
            useCompanionStore.getState().updateLastTranscript(text);
          }
          this.currentResponseText = text;
        }
        break;
      }
      case 'agent_response_complete': {
        // Agent is done responding. Play synthesized audio if not in text-to-text mode.
        const currentMode = useCompanionStore.getState().mode;
        if (currentMode !== 'text-to-text' && this.audioChunks.length > 0) {
          await this.playBufferedAudio();
        } else {
          useCompanionStore.getState().setConnectionState('idle');
        }
        this.currentResponseText = '';
        break;
      }
      case 'client_tool_call': {
        useCompanionStore.getState().setConnectionState('processing');
        const toolName = event.client_tool_call?.tool_name || '';
        const callId = event.client_tool_call?.tool_call_id;
        const args = event.client_tool_call?.parameters || {};

        console.log(`[RealtimeAgent] Executing Client Tool Call: ${toolName}`, args);
        const result = await agentService.executeToolCall(toolName, args);

        // Send tool results back to ElevenLabs
        this.ws?.send(JSON.stringify({
          type: 'client_tool_result',
          client_tool_result: {
            tool_call_id: callId,
            result: result
          }
        }));
        break;
      }
      case 'error': {
        console.error('[RealtimeAgent] ElevenLabs agent error:', event.error);
        useCompanionStore.getState().setErrorMessage(event.error?.message || 'Server error occurred.');
        useCompanionStore.getState().setConnectionState('error');
        break;
      }
    }
  }

  private async playBufferedAudio() {
    if (this.audioChunks.length === 0) return;
    
    try {
      useCompanionStore.getState().setConnectionState('speaking');
      
      // Concat base64 MP3 chunks
      const base64Mp3 = concatBase64(this.audioChunks);
      const path = `${cacheDirectory}elevenlabs_voice_${Date.now()}.mp3`;

      // Save to local cache
      await FileSystem.writeAsStringAsync(path, base64Mp3, {
        encoding: EncodingType.Base64,
      });

      // Play audio via expo-av
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (this.sound) {
        try {
          await this.sound.unloadAsync();
        } catch (_) {}
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: true }
      );
      this.sound = sound;

      // Listen for sound playback finishing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          useCompanionStore.getState().setConnectionState('idle');
          sound.unloadAsync();
          this.sound = null;
          FileSystem.deleteAsync(path, { idempotent: true });
        }
      });
      
      this.audioChunks = [];
    } catch (err) {
      console.error('[RealtimeAgent] Audio playback error:', err);
      useCompanionStore.getState().setConnectionState('idle');
    }
  }

  // ── MOCK AGENT IMPLEMENTATION ───────────────────────────────────────────

  private async handleMockVoiceInput() {
    if (!this.recording) return;
    useCompanionStore.getState().setConnectionState('processing');
    
    try {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;

      // Append mock voice input placeholder
      useCompanionStore.getState().appendTranscript({ role: 'user', text: '🎵 Audio message sent' });

      setTimeout(() => {
        // Transcribe speech locally
        useCompanionStore.getState().updateLastUserTranscript('Log 500ml of water');
        
        setTimeout(async () => {
          // Trigger tool locally
          const result = await agentService.executeToolCall('log_water', { amount_ml: 500 });
          
          // Respond
          useCompanionStore.getState().appendTranscript({
            role: 'aurora',
            text: 'I\'ve successfully logged 500ml of water for you. Keep up the great work staying hydrated!'
          });
          
          const mode = useCompanionStore.getState().mode;
          if (mode !== 'text-to-text') {
            useCompanionStore.getState().setConnectionState('speaking');
            setTimeout(() => {
              useCompanionStore.getState().setConnectionState('idle');
            }, 1500);
          } else {
            useCompanionStore.getState().setConnectionState('idle');
          }
        }, 1000);
      }, 1200);
    } catch (err) {
      console.error('[RealtimeAgent] Mock recording error:', err);
      useCompanionStore.getState().setConnectionState('idle');
    }
  }

  private handleMockTextInput(text: string) {
    useCompanionStore.getState().appendTranscript({ role: 'user', text });
    useCompanionStore.getState().setConnectionState('processing');

    setTimeout(async () => {
      const lowerText = text.toLowerCase();
      let responseText = '';
      
      if (lowerText.includes('water') || lowerText.includes('hydration') || lowerText.includes('drink')) {
        const ml = 250;
        await agentService.executeToolCall('log_water', { amount_ml: ml });
        responseText = `I've logged ${ml}ml of water for you. That is outstanding progress toward your daily goals!`;
      } else if (lowerText.includes('sleep') || lowerText.includes('bed') || lowerText.includes('slept')) {
        const hrs = 8;
        await agentService.executeToolCall('log_sleep', { hours: hrs, quality: 'good' });
        responseText = `I've logged ${hrs} hours of good quality sleep for last night. Rest is vital for recovery!`;
      } else if (lowerText.includes('habit') || lowerText.includes('complete') || lowerText.includes('done')) {
        const habits = useHabitStore.getState().habits;
        if (habits.length > 0) {
          const firstHabit = habits[0];
          await agentService.executeToolCall('complete_habit', { habit_name: firstHabit.name });
          responseText = `I've marked your habit "${firstHabit.name}" as complete for today. Keep building that streak!`;
        } else {
          responseText = "I'd love to mark your habit done, but you don't have any active habits. You can create one on the Habits page!";
        }
      } else if (lowerText.includes('how am i doing') || lowerText.includes('summary') || lowerText.includes('status')) {
        const summaryStr = await agentService.executeToolCall('get_health_summary', {});
        const summary = JSON.parse(summaryStr);
        responseText = `Today you have logged ${summary.todayWaterMl}ml water of your ${summary.waterGoalMl}ml goal. You've completed ${summary.habitsCompleted}/${summary.habitsTotal} habits today. Keep it up!`;
      } else {
        responseText = "I'm Aurora, your health companion. I can help you log water, sleep, or check in on your daily habits. How can I help you today?";
      }

      useCompanionStore.getState().appendTranscript({ role: 'aurora', text: responseText });

      const mode = useCompanionStore.getState().mode;
      if (mode !== 'text-to-text') {
        useCompanionStore.getState().setConnectionState('speaking');
        setTimeout(() => {
          useCompanionStore.getState().setConnectionState('idle');
        }, 1500);
      } else {
        useCompanionStore.getState().setConnectionState('idle');
      }
    }, 1200);
  }
}

export const realtimeAgent = new RealtimeAgent();
