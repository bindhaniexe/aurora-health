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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { gradients } from '@/constants/gradients';
import { radius } from '@/constants/radius';
import { images } from '@/constants/images';
import { useAuthStore } from '@/stores/authStore';
import { PressableScale } from '@/components/animated/PressableScale';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { signUpWithEmail, isLoading, error, clearError } = useAuthStore();

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
          {/* ── Top illustration (smaller to give more room to taller form) ── */}
          <View style={styles.illustrationWrapper}>
            <Image
              source={images.fitnessHero}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* ── White card form ── */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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

  illustrationWrapper: {
    flex: 0,
    height: '42%',   // Slightly shorter than login to fit 4-field form
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
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    marginHorizontal: 16,
    marginBottom: 16,
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
});
