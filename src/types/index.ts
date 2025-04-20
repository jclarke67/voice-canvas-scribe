
// Type definitions for the application
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  recordings: Recording[];
  folderId?: string; // Optional folder association
}

export interface Recording {
  id: string;
  name: string; // Added name field for recordings
  audioUrl: string;
  duration: number;
  timestamp: number; // Position in the note where recording was added
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export type NoteContextType = {
  notes: Note[];
  folders: Folder[];
  currentNote: Note | null;
  setCurrentNote: (note: Note | null) => void;
  createNote: (folderId?: string) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  saveRecording: (noteId: string, recording: Omit<Recording, 'id' | 'name'>, name?: string) => void;
  updateRecording: (noteId: string, recordingId: string, updates: Partial<Recording>) => void;
  deleteRecording: (noteId: string, recordingId: string) => void;
  createFolder: (name: string) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  importRecording: (noteId: string, file: File) => Promise<void>;
  exportRecording: (recording: Recording) => void;
  // Add new types for multi-note selection
  selectedNoteIds: string[];
  toggleNoteSelection: (noteId: string) => void;
  clearNoteSelection: () => void;
  selectAllNotes: (folderId?: string) => void;
  moveSelectedNotesToFolder: (folderId?: string) => void;
  deleteSelectedNotes: () => void;
};
