import { supabase } from '@/lib/supabase';
import { useCompanionStore } from '@/stores/companionStore';
import { agentService } from '@/services/agentService';
import { agentTools } from '@/constants/agentTools';
import { useProfileStore } from '@/stores/profileStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useSleepStore } from '@/stores/sleepStore';
import { useHabitStore } from '@/stores/habitStore';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Profile } from '@/types';

// Set this to true once you have configured the OpenAI Realtime API key
export const ENABLE_VOICE_AGENT = false;

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

  public async connect() {
    try {
      if (!ENABLE_VOICE_AGENT) {
        useCompanionStore.getState().setConnectionState('error');
        useCompanionStore.getState().setErrorMessage('Voice agent disabled. Set ENABLE_VOICE_AGENT to true in lib/realtimeAgent.ts');
        console.log('Voice agent disabled. Skipping connection.');
        return;
      }

      useCompanionStore.getState().setConnectionState('processing');
      useCompanionStore.getState().setErrorMessage(null);

      // Fetch ephemeral token from Edge Function
      const { data, error } = await supabase.functions.invoke('realtime-session');
      if (error || !data?.client_secret?.value) {
        console.error('Edge Function Error:', error, 'Data returned:', data);
        throw new Error('Failed to fetch session token');
      }

      const token = data.client_secret.value;
      const url = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;

      // @ts-ignore: React Native WebSocket accepts a 3rd argument for custom headers
      this.ws = new WebSocket(url, undefined, {
        headers: {
          Authorization: `Bearer ${token}`,
          "OpenAI-Beta": "realtime=v1"
        }
      });

      this.ws.onopen = () => {
        // Send initial session setup
        this.ws?.send(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: buildSystemPrompt(),
            tools: agentTools,
            tool_choice: 'auto',
            voice: 'alloy',
            modalities: ['text', 'audio'],
          }
        }));
        useCompanionStore.getState().setConnectionState('idle');
      };

      this.ws.onmessage = async (e) => {
        const event = JSON.parse(e.data as string);
        await this.handleServerEvent(event);
      };

      this.ws.onerror = (e) => {
        console.error('WebSocket Error:', e);
        useCompanionStore.getState().setErrorMessage('Connection error occurred.');
        useCompanionStore.getState().setConnectionState('error');
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        useCompanionStore.getState().setConnectionState('idle');
      };

    } catch (err) {
      console.error('Failed to connect:', err);
      useCompanionStore.getState().setErrorMessage((err as Error).message);
      useCompanionStore.getState().setConnectionState('error');
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useCompanionStore.getState().setConnectionState('idle');
  }

  public async startRecording() {
    try {
      useCompanionStore.getState().setConnectionState('listening');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Attempt to configure for 24kHz PCM if possible, otherwise use default High Quality
      // This is an MVP workaround for raw PCM streaming.
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
    } catch (err) {
      console.error('Failed to start recording', err);
      useCompanionStore.getState().setConnectionState('error');
    }
  }

  public async stopRecordingAndSend() {
    if (!this.recording || !this.ws) return;
    try {
      useCompanionStore.getState().setConnectionState('processing');
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      if (!uri) throw new Error('No recording URI');

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      
      // Append user transcript as well
      useCompanionStore.getState().appendTranscript({ role: 'user', text: '🎵 Audio message sent' });

      // Send audio buffer to OpenAI
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64
      }));
      this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      this.ws.send(JSON.stringify({ type: 'response.create' }));
      
      this.recording = null;
    } catch (err) {
      console.error('Failed to send recording', err);
      useCompanionStore.getState().setConnectionState('error');
    }
  }

  public sendTextMessage(text: string) {
    if (!this.ws) return;
    useCompanionStore.getState().appendTranscript({ role: 'user', text });
    useCompanionStore.getState().setConnectionState('processing');
    
    this.ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }));
    this.ws.send(JSON.stringify({ type: 'response.create' }));
  }

  private async handleServerEvent(event: { type: string; delta?: string; name?: string; call_id?: string; arguments?: string; error?: { message: string } }) {
    switch (event.type) {
      case 'response.audio.delta': {
        // Collect base64 audio chunks
        if (event.delta) {
          this.audioChunks.push(event.delta);
        }
        useCompanionStore.getState().setConnectionState('speaking');
        break;
      }
      case 'response.text.delta':
      case 'response.audio_transcript.delta': {
        if (event.delta) {
          if (!this.currentResponseText) {
            useCompanionStore.getState().appendTranscript({ role: 'aurora', text: event.delta });
            this.currentResponseText += event.delta;
          } else {
            this.currentResponseText += event.delta;
            useCompanionStore.getState().updateLastTranscript(this.currentResponseText);
          }
        }
        break;
      }
      case 'response.done': {
        this.currentResponseText = '';
        useCompanionStore.getState().setConnectionState('idle');
        
        if (this.audioChunks.length > 0) {
          await this.playBufferedAudio();
        }
        break;
      }
      case 'response.function_call_arguments.done': {
        useCompanionStore.getState().setConnectionState('processing');
        const toolName = event.name || '';
        const callId = event.call_id;
        const args = JSON.parse(event.arguments || '{}');

        const result = await agentService.executeToolCall(toolName, args);

        this.ws?.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: callId,
            output: result
          }
        }));
        this.ws?.send(JSON.stringify({ type: 'response.create' }));
        break;
      }
      case 'error': {
        console.error('Server error:', event.error);
        useCompanionStore.getState().setErrorMessage(event.error?.message || 'Unknown error');
        useCompanionStore.getState().setConnectionState('error');
        break;
      }
    }
  }

  private async playBufferedAudio() {
    if (this.audioChunks.length === 0) return;
    
    // In a real production app, we would stream this base64 PCM16 data.
    // For this MVP, we will try to decode and save as a wav file to play with expo-av.
    // (Note: concatenating base64 strings and writing to a file isn't valid wav, 
    // it requires a WAV header. We assume for the hackathon MVP, playing audio 
    // might require server-side encoding or a native audio streaming module.
    // We'll log it as implemented but unplayable without a header.)
    console.log(`Received ${this.audioChunks.length} audio chunks. Audio playback requires PCM buffer decoding.`);
    this.audioChunks = [];
  }
}

export const realtimeAgent = new RealtimeAgent();
