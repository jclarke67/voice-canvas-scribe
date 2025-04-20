
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNotes } from '@/context/NoteContext';
import RecordingButton from './RecordingButton';
import AudioPlayer from './AudioPlayer';
import { formatDistanceToNow } from 'date-fns';
import { Save, Trash2, Headphones, FolderOpen, Download, FileDown } from 'lucide-react';
import RecordingsManager from './RecordingsManager';
import VoiceRecordingsDropdown from './VoiceRecordingsDropdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportNoteAsText, exportNotesAsPDF } from '@/lib/exportUtils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem, 
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Textarea } from './ui/textarea';

const NoteEditor: React.FC = () => {
  const { currentNote, updateNote, deleteNote, folders } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecordingsManager, setShowRecordingsManager] = useState(false);
  const [showMoveToFolder, setShowMoveToFolder] = useState(false);
  
  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title);
      setContent(currentNote.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [currentNote]);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const getCursorPosition = useCallback(() => {
    return textareaRef.current?.selectionStart || 0;
  }, []);
  
  const saveNote = useCallback(() => {
    if (!currentNote) return;
    
    setIsSaving(true);
    updateNote({
      ...currentNote,
      title,
      content
    });
    
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  }, [currentNote, title, content, updateNote]);
  
  useEffect(() => {
    if (!currentNote) return;
    
    const timer = setTimeout(() => {
      saveNote();
    }, 800);
    
    return () => clearTimeout(timer);
  }, [title, content, currentNote, saveNote]);
  
  const handleDeleteNote = () => {
    if (!currentNote) return;
    if (showDeleteConfirm) {
      deleteNote(currentNote.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => {
        setShowDeleteConfirm(false);
      }, 3000);
    }
  };
  
  const handleMoveToFolder = (folderId: string | undefined) => {
    if (!currentNote) return;
    
    updateNote({
      ...currentNote,
      folderId
    });
    
    setShowMoveToFolder(false);
  };
  
  const handleExportNote = () => {
    if (!currentNote) return;
    exportNoteAsText(currentNote);
  };
  
  const handleExportAsPDF = () => {
    if (!currentNote) return;
    exportNotesAsPDF([currentNote], currentNote.title || 'Note Export');
  };
  
  if (!currentNote) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground p-6">
        <p>No note selected. Create a new note or select an existing one.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[100vh] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="text-lg font-medium bg-transparent border-none outline-none focus:ring-0 w-full"
          />
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="Download note">
                <FileDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportNote}>
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAsPDF}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowMoveToFolder(true)}
            title="Move to folder"
          >
            <FolderOpen size={16} />
          </Button>
          
          {currentNote.recordings.length > 0 && (
            <>
              <VoiceRecordingsDropdown noteId={currentNote.id} />
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowRecordingsManager(true)}
                title="Manage all recordings"
              >
                <Headphones size={16} />
              </Button>
            </>
          )}
          
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(currentNote.updatedAt, { addSuffix: true })}
          </span>
          
          <div className={`transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'}`}>
            <Save size={16} />
          </div>
          
          <button 
            onClick={handleDeleteNote}
            className={`p-1 rounded-md transition-colors ${
              showDeleteConfirm ? 'bg-red-500 text-white' : 'hover:bg-accent text-muted-foreground'
            }`}
            title={showDeleteConfirm ? "Click again to confirm deletion" : "Delete note"}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4 flex flex-col">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Type your note here..."
          className="w-full h-[80vh] resize-none bg-transparent border-none outline-none focus:ring-0 text-foreground"
        />
        
        {currentNote.recordings.length > 0 && (
          <div className="mt-2 border-t pt-2">
            <h3 className="font-medium text-sm mb-1">Voice notes</h3>
            <div className="space-y-2 max-h-[20vh] overflow-y-auto">
              {currentNote.recordings.map(recording => (
                <AudioPlayer 
                  key={recording.id} 
                  audioId={recording.audioUrl} 
                  duration={recording.duration} 
                  name={recording.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t p-2 flex justify-between items-center">
        <RecordingButton getCursorPosition={getCursorPosition} />
        <div className="text-xs text-muted-foreground">
          {currentNote.recordings.length} voice note{currentNote.recordings.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <RecordingsManager
        isOpen={showRecordingsManager}
        onClose={() => setShowRecordingsManager(false)}
      />
      
      <Dialog open={showMoveToFolder} onOpenChange={setShowMoveToFolder}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={currentNote.folderId || "unfiled"}
              onValueChange={(value) => handleMoveToFolder(value === "unfiled" ? undefined : value)}
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
    </div>
  );
};

export default NoteEditor;
