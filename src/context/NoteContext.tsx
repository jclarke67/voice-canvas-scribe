import React, { createContext, useState, useContext, useEffect } from 'react';
import { Note, NoteContextType, Recording, Folder } from '@/types';
import { getNotes, saveNotes, createEmptyNote, generateId, getAudioFromStorage, removeAudioFromStorage, getFolders, saveFolders } from '@/lib/storage';
import { toast } from 'sonner';

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

  useEffect(() => {
    const savedNotes = getNotes();
    const savedFolders = getFolders();
    setNotes(savedNotes);
    setFolders(savedFolders);
    if (savedNotes.length > 0) {
      setCurrentNote(savedNotes[0]);
    }
  }, []);

  const createNote = (folderId?: string) => {
    const newNote = createEmptyNote(folderId);
    setNotes(prevNotes => {
      const updatedNotes = [...prevNotes, newNote];
      saveNotes(updatedNotes);
      return updatedNotes;
    });
    setCurrentNote(newNote);
    toast.success('Note created');
  };

  const updateNote = (updatedNote: Note) => {
    const now = Date.now();
    const noteWithTimestamp = {
      ...updatedNote,
      updatedAt: now
    };

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => 
        note.id === noteWithTimestamp.id ? noteWithTimestamp : note
      );
      saveNotes(updatedNotes);
      return updatedNotes;
    });

    if (currentNote && currentNote.id === updatedNote.id) {
      setCurrentNote(noteWithTimestamp);
    }
  };

  const deleteNote = (id: string) => {
    // First, clean up any recordings associated with this note
    const noteToDelete = notes.find(note => note.id === id);
    if (noteToDelete) {
      noteToDelete.recordings.forEach(recording => {
        removeAudioFromStorage(`audio-${recording.audioUrl}`);
      });
    }

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.filter(note => note.id !== id);
      saveNotes(updatedNotes);
      
      // If the current note is deleted, set current note to the first available note or null
      if (currentNote && currentNote.id === id) {
        if (updatedNotes.length > 0) {
          setCurrentNote(updatedNotes[0]);
        } else {
          setCurrentNote(null);
        }
      }
      
      return updatedNotes;
    });
    
    // Remove from selected notes if it's there
    if (selectedNoteIds.includes(id)) {
      setSelectedNoteIds(prev => prev.filter(noteId => noteId !== id));
    }
    
    toast.success('Note deleted');
  };

  const saveRecording = (noteId: string, recordingData: Omit<Recording, 'id' | 'name'>, name?: string) => {
    const recording: Recording = {
      id: generateId(),
      name: name || `Recording ${new Date().toLocaleString()}`, // Default name or provided name
      ...recordingData
    };

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.id === noteId) {
          const updatedNote = {
            ...note,
            recordings: [...note.recordings, recording],
            updatedAt: Date.now()
          };
          
          // Update current note if it's the modified one
          if (currentNote && currentNote.id === noteId) {
            setCurrentNote(updatedNote);
          }
          
          return updatedNote;
        }
        return note;
      });
      
      saveNotes(updatedNotes);
      return updatedNotes;
    });
    toast.success('Recording saved');
  };

  const updateRecording = (noteId: string, recordingId: string, updates: Partial<Recording>) => {
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.id === noteId) {
          const updatedRecordings = note.recordings.map(recording => 
            recording.id === recordingId 
              ? { ...recording, ...updates } 
              : recording
          );
          
          const updatedNote = {
            ...note,
            recordings: updatedRecordings,
            updatedAt: Date.now()
          };
          
          // Update current note if it's the modified one
          if (currentNote && currentNote.id === noteId) {
            setCurrentNote(updatedNote);
          }
          
          return updatedNote;
        }
        return note;
      });
      
      saveNotes(updatedNotes);
      return updatedNotes;
    });
    toast.success('Recording updated');
  };

  const deleteRecording = (noteId: string, recordingId: string) => {
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.id === noteId) {
          // Find the recording to get its audioUrl
          const recordingToDelete = note.recordings.find(rec => rec.id === recordingId);
          if (recordingToDelete) {
            // Remove audio data from storage
            removeAudioFromStorage(`audio-${recordingToDelete.audioUrl}`);
          }
          
          const updatedRecordings = note.recordings.filter(rec => rec.id !== recordingId);
          
          const updatedNote = {
            ...note,
            recordings: updatedRecordings,
            updatedAt: Date.now()
          };
          
          // Update current note if it's the modified one
          if (currentNote && currentNote.id === noteId) {
            setCurrentNote(updatedNote);
          }
          
          return updatedNote;
        }
        return note;
      });
      
      saveNotes(updatedNotes);
      return updatedNotes;
    });
    toast.success('Recording deleted');
  };

  const createFolder = (name: string) => {
    const newFolder: Folder = {
      id: generateId(),
      name,
      createdAt: Date.now()
    };
    
    setFolders(prevFolders => {
      const updatedFolders = [...prevFolders, newFolder];
      saveFolders(updatedFolders);
      return updatedFolders;
    });
    toast.success('Folder created');
  };

  const updateFolder = (id: string, name: string) => {
    setFolders(prevFolders => {
      const updatedFolders = prevFolders.map(folder => 
        folder.id === id ? { ...folder, name } : folder
      );
      saveFolders(updatedFolders);
      return updatedFolders;
    });
    toast.success('Folder updated');
  };

  const deleteFolder = (id: string) => {
    // Update notes that were in this folder to have no folder
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => 
        note.folderId === id ? { ...note, folderId: undefined } : note
      );
      saveNotes(updatedNotes);
      return updatedNotes;
    });
    
    // Delete the folder
    setFolders(prevFolders => {
      const updatedFolders = prevFolders.filter(folder => folder.id !== id);
      saveFolders(updatedFolders);
      return updatedFolders;
    });
    toast.success('Folder deleted');
  };

  const importRecording = async (noteId: string, file: File): Promise<void> => {
    try {
      // Read the audio file
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      
      // Convert blob to base64 for storage
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            resolve(reader.result as string);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      // Generate ID and store the audio
      const audioId = generateId();
      localStorage.setItem(`audio-${audioId}`, base64data);
      
      // Create a new audio element to get the duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(blob);
      
      // Wait for the metadata to load to get the duration
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => {
          const duration = audio.duration;
          
          // Create a new recording
          const recording: Omit<Recording, 'id' | 'name'> = {
            audioUrl: audioId,
            duration,
            timestamp: 0, // Default to the beginning of the note
            createdAt: Date.now()
          };
          
          // Use the file name as the recording name if possible
          const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
          
          // Save the recording with the name
          saveRecording(noteId, recording, fileName || undefined);
          resolve();
        };
        audio.onerror = () => {
          toast.error('Failed to load audio metadata');
          resolve();
        };
      });
      
      toast.success('Recording imported successfully');
    } catch (error) {
      console.error('Error importing recording:', error);
      toast.error('Failed to import recording');
    }
  };

  const exportRecording = (recording: Recording) => {
    try {
      const audioData = getAudioFromStorage(`audio-${recording.audioUrl}`);
      if (!audioData) {
        toast.error('Recording data not found');
        return;
      }
      
      // Create a download link for the audio
      const a = document.createElement('a');
      a.href = audioData;
      a.download = `${recording.name || 'recording'}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Recording exported');
    } catch (error) {
      console.error('Error exporting recording:', error);
      toast.error('Failed to export recording');
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(prev => {
      if (prev.includes(noteId)) {
        return prev.filter(id => id !== noteId);
      } else {
        return [...prev, noteId];
      }
    });
  };

  const clearNoteSelection = () => {
    setSelectedNoteIds([]);
  };

  const selectAllNotes = (folderId?: string) => {
    // If folderId is provided, select all notes in that folder
    // Otherwise, select all notes
    const notesToSelect = folderId 
      ? notes.filter(note => note.folderId === folderId)
      : notes;
    
    setSelectedNoteIds(notesToSelect.map(note => note.id));
  };

  const moveSelectedNotesToFolder = (folderId?: string) => {
    if (selectedNoteIds.length === 0) return;

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => 
        selectedNoteIds.includes(note.id)
          ? { ...note, folderId, updatedAt: Date.now() }
          : note
      );
      
      saveNotes(updatedNotes);
      
      // Update current note if it's one of the moved notes
      if (currentNote && selectedNoteIds.includes(currentNote.id)) {
        const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
        if (updatedCurrentNote) {
          setCurrentNote(updatedCurrentNote);
        }
      }
      
      return updatedNotes;
    });
    
    toast.success(`Moved ${selectedNoteIds.length} note${selectedNoteIds.length > 1 ? 's' : ''} ${folderId ? 'to folder' : 'to Unfiled'}`);
    clearNoteSelection();
  };

  const deleteSelectedNotes = () => {
    if (selectedNoteIds.length === 0) return;
    
    // Clean up recordings for all selected notes
    selectedNoteIds.forEach(noteId => {
      const noteToDelete = notes.find(note => note.id === noteId);
      if (noteToDelete) {
        noteToDelete.recordings.forEach(recording => {
          removeAudioFromStorage(`audio-${recording.audioUrl}`);
        });
      }
    });
    
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.filter(note => !selectedNoteIds.includes(note.id));
      saveNotes(updatedNotes);
      
      // If the current note is deleted, set current note to the first available note or null
      if (currentNote && selectedNoteIds.includes(currentNote.id)) {
        if (updatedNotes.length > 0) {
          setCurrentNote(updatedNotes[0]);
        } else {
          setCurrentNote(null);
        }
      }
      
      return updatedNotes;
    });
    
    toast.success(`Deleted ${selectedNoteIds.length} note${selectedNoteIds.length > 1 ? 's' : ''}`);
    clearNoteSelection();
  };

  const contextValue: NoteContextType = {
    notes,
    folders,
    currentNote,
    setCurrentNote,
    createNote,
    updateNote,
    deleteNote,
    saveRecording,
    updateRecording,
    deleteRecording,
    createFolder,
    updateFolder,
    deleteFolder,
    importRecording,
    exportRecording,
    selectedNoteIds,
    toggleNoteSelection,
    clearNoteSelection,
    selectAllNotes,
    moveSelectedNotesToFolder,
    deleteSelectedNotes
  };

  return (
    <NoteContext.Provider value={contextValue}>
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = (): NoteContextType => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
};
