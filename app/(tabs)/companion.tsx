import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { useCompanionStore } from '@/stores/companionStore';
import { realtimeAgent } from '@/lib/realtimeAgent';
import { FadeIn } from 'react-native-reanimated';
import { ScreenTransition } from '@/components/animated/ScreenTransition';
import { FloatingOrbs } from '@/components/animated/FloatingOrbs';
import { PressableScale } from '@/components/animated/PressableScale';

export default function CompanionScreen() {
  const { connectionState, transcript, errorMessage, setMode, clearTranscript } = useCompanionStore();
  const [textMessage, setTextMessage] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Always default to 'text-to-speech' to ensure both audio output and transcription are active
    setMode('text-to-speech');
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Connect when screen comes into focus
      realtimeAgent.connect();
      
      return () => {
        // Disconnect when screen goes out of focus to save API resources
        realtimeAgent.disconnect();
      };
    }, [])
  );

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [transcript]);

  const handleMicPress = () => {
    if (connectionState === 'idle' || connectionState === 'speaking' || connectionState === 'error') {
      realtimeAgent.startRecording();
    } else if (connectionState === 'listening') {
      realtimeAgent.stopRecordingAndSend();
    }
  };

  const handleSendPress = () => {
    if (!textMessage.trim()) return;
    realtimeAgent.sendTextMessage(textMessage.trim());
    setTextMessage('');
  };

  const handleSuggestionPress = (suggestionText: string) => {
    realtimeAgent.sendTextMessage(suggestionText);
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'idle': return 'Aurora is ready';
      case 'listening': return 'Listening... Speak now.';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Aurora is speaking...';
      case 'error': return 'Connection error';
      default: return '';
    }
  };

  const SUGGESTIONS = [
    { id: 'water-250', text: 'Log 250ml water', label: '💧 Log 250ml water' },
    { id: 'water-500', text: 'Log 500ml water', label: '💧 Log 500ml water' },
    { id: 'sleep-stats', text: 'How was my sleep last night?', label: '😴 Sleep status' },
    { id: 'habit-complete', text: 'Complete my first habit', label: '✅ Complete habit' },
    { id: 'health-summary', text: 'How am I doing today?', label: '📊 Health summary' }
  ];

  // Calculate bottom padding: when keyboard is shown, keep it small;
  // when keyboard is hidden, pad it to sit above the floating tab bar (height ~68 + bottom offset ~16-34 + spacing ~8)
  const bottomPadding = isKeyboardVisible 
    ? 12 
    : Math.max(insets.bottom, 16) + 76;

  return (
    <SafeAreaView style={styles.safeArea}>
      <FloatingOrbs variant="calm" count={3} />
      <ScreenTransition entering={FadeIn}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Aurora</Text>
          <Text style={styles.subtitle}>Your AI Health Companion</Text>
          <PressableScale style={styles.clearButton} onPress={clearTranscript} scaleDown={0.9}>
            <Feather name="trash-2" size={18} color={colors.textSecondary} />
          </PressableScale>
        </View>

        {/* Error notification bar */}
        {errorMessage && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <PressableScale onPress={() => realtimeAgent.connect()} scaleDown={0.96}>
              <Text style={styles.retryText}>Retry</Text>
            </PressableScale>
          </View>
        )}

        {/* Chat / Transcript view */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.transcriptList}
          contentContainerStyle={styles.transcriptContent}
        >
          {transcript.length === 0 && connectionState !== 'processing' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Ask Aurora to log your health stats or chat about your day!
              </Text>
            </View>
          )}
          
          {transcript.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.bubbleWrapper,
                item.role === 'user' ? styles.bubbleWrapperUser : styles.bubbleWrapperAurora
              ]}
            >
              {item.role === 'aurora' ? (
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBorder}
                >
                  <View style={styles.bubbleAurora}>
                    <Text style={styles.textAurora}>{item.text}</Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.bubbleUser}>
                  <Text style={styles.textUser}>{item.text}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Footer controls: Keyboard Typing Bar, Inline Mic, and Suggestions */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={[styles.footer, { paddingBottom: bottomPadding }]}
        >
          {/* Status message */}
          {connectionState !== 'idle' && (
            <Text style={styles.typingStatusText}>{getStatusText()}</Text>
          )}

          {/* Floating Suggestions */}
          {!isKeyboardVisible && (
            <View style={styles.suggestionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsContent}
              >
                {SUGGESTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSuggestionPress(item.text)}
                    activeOpacity={0.8}
                    style={styles.suggestionChip}
                  >
                    <Text style={styles.suggestionChipText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Chat Bar Container */}
          <View style={styles.textControlWrapper}>
            <View style={styles.inputBarContainer}>
              {/* Inline Mic Button */}
              <TouchableOpacity
                onPress={handleMicPress}
                activeOpacity={0.7}
                style={[
                  styles.inlineMicButton,
                  connectionState === 'listening' && styles.inlineMicButtonListening
                ]}
              >
                {connectionState === 'listening' ? (
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inlineMicGradient}
                  >
                    <Feather name="mic" size={18} color="white" />
                  </LinearGradient>
                ) : connectionState === 'processing' ? (
                  <View style={styles.inlineMicSpinner}>
                    <Feather name="loader" size={18} color={colors.accentPurple} />
                  </View>
                ) : connectionState === 'speaking' ? (
                  <LinearGradient
                    colors={gradients.ctaButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inlineMicGradient}
                  >
                    <Feather name="volume-2" size={18} color="white" />
                  </LinearGradient>
                ) : (
                  <Feather name="mic" size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              {/* TextInput */}
              <TextInput
                style={styles.textInput}
                value={textMessage}
                onChangeText={setTextMessage}
                placeholder={connectionState === 'listening' ? "Listening... Speak now." : "Message Aurora..."}
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleSendPress}
                multiline={false}
                editable={connectionState === 'idle' || connectionState === 'speaking' || connectionState === 'error'}
              />

              {/* Send Button */}
              {textMessage.trim().length > 0 && (
                <TouchableOpacity 
                  onPress={handleSendPress}
                  disabled={connectionState === 'listening' || connectionState === 'processing'}
                  style={{ opacity: 1 }}
                >
                  <LinearGradient
                    colors={gradients.ctaButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendButton}
                  >
                    <Feather name="send" size={16} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScreenTransition>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderHairline,
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  clearButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: radius.md,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.error,
  },
  retryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.error,
  },
  transcriptList: {
    flex: 1,
  },
  transcriptContent: {
    padding: 20,
    paddingBottom: 220, // generous bottom padding to allow scrolling past floating chat input & tab bar
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bubbleWrapper: {
    maxWidth: '85%',
  },
  bubbleWrapperUser: {
    alignSelf: 'flex-end',
  },
  bubbleWrapperAurora: {
    alignSelf: 'flex-start',
  },
  bubbleUser: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
  },
  textUser: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPrimary,
  },
  gradientBorder: {
    padding: 1.5,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
  },
  bubbleAurora: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg - 1.5,
    borderBottomLeftRadius: 3,
  },
  textAurora: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  footer: {
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.borderHairline,
    paddingTop: 8,
  },
  typingStatusText: {
    marginBottom: 6,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    alignSelf: 'center',
  },
  textControlWrapper: {
    paddingHorizontal: 20,
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  inlineMicButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginRight: 4,
  },
  inlineMicButtonListening: {
    backgroundColor: 'transparent',
  },
  inlineMicGradient: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineMicSpinner: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  suggestionsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: colors.bgChip,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E8E6F4',
  },
  suggestionChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.accentPurple,
  },
});
