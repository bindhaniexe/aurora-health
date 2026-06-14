// stores/authStore.ts
// Aurora — Auth global state via Zustand
// Per AGENTS.md: stores manage global client state; Supabase calls go through services.
// Auth is the one exception — direct supabase.auth calls are acceptable in the auth store.

import { create } from 'zustand';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Human-readable error messages for Supabase auth error codes
function parseAuthError(error: AuthError | Error): string {
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Please sign in.';
  }
  if (msg.includes('password should be')) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }
  return error.message || 'Something went wrong. Please try again.';
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    set({ isLoading: true });

    try {
      // 1. Get current session from SecureStore (via Supabase adapter)
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
      });

      // 2. Subscribe to future auth state changes (token refresh, sign out, etc.)
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (err) {
      set({ isLoading: false, error: parseAuthError(err as AuthError) });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ session: data.session, user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: parseAuthError(err as AuthError) });
    }
  },

  signUpWithEmail: async (email: string, password: string, _name: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // name stored in profiles table; passed via metadata for the trigger
          data: { name: _name },
        },
      });
      if (error) throw error;
      // If email confirmation is required, session will be null — that's fine.
      set({ session: data.session, user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: parseAuthError(err as AuthError) });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null, user: null, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: parseAuthError(err as AuthError) });
    }
  },
}));
