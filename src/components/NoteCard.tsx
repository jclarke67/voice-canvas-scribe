
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Note } from '@/types';
import { useNotes } from '@/context/NoteContext';
import { CheckSquare, Square, Headphones, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoteCardProps {
  note: Note;
  isActive: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isActive }) => {
  const { 
    setCurrentNote, 
    selectedNoteIds, 
    toggleNoteSelection,
    deleteNote
  } = useNotes();
  
  const isSelected = selectedNoteIds.includes(note.id);
  const hasRecordings = note.recordings.length > 0;
  
  const handleClick = (e: React.MouseEvent) => {
    if (selectedNoteIds.length > 0) {
      // If we're in selection mode, toggle this note's selection
      e.preventDefault();
      toggleNoteSelection(note.id);
    } else {
      // Otherwise, select this note
      setCurrentNote(note);
    }
  };
  
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNoteSelection(note.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNote(note.id);
    }
  };
  
  return (
    <div
      className={`p-3 mb-1 rounded-md cursor-pointer flex items-start group transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground'
          : isSelected
          ? 'bg-accent/30 hover:bg-accent/60'
          : 'hover:bg-accent/10'
      }`}
      onClick={handleClick}
    >
      <div 
        className={`mr-2 mt-1 flex-shrink-0 ${selectedNoteIds.length === 0 ? 'invisible group-hover:visible' : 'visible'}`}
        onClick={handleCheckboxClick}
      >
        {isSelected ? (
          <CheckSquare size={16} className="text-primary" />
        ) : (
          <Square size={16} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div className="font-medium truncate">{note.title || "Untitled Note"}</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive -mr-1"
            onClick={handleDelete}
          >
            <Trash2 size={14} />
          </Button>
        </div>
        
        <div className="flex items-center mt-1 text-xs text-muted-foreground">
          <span className="truncate">
            {note.content
              ? note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '')
              : 'No content'}
          </span>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
          </span>
          
          {hasRecordings && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Headphones size={12} className="mr-1" />
              {note.recordings.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
