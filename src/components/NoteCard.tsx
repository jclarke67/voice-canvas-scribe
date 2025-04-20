
import React from 'react';
import { useNotes } from '@/context/NoteContext';
import { format } from 'date-fns';
import { Mic, File, CheckSquare, Cloud, Check } from 'lucide-react';
import { Note } from '@/types';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface NoteCardProps {
  note: Note;
  isActive: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isActive }) => {
  const { setCurrentNote, selectedNoteIds, toggleNoteSelection } = useNotes();
  
  const handleSelect = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      toggleNoteSelection(note.id);
    } else {
      setCurrentNote(note);
    }
  };
  
  const isSelected = selectedNoteIds.includes(note.id);
  
  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleNoteSelection(note.id);
  };
  
  return (
    <div
      className={cn(
        "p-2 rounded-md cursor-pointer mb-1 flex items-center",
        isActive ? "bg-primary/10" : "hover:bg-accent",
        isSelected ? "border-2 border-primary" : ""
      )}
      onClick={handleSelect}
    >
      <div className="flex-shrink-0 mr-2" onClick={handleCheckboxChange}>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={() => {}}
          className="data-[state=checked]:bg-primary"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{note.title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {format(new Date(note.updatedAt), 'MMM d, yyyy')}
          {note.recordings.length > 0 && (
            <span className="ml-2 inline-flex items-center">
              <Mic className="h-3 w-3 mr-1" />
              {note.recordings.length}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-start ml-2">
        {note.synced && <Cloud size={16} className="text-primary ml-1" />}
      </div>
    </div>
  );
};

export default NoteCard;
