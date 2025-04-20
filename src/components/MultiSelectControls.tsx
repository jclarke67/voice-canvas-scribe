
import React from 'react';
import { useNotes } from '@/context/NoteContext';
import { Button } from '@/components/ui/button';
import { 
  FolderPlus, 
  Trash2, 
  CheckSquare, 
  X, 
  FolderOpen 
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const MultiSelectControls: React.FC = () => {
  const { 
    selectedNoteIds, 
    clearNoteSelection, 
    selectAllNotes, 
    moveSelectedNotesToFolder, 
    deleteSelectedNotes, 
    folders 
  } = useNotes();
  
  if (selectedNoteIds.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-accent/30 p-2 rounded-md mb-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm">
          {selectedNoteIds.length} selected
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearNoteSelection}
          className="h-7 w-7 p-0"
        >
          <X size={14} />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => selectAllNotes()}
          className="text-xs"
        >
          <CheckSquare size={14} className="mr-1" />
          Select All
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              <FolderOpen size={14} className="mr-1" />
              Move to
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => moveSelectedNotesToFolder(undefined)}>
              <FolderPlus size={14} className="mr-2" />
              Unfiled
            </DropdownMenuItem>
            
            {folders.length > 0 && <DropdownMenuSeparator />}
            
            {folders.map(folder => (
              <DropdownMenuItem 
                key={folder.id}
                onClick={() => moveSelectedNotesToFolder(folder.id)}
              >
                <FolderOpen size={14} className="mr-2" />
                {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={deleteSelectedNotes}
        >
          <Trash2 size={14} className="mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default MultiSelectControls;
