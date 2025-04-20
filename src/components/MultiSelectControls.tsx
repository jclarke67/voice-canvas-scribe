
import React from 'react';
import { useNotes } from '@/context/NoteContext';
import { Button } from '@/components/ui/button';
import { 
  Trash2, 
  FolderOpen, 
  CheckSquare, 
  SquareX, 
  AlignLeft 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import SyncControls from './SyncControls';

const MultiSelectControls: React.FC = () => {
  const {
    selectedNoteIds,
    clearNoteSelection,
    selectAllNotes,
    moveSelectedNotesToFolder,
    deleteSelectedNotes,
    folders,
    notes,
    processSummaries
  } = useNotes();
  
  const [showMoveToFolder, setShowMoveToFolder] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  const selectedCount = selectedNoteIds.length;
  const totalNotes = notes.length;
  const hasSelection = selectedCount > 0;
  
  const handleMoveToFolder = (folderId: string | undefined) => {
    moveSelectedNotesToFolder(folderId === "unfiled" ? undefined : folderId);
    setShowMoveToFolder(false);
  };
  
  const handleSelectAll = () => {
    selectAllNotes();
  };
  
  const handleDeleteSelected = () => {
    deleteSelectedNotes();
    setShowDeleteConfirm(false);
  };
  
  const handleTriggerSummary = () => {
    processSummaries();
  };
  
  if (!hasSelection) {
    return null;
  }
  
  return (
    <div className="mb-4 p-2 border rounded-md bg-accent/30">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedCount} of {totalNotes} selected
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearNoteSelection}
            className="h-7 px-2"
          >
            <SquareX size={14} className="mr-1" />
            Clear
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
            className="flex items-center h-7"
          >
            <CheckSquare size={14} className="mr-1" />
            Select All
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowMoveToFolder(true)}
            className="flex items-center h-7"
          >
            <FolderOpen size={14} className="mr-1" />
            Move
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTriggerSummary}
            className="flex items-center h-7"
          >
            <AlignLeft size={14} className="mr-1" />
            Summarize
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center h-7 text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} className="mr-1" />
            Delete
          </Button>
          
          <SyncControls />
        </div>
      </div>
      
      <Dialog open={showMoveToFolder} onOpenChange={setShowMoveToFolder}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select
              onValueChange={handleMoveToFolder}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unfiled">Unfiled</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveToFolder(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete {selectedCount} note{selectedCount !== 1 ? 's' : ''}?</p>
            <p className="text-destructive mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSelected}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiSelectControls;
