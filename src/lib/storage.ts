
import { Note, Folder } from '@/types';

// Keys for local storage
const NOTES_STORAGE_KEY = 'voice-canvas-notes';
const FOLDERS_STORAGE_KEY = 'voice-canvas-folders';

// Generate a unique ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 11);
};

// Save notes to local storage
export const saveNotes = (notes: Note[]) => {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
};

// Get notes from local storage
export const getNotes = (): Note[] => {
  const notesString = localStorage.getItem(NOTES_STORAGE_KEY);
  if (!notesString) return [];

  try {
    const notes = JSON.parse(notesString);
    
    // Migrate notes to new format if needed
    return notes.map((note: any) => {
      // Add pages array if it doesn't exist
      if (!note.pages || !Array.isArray(note.pages) || note.pages.length === 0) {
        return {
          ...note,
          pages: [{
            id: generateId(),
            content: note.content || '',
            recordings: [...(note.recordings || [])]
          }],
          currentPageIndex: 0,
          tags: note.tags || []
        };
      }
      
      // Add tags array if it doesn't exist
      if (!note.tags) {
        return {
          ...note,
          tags: []
        };
      }
      
      return note;
    });
  } catch (error) {
    console.error('Failed to parse notes from localStorage:', error);
    return [];
  }
};

// Save folders to local storage
export const saveFolders = (folders: Folder[]) => {
  localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
};

// Get folders from local storage
export const getFolders = (): Folder[] => {
  const foldersString = localStorage.getItem(FOLDERS_STORAGE_KEY);
  if (!foldersString) return [];

  try {
    return JSON.parse(foldersString);
  } catch (error) {
    console.error('Failed to parse folders from localStorage:', error);
    return [];
  }
};

// Create an empty note
export const createEmptyNote = (folderId?: string): Note => {
  const now = Date.now();
  return {
    id: generateId(),
    title: '',
    content: '',
    createdAt: now,
    updatedAt: now,
    recordings: [],
    pages: [{
      id: generateId(),
      content: '',
      recordings: []
    }],
    currentPageIndex: 0,
    tags: [],
    folderId,
    synced: false
  };
};

// Save audio to local storage
export const saveAudioToStorage = (key: string, audioData: string) => {
  try {
    localStorage.setItem(key, audioData);
    return true;
  } catch (error) {
    console.error('Error saving audio to storage:', error);
    // If localStorage is full, try to clear some space
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return false;
    }
    return false;
  }
};

// Get audio from local storage
export const getAudioFromStorage = (key: string) => {
  return localStorage.getItem(key);
};

// Remove audio from local storage
export const removeAudioFromStorage = (key: string) => {
  localStorage.removeItem(key);
};
