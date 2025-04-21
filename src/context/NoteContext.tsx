import React, { createContext, useState, useContext, useEffect } from 'react';
import { Note, NoteContextType, Recording, Folder } from '@/types';
import { getNotes, saveNotes, createEmptyNote, generateId, getAudioFromStorage, removeAudioFromStorage, getFolders, saveFolders } from '@/lib/storage';
import { toast } from 'sonner';

const CLOUD_SYNC_KEY = 'voice-canvas-cloud-sync';

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      const savedNotes = getNotes();
      const savedFolders = getFolders();
      
      setNotes(savedNotes);
      setFolders(savedFolders);
      
      try {
        await getSyncedNotes();
      } catch (error) {
        console.error('Failed to load synced notes:', error);
      }
      
      if (savedNotes.length > 0) {
        setCurrentNote(savedNotes[0]);
      }
      
      setIsInitialized(true);
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      saveNotes(notes);
    }
  }, [notes, isInitialized]);

  const createNote = (folderId?: string) => {
    const newNote = createEmptyNote(folderId);
    
    setNotes(prevNotes => {
      const updatedNotes = [...prevNotes, newNote];
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
      return updatedNotes;
    });

    if (currentNote && currentNote.id === updatedNote.id) {
      setCurrentNote(noteWithTimestamp);
    }
    
    if (updatedNote.synced) {
      syncNote(updatedNote.id).catch(error => {
        console.error('Failed to sync updated note:', error);
      });
    }
  };

  const deleteNote = (id: string) => {
    const noteToDelete = notes.find(note => note.id === id);
    if (noteToDelete) {
      if (noteToDelete.synced) {
        unsyncNote(id).catch(error => {
          console.error('Failed to unsync deleted note:', error);
        });
      }
      
      noteToDelete.recordings.forEach(recording => {
        removeAudioFromStorage(`audio-${recording.audioUrl}`);
      });
    }

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.filter(note => note.id !== id);
      return updatedNotes;
    });
    
    if (currentNote && currentNote.id === id) {
      if (notes.length > 0) {
        const firstOtherNote = notes.find(note => note.id !== id);
        setCurrentNote(firstOtherNote || null);
      } else {
        setCurrentNote(null);
      }
    }
    
    if (selectedNoteIds.includes(id)) {
      setSelectedNoteIds(prev => prev.filter(noteId => noteId !== id));
    }
    
    toast.success('Note deleted');
  };

  const saveRecording = (noteId: string, recordingData: Omit<Recording, 'id' | 'name'>, name?: string) => {
    const recording: Recording = {
      id: generateId(),
      name: name || `Recording ${new Date().toLocaleString()}`,
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
          const recordingToDelete = note.recordings.find(rec => rec.id === recordingId);
          if (recordingToDelete) {
            removeAudioFromStorage(`audio-${recordingToDelete.audioUrl}`);
          }
          
          const updatedRecordings = note.recordings.filter(rec => rec.id !== recordingId);
          
          const updatedNote = {
            ...note,
            recordings: updatedRecordings,
            updatedAt: Date.now()
          };
          
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
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => 
        note.folderId === id ? { ...note, folderId: undefined } : note
      );
      saveNotes(updatedNotes);
      return updatedNotes;
    });
    
    setFolders(prevFolders => {
      const updatedFolders = prevFolders.filter(folder => folder.id !== id);
      saveFolders(updatedFolders);
      return updatedFolders;
    });
    toast.success('Folder deleted');
  };

  const importRecording = async (noteId: string, file: File): Promise<void> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      
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
      
      const audioId = generateId();
      localStorage.setItem(`audio-${audioId}`, base64data);
      
      const audio = new Audio();
      audio.src = URL.createObjectURL(blob);
      
      await new Promise<void>((resolve) => {
        audio.onloadedmetadata = () => {
          const duration = audio.duration;
          
          const recording: Omit<Recording, 'id' | 'name'> = {
            audioUrl: audioId,
            duration,
            timestamp: 0,
            createdAt: Date.now()
          };
          
          const fileName = file.name.replace(/\.[^/.]+$/, "");
          
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
      
      updatedNotes
        .filter(note => note.synced && selectedNoteIds.includes(note.id))
        .forEach(note => {
          syncNote(note.id).catch(error => {
            console.error('Failed to sync updated note:', error);
          });
        });
      
      return updatedNotes;
    });
    
    toast.success(`Moved ${selectedNoteIds.length} note${selectedNoteIds.length > 1 ? 's' : ''} ${folderId ? 'to folder' : 'to Unfiled'}`);
    clearNoteSelection();
  };

  const deleteSelectedNotes = () => {
    if (selectedNoteIds.length === 0) return;
    
    selectedNoteIds.forEach(noteId => {
      const noteToDelete = notes.find(note => note.id === noteId);
      if (noteToDelete) {
        if (noteToDelete.synced) {
          unsyncNote(noteId).catch(error => {
            console.error('Failed to unsync deleted note:', error);
          });
        }
        
        noteToDelete.recordings.forEach(recording => {
          removeAudioFromStorage(`audio-${recording.audioUrl}`);
        });
      }
    });
    
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.filter(note => !selectedNoteIds.includes(note.id));
      return updatedNotes;
    });
    
    if (currentNote && selectedNoteIds.includes(currentNote.id)) {
      const remainingNotes = notes.filter(note => !selectedNoteIds.includes(note.id));
      if (remainingNotes.length > 0) {
        setCurrentNote(remainingNotes[0]);
      } else {
        setCurrentNote(null);
      }
    }
    
    toast.success(`Deleted ${selectedNoteIds.length} note${selectedNoteIds.length > 1 ? 's' : ''}`);
    clearNoteSelection();
  };

  const toggleNoteSync = (noteId: string) => {
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.id === noteId) {
          const willBeSynced = !note.synced;
          
          if (willBeSynced) {
            syncNote(noteId).catch(error => {
              console.error('Failed to sync note:', error);
              toast.error('Failed to sync note to cloud');
            });
          } else {
            unsyncNote(noteId).catch(error => {
              console.error('Failed to unsync note:', error);
              toast.error('Failed to unsync note from cloud');
            });
          }
          
          return { ...note, synced: willBeSynced };
        }
        return note;
      });
      
      return updatedNotes;
    });
  };

  const toggleSelectedNotesSync = (synced: boolean) => {
    if (selectedNoteIds.length === 0) return;
    
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (selectedNoteIds.includes(note.id)) {
          if (note.synced !== synced) {
            if (synced) {
              syncNote(note.id).catch(error => {
                console.error('Failed to sync note:', error);
              });
            } else {
              unsyncNote(note.id).catch(error => {
                console.error('Failed to unsync note:', error);
              });
            }
            
            return { ...note, synced };
          }
        }
        return note;
      });
      
      return updatedNotes;
    });
    
    toast.success(`${synced ? 'Synced' : 'Unsynced'} ${selectedNoteIds.length} note${selectedNoteIds.length > 1 ? 's' : ''}`);
    clearNoteSelection();
  };

  const getSyncedNotes = async (): Promise<void> => {
    try {
      const cloudSyncedData = localStorage.getItem(CLOUD_SYNC_KEY);
      if (!cloudSyncedData) return;
      
      const cloudNotes: Note[] = JSON.parse(cloudSyncedData);
      
      setNotes(prevNotes => {
        const existingNotesMap = new Map(
          prevNotes.map(note => [note.id, note])
        );
        
        cloudNotes.forEach(cloudNote => {
          if (existingNotesMap.has(cloudNote.id)) {
            const localNote = existingNotesMap.get(cloudNote.id)!;
            if (cloudNote.updatedAt > localNote.updatedAt) {
              existingNotesMap.set(cloudNote.id, { ...cloudNote, synced: true });
            }
          } else {
            existingNotesMap.set(cloudNote.id, { ...cloudNote, synced: true });
          }
        });
        
        return Array.from(existingNotesMap.values());
      });
    } catch (error) {
      console.error('Failed to get synced notes:', error);
      toast.error('Failed to retrieve cloud notes');
      throw error;
    }
  };

  const syncNote = async (noteId: string): Promise<void> => {
    try {
      const noteToSync = notes.find(note => note.id === noteId);
      if (!noteToSync) {
        throw new Error(`Note with ID ${noteId} not found`);
      }
      
      const cloudSyncedData = localStorage.getItem(CLOUD_SYNC_KEY);
      const cloudNotes: Note[] = cloudSyncedData ? JSON.parse(cloudSyncedData) : [];
      
      const noteIndex = cloudNotes.findIndex(note => note.id === noteId);
      if (noteIndex >= 0) {
        cloudNotes[noteIndex] = { ...noteToSync, synced: true };
      } else {
        cloudNotes.push({ ...noteToSync, synced: true });
      }
      
      localStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(cloudNotes));
    } catch (error) {
      console.error('Failed to sync note:', error);
      toast.error('Failed to sync note to cloud');
      throw error;
    }
  };

  const unsyncNote = async (noteId: string): Promise<void> => {
    try {
      const cloudSyncedData = localStorage.getItem(CLOUD_SYNC_KEY);
      if (!cloudSyncedData) return;
      
      const cloudNotes: Note[] = JSON.parse(cloudSyncedData);
      
      const updatedCloudNotes = cloudNotes.filter(note => note.id !== noteId);
      
      localStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(updatedCloudNotes));
    } catch (error) {
      console.error('Failed to unsync note:', error);
      toast.error('Failed to unsync note from cloud');
      throw error;
    }
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
    deleteSelectedNotes,
    toggleNoteSync,
    toggleSelectedNotesSync,
    getSyncedNotes,
    syncNote,
    unsyncNote
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
