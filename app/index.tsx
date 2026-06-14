import { Redirect } from 'expo-router';

// Entry point: redirect to onboarding.
// Later: check auth session + profile.onboarding_done here to route appropriately.
export default function Index() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Redirect href={'/(onboarding)' as any} />;
}
