import { create } from 'zustand';

export type CompanionState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface TranscriptItem {
  id: string;
  role: 'user' | 'aurora';
  text: string;
}

interface CompanionStore {
  connectionState: CompanionState;
  transcript: TranscriptItem[];
  errorMessage: string | null;
  
  setConnectionState: (state: CompanionState) => void;
  setErrorMessage: (msg: string | null) => void;
  appendTranscript: (item: Omit<TranscriptItem, 'id'>) => void;
  updateLastTranscript: (text: string) => void;
  clearTranscript: () => void;
}

export const useCompanionStore = create<CompanionStore>((set) => ({
  connectionState: 'idle',
  transcript: [],
  errorMessage: null,

  setConnectionState: (state) => set({ connectionState: state }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  appendTranscript: (item) => set((state) => ({
    transcript: [...state.transcript, { ...item, id: Date.now().toString() + Math.random().toString(36).substring(7) }]
  })),
  updateLastTranscript: (text) => set((state) => {
    const transcript = [...state.transcript];
    if (transcript.length > 0) {
      transcript[transcript.length - 1].text = text;
    }
    return { transcript };
  }),
  clearTranscript: () => set({ transcript: [] }),
}));
