
import React from 'react';
import { useNotes } from '@/context/NoteContext';
import { Button } from '@/components/ui/button';
import { Folder, Trash2, CloudUpload, CloudOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

const MultiSelectControls: React.FC = () => {
  const { 
    selectedNoteIds, 
    clearNoteSelection, 
    folders, 
    moveSelectedNotesToFolder, 
    deleteSelectedNotes, 
    toggleSelectedNotesSync 
  } = useNotes();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleMoveToFolder = (folderId?: string) => {
    moveSelectedNotesToFolder(folderId);
  };
  
  const handleDeleteSelected = () => {
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    deleteSelectedNotes();
    setShowDeleteConfirm(false);
  };
  
  const handleSyncSelected = () => {
    toggleSelectedNotesSync(true);
  };
  
  const handleUnsyncSelected = () => {
    toggleSelectedNotesSync(false);
  };
  
  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md mb-2">
      <div>
        <span className="text-sm font-medium">{selectedNoteIds.length} selected</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearNoteSelection}
          className="ml-2 text-xs"
        >
          Clear
        </Button>
      </div>
      
      <div className="flex gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Folder size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleMoveToFolder()}>
              Move to Unfiled
            </DropdownMenuItem>
            {folders.map(folder => (
              <DropdownMenuItem key={folder.id} onSelect={() => handleMoveToFolder(folder.id)}>
                Move to {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={handleSyncSelected}
          title="Sync selected notes to cloud"
        >
          <CloudUpload size={16} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={handleUnsyncSelected}
          title="Remove selected notes from cloud sync"
        >
          <CloudOff size={16} />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={handleDeleteSelected}
          title="Delete selected notes"
        >
          <Trash2 size={16} className="text-destructive" />
        </Button>
      </div>
      
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedNoteIds.length} notes?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All selected notes and their recordings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiSelectControls;
