
import React, { useState, useRef } from 'react';
import { useNotes } from '@/context/NoteContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Recording } from '@/types';
import { Headphones, Download, Upload, Trash2, Pencil } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

interface RecordingsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const RecordingsManager: React.FC<RecordingsManagerProps> = ({ isOpen, onClose }) => {
  const { currentNote, updateRecording, deleteRecording, importRecording, exportRecording } = useNotes();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!currentNote) return null;
  
  const handleRenameRecording = (recording: Recording) => {
    setEditingId(recording.id);
    setEditName(recording.name);
  };
  
  const saveRename = () => {
    if (editingId && currentNote) {
      updateRecording(currentNote.id, editingId, { name: editName });
      setEditingId(null);
    }
  };
  
  const handleDeleteRecording = (recordingId: string) => {
    if (currentNote) {
      if (window.confirm('Are you sure you want to delete this recording?')) {
        deleteRecording(currentNote.id, recordingId);
      }
    }
  };
  
  const handleExportRecording = (recording: Recording) => {
    exportRecording(recording);
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentNote) return;
    
    const file = files[0];
    setIsImporting(true);
    
    try {
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        toast.error('Please select an audio file');
        return;
      }
      
      await importRecording(currentNote.id, file);
      toast.success('Recording imported successfully');
    } catch (error) {
      console.error('Error importing recording:', error);
      toast.error('Failed to import recording');
    } finally {
      setIsImporting(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Recordings for {currentNote.title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {currentNote.recordings.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              No recordings available for this note.
            </div>
          ) : (
            <div className="space-y-4">
              {currentNote.recordings.map((recording) => (
                <div key={recording.id} className="bg-accent/20 rounded-lg p-3 space-y-2">
                  {editingId === recording.id ? (
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Recording name"
                        className="flex-1"
                      />
                      <Button size="sm" onClick={saveRename}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{recording.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(recording.duration)}
                      </div>
                    </div>
                  )}
                  
                  <AudioPlayer 
                    audioId={recording.audioUrl} 
                    duration={recording.duration} 
                  />
                  
                  <div className="flex justify-end space-x-2 pt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleRenameRecording(recording)}
                    >
                      <Pencil size={14} className="mr-1" />
                      Rename
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleExportRecording(recording)}
                    >
                      <Download size={14} className="mr-1" />
                      Export
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDeleteRecording(recording.id)}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*"
            className="hidden"
          />
          <Button 
            onClick={triggerFileInput} 
            variant="outline"
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Import Recording
              </>
            )}
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingsManager;
