// app/(auth)/index.tsx
// Aurora — Login / Landing Screen
// Per AGENTS.md: LinearGradient authBg background, fitness illustration top 55%,
// white card bottom rising, gradient CTA circular button.

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { images } from '@/constants/images';
import { useAuthStore } from '@/stores/authStore';

// Simple SVG-free icons using Unicode / Expo vector icons approach
import { Ionicons } from '@expo/vector-icons';

// Custom math easing worklet — avoids closure capture crashes on web
const easeInOut = (t: number) => {
  'worklet';
  return (1 - Math.cos(t * Math.PI)) / 2;
};

function FloatingElement({
  size,
  color,
  top,
  left,
  right,
  bottom,
  delay = 0,
  duration = 4000,
  translateY = 15,
}: any) {
  const offset = useSharedValue(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      offset.value = withRepeat(
        withSequence(
          withTiming(translateY, { duration, easing: easeInOut }),
          withTiming(0, { duration, easing: easeInOut })
        ),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [duration, translateY, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
          right,
          bottom,
          opacity: 0.6,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signInWithEmail, isLoading, error, clearError } = useAuthStore();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return;
    clearError();
    await signInWithEmail(email.trim(), password);
    // Navigation handled by root _layout once session is set
  };

  return (
    <View style={styles.root}>
      {/* ── Full-screen auth background gradient ── */}
      <LinearGradient
        colors={gradients.authBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          {/* ── Top 55%: fitness illustration + skip link ── */}
          <View style={styles.illustrationWrapper}>
            {/* Skip link — top-right corner */}
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => router.replace('/(tabs)' as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
              {/* Central glowing orb behind mascot */}
              <View style={{
                position: 'absolute',
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: 'rgba(196, 181, 253, 0.25)',
                transform: [{ scale: 1.2 }],
              }} />
              
              <FloatingElement size={40} color={colors.accentPurple} top="20%" left="15%" duration={3500} translateY={12} delay={0} />
              <FloatingElement size={24} color={colors.accentPink} top="65%" left="10%" duration={4200} translateY={-15} delay={500} />
              <FloatingElement size={70} color="rgba(196, 181, 253, 0.4)" top="18%" right="8%" duration={5000} translateY={18} delay={200} />
              <FloatingElement size={18} color={colors.accentPurple} top="75%" right="15%" duration={3000} translateY={-10} delay={800} />
              <FloatingElement size={32} color={colors.accentPink} top="45%" left="78%" duration={4800} translateY={15} delay={100} />
            </View>

            <Image
              source={images.auroraMascot}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* ── Bottom card rising from bottom ── */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* Heading */}
              <Text style={styles.heading}>Please Login</Text>
              <Text style={styles.subheading}>
                Sign in to your Aurora account
              </Text>

              {/* Error banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Email input */}
              <View style={styles.inputRow}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>

              {/* Password input */}
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Forget details */}
              <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forget Details?</Text>
              </TouchableOpacity>

              {/* CTA: circular 56px gradient button + "Create account" link */}
              <View style={styles.ctaRow}>
                <View style={styles.ctaLeft}>
                  <Text style={styles.ctaLabel}>Sign In</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(auth)/signup')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.createAccount}>Create account</Text>
                  </TouchableOpacity>
                </View>

                {/* Circular gradient CTA button */}
                <TouchableOpacity
                  onPress={handleSignIn}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={gradients.ctaButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaButton}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },

  // ── Illustration ──────────────────────────────────────────────────────────
  illustrationWrapper: {
    flex: 0,
    height: '55%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,         // 24px per spec
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#9499A7',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  heading: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderHairline,
    marginBottom: 20,
    paddingBottom: 10,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,          // remove default TextInput padding
  },

  // ── Footer row ────────────────────────────────────────────────────────────
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 28,
  },
  forgotText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Skip link — sits top-right inside the illustration area
  skipBtn: {
    position: 'absolute',
    top: 16,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  skipText: {
    color: colors.accentPurple,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaLeft: {
    gap: 4,
  },
  ctaLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  createAccount: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  // Circular 56px gradient CTA button — per AGENTS.md spec
  ctaButton: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
