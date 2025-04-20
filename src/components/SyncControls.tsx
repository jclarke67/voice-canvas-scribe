
import React from 'react';
import { useNotes } from '@/context/NoteContext';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SyncControls: React.FC = () => {
  const { 
    selectedNoteIds, 
    syncSelectedNotes, 
    unsyncSelectedNotes,
    notes
  } = useNotes();
  
  const selectedCount = selectedNoteIds.length;
  
  // Count how many of the selected notes are already synced
  const syncedCount = notes.filter(
    note => selectedNoteIds.includes(note.id) && note.synced
  ).length;
  
  const allSelected = selectedCount > 0;
  const allSynced = syncedCount === selectedCount && selectedCount > 0;
  const someSynced = syncedCount > 0 && syncedCount < selectedCount;
  const noneSynced = syncedCount === 0 && selectedCount > 0;
  
  if (selectedCount === 0) {
    return null;
  }
  
  const handleSyncClick = () => {
    if (someSynced || noneSynced) {
      syncSelectedNotes();
    }
  };
  
  const handleUnsyncClick = () => {
    if (someSynced || allSynced) {
      unsyncSelectedNotes();
    }
  };
  
  return (
    <div className="flex space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={noneSynced || someSynced ? "default" : "outline"}
              size="sm"
              onClick={handleSyncClick}
              disabled={allSynced}
              className="flex items-center"
            >
              <Cloud size={16} className="mr-1" />
              Sync
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sync selected notes to cloud</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={allSynced || someSynced ? "default" : "outline"}
              size="sm"
              onClick={handleUnsyncClick}
              disabled={noneSynced}
              className="flex items-center"
            >
              <CloudOff size={16} className="mr-1" />
              Unsync
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove selected notes from cloud sync</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default SyncControls;
