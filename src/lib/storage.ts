
import { Note, Recording, Folder, SummarySettings } from '@/types';

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

// Get synced notes from localStorage
export const getSyncedNotes = (): Note[] => {
  const notesJson = localStorage.getItem('voice-canvas-synced-notes');
  if (!notesJson) return [];
  
  try {
    return JSON.parse(notesJson);
  } catch (error) {
    console.error('Failed to parse synced notes from localStorage', error);
    return [];
  }
};

// Save synced notes to localStorage
export const saveSyncedNotes = (notes: Note[]): void => {
  localStorage.setItem('voice-canvas-synced-notes', JSON.stringify(notes));
};

// Get all folders from localStorage
export const getFolders = (): Folder[] => {
  const foldersJson = localStorage.getItem('voice-canvas-folders');
  if (!foldersJson) return [];
  
  try {
    return JSON.parse(foldersJson);
  } catch (error) {
    console.error('Failed to parse folders from localStorage', error);
    return [];
  }
};

// Save folders to localStorage
export const saveFolders = (folders: Folder[]): void => {
  localStorage.setItem('voice-canvas-folders', JSON.stringify(folders));
};

// Get summary settings from localStorage
export const getSummarySettings = (): SummarySettings => {
  const settingsJson = localStorage.getItem('voice-canvas-summary-settings');
  if (!settingsJson) {
    return {
      enabled: true,
      lastProcessedWeek: ''
    };
  }
  
  try {
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Failed to parse summary settings from localStorage', error);
    return {
      enabled: true,
      lastProcessedWeek: ''
    };
  }
};

// Save summary settings to localStorage
export const saveSummarySettings = (settings: SummarySettings): void => {
  localStorage.setItem('voice-canvas-summary-settings', JSON.stringify(settings));
};

// Generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Create a new empty note
export const createEmptyNote = (folderId?: string): Note => {
  const now = Date.now();
  return {
    id: generateId(),
    title: 'Untitled Note',
    content: '',
    createdAt: now,
    updatedAt: now,
    recordings: [],
    synced: false,
    ...(folderId ? { folderId } : {})
  };
};

// Save audio blob to localStorage (base64 encoded)
export const saveAudioToStorage = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const base64data = reader.result as string;
        const audioId = generateId();
        localStorage.setItem(`audio-${audioId}`, base64data);
        resolve(audioId);
      } catch (error) {
        console.error('Error saving audio to storage:', error);
        reject(error);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading audio blob:', error);
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};

// Get audio blob from localStorage
export const getAudioFromStorage = (audioId: string): string | null => {
  const data = localStorage.getItem(audioId);
  if (!data) {
    console.warn(`Audio data not found for ID: ${audioId}`);
  }
  return data;
};

// Remove audio blob from localStorage
export const removeAudioFromStorage = (audioId: string): void => {
  localStorage.removeItem(audioId);
};

// List all audio keys in localStorage (for debugging)
export const listAudioKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('audio-')) {
      keys.push(key);
    }
  }
  return keys;
};
