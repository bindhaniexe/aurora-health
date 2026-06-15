import { create } from 'zustand';
import { Profile } from '@/types';
import { profileService } from '@/services/profileService';
import { useAuthStore } from '@/stores/authStore';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  markOnboardingDone: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    const { guestMode } = useAuthStore.getState();
    if (guestMode) {
      set({
        profile: {
          id: 'guest',
          name: 'Guest User',
          water_goal_ml: 2500,
          sleep_goal_hrs: 8,
          goals: ['Hydration', 'Better Sleep'],
          onboarding_done: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        isLoading: false,
        error: null,
      });
      return;
    }

    const user = useAuthStore.getState().user;
    if (!user) {
      set({ profile: null, error: 'No authenticated user' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const profile = await profileService.getProfile(user.id);
      set({ profile, isLoading: false });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message || 'Failed to fetch profile', isLoading: false });
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { profile } = get();
    const { user, guestMode } = useAuthStore.getState();
    
    if (guestMode && profile) {
      set({ profile: { ...profile, ...updates } });
      return;
    }

    if (!user || !profile) return;

    // Optimistic update
    set({ profile: { ...profile, ...updates } });

    try {
      const updated = await profileService.updateProfile(user.id, updates);
      set({ profile: updated });
    } catch (err: unknown) {
      const error = err as Error;
      // Revert on error
      set({ profile, error: error.message || 'Failed to update profile' });
    }
  },

  markOnboardingDone: async () => {
    const { updateProfile } = get();
    await updateProfile({ onboarding_done: true });
  }
}));
