import { create } from 'zustand';

export type CompanionState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
export type CompanionMode = 'voice' | 'text-to-speech' | 'text-to-text';

export interface TranscriptItem {
  id: string;
  role: 'user' | 'aurora';
  text: string;
}

interface CompanionStore {
  connectionState: CompanionState;
  mode: CompanionMode;
  transcript: TranscriptItem[];
  errorMessage: string | null;
  
  setConnectionState: (state: CompanionState) => void;
  setMode: (mode: CompanionMode) => void;
  setErrorMessage: (msg: string | null) => void;
  appendTranscript: (item: Omit<TranscriptItem, 'id'>) => void;
  updateLastTranscript: (text: string) => void;
  updateLastUserTranscript: (text: string) => void;
  clearTranscript: () => void;
}

export const useCompanionStore = create<CompanionStore>((set) => ({
  connectionState: 'idle',
  mode: 'voice',
  transcript: [],
  errorMessage: null,

  setConnectionState: (state) => set({ connectionState: state }),
  setMode: (mode) => set({ mode }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  appendTranscript: (item) => set((state) => ({
    transcript: [...state.transcript, { ...item, id: Date.now().toString() + Math.random().toString(36).substring(7) }]
  })),
  updateLastTranscript: (text) => set((state) => {
    const transcript = [...state.transcript];
    const lastIdx = transcript.map(t => t.role).lastIndexOf('aurora');
    if (lastIdx !== -1) {
      transcript[lastIdx].text = text;
    } else if (transcript.length > 0) {
      transcript[transcript.length - 1].text = text;
    }
    return { transcript };
  }),
  updateLastUserTranscript: (text) => set((state) => {
    const transcript = [...state.transcript];
    const lastIdx = transcript.map(t => t.role).lastIndexOf('user');
    if (lastIdx !== -1) {
      transcript[lastIdx].text = text;
    }
    return { transcript };
  }),
  clearTranscript: () => set({ transcript: [] }),
}));
