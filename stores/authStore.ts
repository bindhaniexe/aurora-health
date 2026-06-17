// stores/authStore.ts
// Aurora — Auth global state via Zustand
// Per AGENTS.md: stores manage global client state; Supabase calls go through services.
// Auth is the one exception — direct supabase.auth calls are acceptable in the auth store.

import { create } from 'zustand';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  /** True when user explicitly skipped login — allows unauthenticated tab access */
  guestMode: boolean;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setGuestMode: (value: boolean) => void;
  signInWithGoogle: () => Promise<void>;
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

function extractParamsFromUrl(url: string): { access_token?: string; refresh_token?: string; error?: string; error_description?: string } {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  let paramsString = '';
  
  if (hashIndex !== -1) {
    paramsString = url.substring(hashIndex + 1);
  } else if (queryIndex !== -1) {
    paramsString = url.substring(queryIndex + 1);
  } else {
    return {};
  }
  
  const params: Record<string, string> = {};
  paramsString.split('&').forEach((part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  return params;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  error: null,
  guestMode: false,

  clearError: () => set({ error: null }),
  setGuestMode: (value: boolean) => set({ guestMode: value }),

  initialize: async () => {
    set({ isLoading: true });

    try {
      // Race getSession against a 5-second timeout so the app never hangs
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth init timeout')), 5000)
      );
      const sessionPromise = supabase.auth.getSession();

      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise,
      ]) as Awaited<typeof sessionPromise>;

      if (error) throw error;

      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
      });

      // Subscribe to future auth state changes (token refresh, sign out, etc.)
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (err) {
      // On timeout or error — treat as no session so the app can continue
      console.warn('Auth init failed:', (err as Error).message);
      set({ isLoading: false, session: null, user: null });
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
      // Clear guest mode on sign out so routing guard redirects correctly
      set({ session: null, user: null, isLoading: false, guestMode: false });
    } catch (err) {
      set({ isLoading: false, error: parseAuthError(err as AuthError) });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      
      if (Platform.OS === 'web') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error('No URL returned from Supabase OAuth sign-in.');

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      if (res.type === 'success' && res.url) {
        const params = extractParamsFromUrl(res.url);
        
        if (params.error_description || params.error) {
          throw new Error(params.error_description || params.error);
        }
        
        const { access_token, refresh_token } = params;
        if (access_token && refresh_token) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
          set({
            session: sessionData.session,
            user: sessionData.user,
            isLoading: false,
          });
        } else {
          throw new Error('Authentication tokens were not found in the callback URL.');
        }
      } else {
        // User cancelled or closed browser
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('[AuthStore] Google Sign-in error:', err);
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Google sign-in failed. Please try again.',
      });
    }
  },
}));
