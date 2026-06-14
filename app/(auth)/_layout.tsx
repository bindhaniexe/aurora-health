// app/(auth)/_layout.tsx
// Stack layout for auth screens — no header, auth background colour
import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgAuth },
        animation: 'fade',
      }}
    />
  );
}
