// app/(auth)/signup.tsx
// Aurora — Sign Up Screen
// Same visual language as login: gradient bg, fitness illustration, white card, gradient CTA.

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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { images } from '@/constants/images';
import { useAuthStore } from '@/stores/authStore';
import { PressableScale } from '@/components/animated/PressableScale';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

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

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { signUpWithEmail, signInWithGoogle, isLoading, error, clearError } = useAuthStore();

  const displayError = localError || error;

  const handleSignUp = async () => {
    clearError();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords don't match. Please try again.");
      return;
    }

    await signUpWithEmail(email.trim(), password, name.trim());
    // Navigation handled by root _layout once session is set (or confirmation prompt)
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setLocalError(null);
    await signInWithGoogle();
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

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Top illustration (smaller to give more room to taller form) ── */}
            <View style={styles.illustrationWrapper}>
              <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                {/* Central glowing orb behind mascot */}
                <View style={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: 'rgba(196, 181, 253, 0.25)',
                  transform: [{ scale: 1.2 }],
                }} />
                
                <FloatingElement size={32} color={colors.accentPurple} top="25%" left="15%" duration={3500} translateY={10} delay={0} />
                <FloatingElement size={18} color={colors.accentPink} top="65%" left="12%" duration={4200} translateY={-12} delay={500} />
                <FloatingElement size={50} color="rgba(196, 181, 253, 0.4)" top="22%" right="10%" duration={5000} translateY={15} delay={200} />
                <FloatingElement size={16} color={colors.accentPurple} top="70%" right="18%" duration={3000} translateY={-8} delay={800} />
                <FloatingElement size={24} color={colors.accentPink} top="48%" left="78%" duration={4800} translateY={12} delay={100} />
              </View>

              <Image
                source={images.signupIllustration}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Dynamic spacer to push card to bottom if there is room */}
            <View style={styles.spacer} />

            <View style={styles.card}>
              <Text style={styles.heading}>Create Account</Text>
              <Text style={styles.subheading}>
                Start your wellness journey with Aurora
              </Text>

              {/* Error banner */}
              {displayError ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              ) : null}

              {/* Name */}
              <View style={styles.inputRow}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  editable={!isLoading}
                />
              </View>

              {/* Email */}
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

              {/* Password */}
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
                  returnKeyType="next"
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

              {/* Confirm password */}
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* CTA row */}
              <View style={styles.ctaRow}>
                <View style={styles.ctaLeft}>
                  <Text style={styles.ctaLabel}>Get Started</Text>
                  <PressableScale
                    onPress={() => router.back()}
                    scaleDown={0.96}
                  >
                    <Text style={styles.loginLink}>Already have an account?</Text>
                  </PressableScale>
                </View>

                {/* Circular gradient CTA button */}
                <PressableScale
                  onPress={handleSignUp}
                  disabled={isLoading}
                  scaleDown={0.92}
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
                </PressableScale>
              </View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-Up Button */}
              <PressableScale
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                scaleDown={0.97}
                style={styles.googleButton}
              >
                <Ionicons name="logo-google" size={18} color={colors.textPrimary} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </PressableScale>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scrollView: { flex: 1 },
  spacer: {
    flex: 1,
    minHeight: 16,
  },

  illustrationWrapper: {
    flex: 0,
    height: SCREEN_HEIGHT * 0.28,   // Slightly shorter than login to fit 4-field form
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },

  scrollContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    marginHorizontal: 16,
    marginBottom: 28,
    padding: 24,
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

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderHairline,
    marginBottom: 20,
    paddingBottom: 10,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ctaLeft: { gap: 4 },
  ctaLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  loginLink: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  ctaButton: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderHairline,
  },
  dividerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.pill,
    height: 48,
    gap: 8,
  },
  googleIcon: {
    marginRight: 4,
  },
  googleButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
});
