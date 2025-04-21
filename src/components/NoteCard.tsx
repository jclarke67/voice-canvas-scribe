
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Note } from '@/types';
import { useNotes } from '@/context/NoteContext';
import { Headphones, Cloud, CloudOff, Trash2, FileDown, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface NoteCardProps {
  note: Note;
  isSelected?: boolean;
  multiSelectMode?: boolean;
  onCtrlClick?: (e: React.MouseEvent, noteId: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  isSelected = false,
  multiSelectMode = false,
  onCtrlClick
}) => {
  const { 
    currentNote, 
    setCurrentNote, 
    toggleNoteSelection, 
    toggleNoteSync,
    deleteNote,
    exportRecording
  } = useNotes();
  
  const isActive = currentNote?.id === note.id;
  
  const handleClick = (e: React.MouseEvent) => {
    // Handle Ctrl+click for multiple selection
    if (e.ctrlKey && onCtrlClick) {
      onCtrlClick(e, note.id);
      return;
    }
    
    if (multiSelectMode) {
      toggleNoteSelection(note.id);
    } else {
      setCurrentNote(note);
    }
  };
  
  const handleSyncToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNoteSync(note.id);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${note.title || 'Untitled Note'}"?`)) {
      deleteNote(note.id);
    }
  };
  
  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    // For now, just export the first recording if available
    if (note.recordings.length > 0) {
      exportRecording(note.recordings[0]);
    }
  };
  
  return (
    <div 
      className={cn(
        "p-3 rounded-lg transition-colors cursor-pointer relative group",
        isActive ? "bg-accent" : "hover:bg-accent/50",
        isSelected && "bg-accent/80"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {multiSelectMode && (
            <div className="absolute top-3 left-3">
              <Checkbox 
                checked={isSelected} 
                onCheckedChange={() => toggleNoteSelection(note.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <h3 className={cn(
            "font-medium truncate",
            multiSelectMode && "ml-7"
          )}>
            {note.title || "Untitled Note"}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 break-words">
            {note.content || "No content"}
          </p>
          
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {note.tags.slice(0, 3).map(tag => (
                <div key={tag} className="flex items-center px-1.5 py-0.5 bg-accent/70 rounded-full text-xs">
                  <Tag size={10} className="mr-1 text-primary" />
                  <span className="truncate max-w-[80px]">{tag}</span>
                </div>
              ))}
              {note.tags.length > 3 && (
                <div className="px-1.5 py-0.5 bg-accent/70 rounded-full text-xs">
                  +{note.tags.length - 3}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <span className="truncate">
              {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
            </span>
            
            {note.recordings.length > 0 && (
              <div className="flex items-center ml-2">
                <Headphones size={14} className="mr-1" />
                <span>{note.recordings.length}</span>
              </div>
            )}
            
            {note.pages && note.pages.length > 1 && (
              <div className="flex items-center ml-2">
                <span>{note.pages.length} pages</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <button 
            className={cn(
              "p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity",
              note.synced && "opacity-100"
            )}
            onClick={handleSyncToggle}
            title={note.synced ? "Remove from cloud sync" : "Sync to cloud"}
          >
            {note.synced ? (
              <Cloud size={16} className="text-primary" />
            ) : (
              <CloudOff size={16} className="text-muted-foreground" />
            )}
          </button>
          
          <button 
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleExport}
            title="Export recording"
          >
            <FileDown size={16} className="text-muted-foreground hover:text-primary" />
          </button>
          
          <button 
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDelete}
            title="Delete note"
          >
            <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
