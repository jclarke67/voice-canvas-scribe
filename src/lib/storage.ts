
import { Note, Recording } from '@/types';

// Get all notes from localStorage
export const getNotes = (): Note[] => {
  const notesJson = localStorage.getItem('voice-canvas-notes');
  if (!notesJson) return [];
  
  try {
    return JSON.parse(notesJson);
  } catch (error) {
    console.error('Failed to parse notes from localStorage', error);
    return [];
  }
};

// Save notes to localStorage
export const saveNotes = (notes: Note[]): void => {
  localStorage.setItem('voice-canvas-notes', JSON.stringify(notes));
};

// Generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Create a new empty note
export const createEmptyNote = (): Note => {
  const now = Date.now();
  return {
    id: generateId(),
    title: 'Untitled Note',
    content: '',
    createdAt: now,
    updatedAt: now,
    recordings: [],
  };
};

// Save audio blob to localStorage (base64 encoded)
export const saveAudioToStorage = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const audioId = generateId();
      localStorage.setItem(`audio-${audioId}`, base64data);
      resolve(audioId);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Get audio blob from localStorage
export const getAudioFromStorage = (audioId: string): string | null => {
  return localStorage.getItem(`audio-${audioId}`);
};

// Remove audio blob from localStorage
export const removeAudioFromStorage = (audioId: string): void => {
  localStorage.removeItem(`audio-${audioId}`);
};
