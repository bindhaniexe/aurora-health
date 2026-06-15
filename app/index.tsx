/**
 * app/index.tsx — Pure loading screen.
 *
 * All routing logic lives in _layout.tsx.  This screen is only ever
 * visible for the brief moment between font load and the initial
 * redirect firing.  It shows nothing (transparent) so there is no
 * visible flash.
 */
import { View } from 'react-native';
import { colors } from '@/constants/colors';

export default function Index() {
  // Intentionally empty — _layout.tsx handles all redirects.
  return <View style={{ flex: 1, backgroundColor: colors.bgAuth }} />;
}
