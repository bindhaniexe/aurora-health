import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { MicButton } from '@/components/MicButton';
import { useCompanionStore } from '@/stores/companionStore';
import { realtimeAgent } from '@/lib/realtimeAgent';
import { FadeIn } from 'react-native-reanimated';
import { ScreenTransition } from '@/components/animated/ScreenTransition';
import { FloatingOrbs } from '@/components/animated/FloatingOrbs';
import { PressableScale } from '@/components/animated/PressableScale';

export default function CompanionScreen() {
  const { connectionState, mode, transcript, errorMessage, setMode, clearTranscript } = useCompanionStore();
  const [textMessage, setTextMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

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
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [transcript]);

  const handleMicPress = () => {
    if (connectionState === 'idle' || connectionState === 'speaking') {
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

  const getStatusText = () => {
    switch (connectionState) {
      case 'idle': return mode === 'voice' ? 'Tap to talk' : 'Aurora is ready';
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Aurora is speaking...';
      case 'error': return 'Connection error';
      default: return '';
    }
  };

  const modes = [
    { id: 'voice', label: 'Voice', icon: 'mic' },
    { id: 'text-to-speech', label: 'Speak back', icon: 'volume-2' },
    { id: 'text-to-text', label: 'Text only', icon: 'message-square' }
  ] as const;

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

        {/* Mode Selector Segmented Tabs */}
        <View style={styles.modeContainer}>
          <View style={styles.modePillBg}>
            {modes.map((m) => {
              const isSelected = mode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setMode(m.id)}
                  style={styles.modeTab}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.modePillActive}
                    >
                      <Feather name={m.icon as any} size={14} color={colors.textOnGradient} style={{ marginRight: 6 }} />
                      <Text style={styles.modeTextActive}>{m.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.modePillInactive}>
                      <Feather name={m.icon as any} size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={styles.modeTextInactive}>{m.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
                {mode === 'voice' 
                  ? 'Tap the mic to start talking to Aurora' 
                  : 'Type a message to start conversing with Aurora'}
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

        {/* Footer controls: Mic button or Keyboard Typing Bar */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.footer}
        >
          {mode === 'voice' ? (
            <View style={styles.voiceControlWrapper}>
              <MicButton state={connectionState} onPress={handleMicPress} />
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          ) : (
            <View style={styles.textControlWrapper}>
              {connectionState !== 'idle' && (
                <Text style={styles.typingStatusText}>{getStatusText()}</Text>
              )}
              <View style={styles.inputBarContainer}>
                <TextInput
                  style={styles.textInput}
                  value={textMessage}
                  onChangeText={setTextMessage}
                  placeholder={mode === 'text-to-speech' ? "Message Aurora (speaks back)..." : "Message Aurora..."}
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleSendPress}
                  multiline={false}
                  editable={connectionState === 'idle' || connectionState === 'speaking'}
                />
                <TouchableOpacity 
                  onPress={handleSendPress}
                  disabled={!textMessage.trim() || (connectionState !== 'idle' && connectionState !== 'speaking')}
                  style={{ opacity: textMessage.trim() ? 1 : 0.5 }}
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
              </View>
            </View>
          )}
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
  modeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
  },
  modePillBg: {
    flexDirection: 'row',
    backgroundColor: colors.bgInput,
    borderRadius: radius.pill,
    padding: 4,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'space-between',
  },
  modeTab: {
    flex: 1,
  },
  modePillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  modePillInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  modeTextActive: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textOnGradient,
  },
  modeTextInactive: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
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
    paddingBottom: 40,
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
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
    paddingBottom: Platform.OS === 'ios' ? 20 : 20,
    backgroundColor: colors.bgPrimary,
  },
  voiceControlWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusText: {
    marginTop: 12,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  textControlWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  typingStatusText: {
    marginBottom: 6,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    alignSelf: 'center',
  },
  inputBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
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
    marginLeft: 8,
  },
});
