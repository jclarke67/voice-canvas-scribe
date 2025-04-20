import React, { createContext, useState, useContext, useEffect } from 'react';
import { Note, NoteContextType, Recording, Folder, SummarySettings } from '@/types';
import { getNotes, saveNotes, createEmptyNote, generateId, getAudioFromStorage, removeAudioFromStorage, getFolders, saveFolders, getSyncedNotes, saveSyncedNotes, getSummarySettings, saveSummarySettings } from '@/lib/storage';
import { toast } from 'sonner';
import { processAutoSummarization } from '@/lib/autoSummarize';
import { getWeekNumber } from '@/lib/dateUtils';

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [summarySettings, setSummarySettings] = useState<SummarySettings>({
    enabled: true,
    lastProcessedWeek: ''
  });

  useEffect(() => {
    const savedNotes = getNotes();
    const savedFolders = getFolders();
    const savedSettings = getSummarySettings();
    setNotes(savedNotes);
    setFolders(savedFolders);
    setSummarySettings(savedSettings);
    if (savedNotes.length > 0) {
      setCurrentNote(savedNotes[0]);
    }
  }, []);

  useEffect(() => {
    if (!summarySettings.enabled) return;

    const currentWeekId = getWeekNumber(new Date());
    
    if (summarySettings.lastProcessedWeek === currentWeekId) return;
    
    processSummaries();
    
    const checkInterval = setInterval(() => {
      processSummaries();
    }, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(checkInterval);
  }, [summarySettings.enabled, summarySettings.lastProcessedWeek, notes, folders]);

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
      
      if (noteWithTimestamp.synced) {
        const syncedNotes = getSyncedNotes();
        const updatedSyncedNotes = syncedNotes.map(note => 
          note.id === noteWithTimestamp.id ? noteWithTimestamp : note
        );
        if (!updatedSyncedNotes.find(note => note.id === noteWithTimestamp.id)) {
          updatedSyncedNotes.push(noteWithTimestamp);
        }
        saveSyncedNotes(updatedSyncedNotes);
      }
      
      return updatedNotes;
    });

    if (currentNote && currentNote.id === updatedNote.id) {
      setCurrentNote(noteWithTimestamp);
    }
  };

  const deleteNote = (id: string) => {
    const noteToDelete = notes.find(note => note.id === id);
    if (noteToDelete) {
      noteToDelete.recordings.forEach(recording => {
        removeAudioFromStorage(`audio-${recording.audioUrl}`);
      });
    }

    setNotes(prevNotes => {
      const updatedNotes = prevNotes.filter(note => note.id !== id);
      saveNotes(updatedNotes);
      
      if (noteToDelete?.synced) {
        const syncedNotes = getSyncedNotes();
        const updatedSyncedNotes = syncedNotes.filter(note => note.id !== id);
        saveSyncedNotes(updatedSyncedNotes);
      }
      
      if (currentNote && currentNote.id === id) {
        if (updatedNotes.length > 0) {
          setCurrentNote(updatedNotes[0]);
        } else {
          setCurrentNote(null);
        }
      }
      
      return updatedNotes;
    });
    
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
          
          if (updatedNote.synced) {
            const syncedNotes = getSyncedNotes();
            const updatedSyncedNotes = syncedNotes.map(n => 
              n.id === updatedNote.id ? updatedNote : n
            );
            if (!updatedSyncedNotes.find(n => n.id === updatedNote.id)) {
              updatedSyncedNotes.push(updatedNote);
            }
            saveSyncedNotes(updatedSyncedNotes);
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
      
      saveNotes(updatedNotes);
      
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

  const toggleNoteSync = (noteId: string) => {
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => {
        if (note.id === noteId) {
          const updatedNote = {
            ...note,
            synced: !note.synced,
            updatedAt: Date.now()
          };
          
          const syncedNotes = getSyncedNotes();
          if (updatedNote.synced) {
            const updatedSyncedNotes = [...syncedNotes, updatedNote];
            saveSyncedNotes(updatedSyncedNotes);
          } else {
            const updatedSyncedNotes = syncedNotes.filter(n => n.id !== noteId);
            saveSyncedNotes(updatedSyncedNotes);
          }
          
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
    
    toast.success('Note sync status updated');
  };

  const syncSelectedNotes = () => {
    if (selectedNoteIds.length === 0) return;
    
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => 
        selectedNoteIds.includes(note.id)
          ? { ...note, synced: true, updatedAt: Date.now() }
          : note
      );
      
      saveNotes(updatedNotes);
      
      const syncedNotes = getSyncedNotes();
      const notesToSync = updatedNotes.filter(note => 
        selectedNoteIds.includes(note.id)
      );
      
      const updatedSyncedNotes = [...syncedNotes];
      
      notesToSync.forEach(noteToSync => {
        const existingIndex = updatedSyncedNotes.findIndex(n => n.id === noteToSync.id);
        if (existingIndex >= 0) {
          updatedSyncedNotes[existingIndex] = noteToSync;
        } else {
          updatedSyncedNotes.push(noteToSync);
        }
      });
      
      saveSyncedNotes(updatedSyncedNotes);
      
      if (currentNote && selectedNoteIds.includes(currentNote.id)) {
        const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
        if (updatedCurrentNote) {
          setCurrentNote(updatedCurrentNote);
        }
      }
      
      return updatedNotes;
    });
    
    toast.success(`Synced ${selectedNoteIds.length} note${selectedNoteIds.length > 1 ? 's' : ''} to cloud`);
    clearNoteSelection();
  };

  const unsyncSelectedNotes = () => {
    if (selectedNoteIds.length === 0) return;
    
    setNotes(prevNotes => {
      const updatedNotes = prevNotes.map(note => 
        selectedNoteIds.includes(note.id)
          ? { ...note, synced: false, updatedAt: Date.now() }
          : note
      );
      
      saveNotes(updatedNotes);
      
      const syncedNotes = getSyncedNotes();
      const updatedSyncedNotes = syncedNotes.filter(note => 
        !selectedNoteIds.includes(note.id)
      );
      
      saveSyncedNotes(updatedSyncedNotes);
      
      if (currentNote && selectedNoteIds.includes(currentNote.id)) {
        const updatedCurrentNote = updatedNotes.find(note => note.id === currentNote.id);
        if (updatedCurrentNote) {
          setCurrentNote(updatedCurrentNote);
        }
      }
      
      return updatedNotes;
    });
    
    toast.success(`Removed ${selectedNoteIds.length} note${selectedNoteIds.length > 1 ? 's' : ''} from cloud sync`);
    clearNoteSelection();
  };

  const processSummaries = () => {
    const currentWeekId = getWeekNumber(new Date());
    
    if (summarySettings.lastProcessedWeek === currentWeekId) return;
    
    const { summaryNotes } = processAutoSummarization(
      notes,
      folders,
      createFolder,
      createNote,
      updateNote
    );
    
    setSummarySettings(prev => {
      const updatedSettings = {
        ...prev,
        lastProcessedWeek: currentWeekId
      };
      saveSummarySettings(updatedSettings);
      return updatedSettings;
    });
    
    if (summaryNotes.length > 0) {
      toast.success(`Created ${summaryNotes.length} weekly summary note${summaryNotes.length > 1 ? 's' : ''}`);
    }
  };

  const updateSummarySettings = (settings: Partial<SummarySettings>) => {
    setSummarySettings(prev => {
      const updatedSettings = { ...prev, ...settings };
      saveSummarySettings(updatedSettings);
      return updatedSettings;
    });
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
    syncSelectedNotes,
    unsyncSelectedNotes,
    processSummaries,
    summarySettings,
    updateSummarySettings
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
