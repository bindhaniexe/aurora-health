import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
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
  const { connectionState, transcript, errorMessage, clearTranscript } = useCompanionStore();
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (connectionState === 'idle') {
        realtimeAgent.connect();
      }
      return () => {
        // Disconnect can be done if we want session per visit
      };
    }, [connectionState])
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

  const getStatusText = () => {
    switch (connectionState) {
      case 'idle': return 'Tap to talk';
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Aurora is speaking...';
      case 'error': return errorMessage === 'Failed to fetch session token' ? 'Tuning Aurora...' : 'Connection error';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FloatingOrbs variant="calm" count={3} />
      <ScreenTransition entering={FadeIn}>
      <View style={styles.header}>
        <Text style={styles.title}>Aurora</Text>
        <Text style={styles.subtitle}>Your AI Health Companion</Text>
        <PressableScale style={styles.clearButton} onPress={clearTranscript} scaleDown={0.9}>
          <Feather name="trash-2" size={18} color={colors.textSecondary} />
        </PressableScale>
      </View>

      {errorMessage && errorMessage !== 'Failed to fetch session token' && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <PressableScale onPress={() => realtimeAgent.connect()} scaleDown={0.96}>
            <Text style={styles.retryText}>Retry</Text>
          </PressableScale>
        </View>
      )}

      <ScrollView 
        ref={scrollViewRef}
        style={styles.transcriptList}
        contentContainerStyle={styles.transcriptContent}
      >
        {transcript.length === 0 && connectionState !== 'processing' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Tap the mic to start talking to Aurora
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

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.footer}
      >
        <MicButton state={connectionState} onPress={handleMicPress} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
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
    paddingBottom: 16,
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
    marginTop: 16,
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
    fontSize: 16,
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
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 24,
  },
  statusText: {
    marginTop: 16,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
