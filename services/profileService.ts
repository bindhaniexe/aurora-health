import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ProfileService getProfile error:', error);
      throw new Error('Something went wrong fetching your profile. Please try again.');
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ProfileService updateProfile error:', error);
      throw new Error('Something went wrong updating your profile. Please try again.');
    }
  },

  async markOnboardingDone(userId: string): Promise<Profile> {
    return this.updateProfile(userId, { onboarding_done: true });
  }
};
