
import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '@/context/NoteContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Headphones, Download, Trash2, Play, Pause } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { getAudioFromStorage } from '@/lib/storage';
import { exportRecording } from '@/lib/exportUtils';
import { Button } from '@/components/ui/button';
import { Recording } from '@/types';

interface VoiceRecordingsDropdownProps {
  noteId: string;
}

const VoiceRecordingsDropdown: React.FC<VoiceRecordingsDropdownProps> = ({ noteId }) => {
  const { notes, deleteRecording } = useNotes();
  const [currentNote, setCurrentNote] = useState(() => notes.find(note => note.id === noteId));
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentNote(notes.find(note => note.id === noteId));
  }, [notes, noteId]);
  
  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);
  
  const handlePlay = (e: React.MouseEvent, recording: Recording) => {
    e.stopPropagation(); // Prevent the dropdown from closing
    
    if (!audioRef.current) return;
    
    if (playingId === recording.id) {
      // Already playing this recording, pause it
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      // Play a new recording
      const audioUrl = getAudioFromStorage(`audio-${recording.audioUrl}`);
      if (!audioUrl) {
        console.error('Audio not found');
        return;
      }
      
      if (playingId) {
        // Stop currently playing audio
        audioRef.current.pause();
      }
      
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
      });
      setPlayingId(recording.id);
      
      // Handle when audio ends
      audioRef.current.onended = () => {
        setPlayingId(null);
      };
    }
  };
  
  const handleExport = (e: React.MouseEvent, recording: Recording) => {
    e.stopPropagation(); // Prevent the dropdown from closing
    exportRecording(recording);
  };
  
  const handleDelete = (e: React.MouseEvent, recordingId: string) => {
    e.stopPropagation(); // Prevent the dropdown from closing
    
    if (window.confirm('Are you sure you want to delete this recording?')) {
      deleteRecording(noteId, recordingId);
      if (playingId === recordingId && audioRef.current) {
        audioRef.current.pause();
        setPlayingId(null);
      }
    }
  };
  
  if (!currentNote || currentNote.recordings.length === 0) {
    return (
      <Button variant="ghost" size="sm" disabled title="No recordings">
        <Headphones size={16} />
      </Button>
    );
  }
  
  return (
    <>
      <audio ref={audioRef} />
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Voice recordings">
            <Headphones size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Voice Recordings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {currentNote.recordings.map((recording) => (
            <React.Fragment key={recording.id}>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-2 cursor-default" onSelect={(e) => e.preventDefault()}>
                <div className="flex w-full justify-between items-center">
                  <span className="font-medium truncate max-w-[140px]">{recording.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(recording.duration)}
                  </span>
                </div>
                
                <div className="flex w-full justify-between items-center mt-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => handlePlay(e, recording)}
                  >
                    {playingId === recording.id ? (
                      <Pause size={14} />
                    ) : (
                      <Play size={14} />
                    )}
                  </Button>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => handleExport(e, recording)}
                    >
                      <Download size={14} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:text-destructive"
                      onClick={(e) => handleDelete(e, recording.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default VoiceRecordingsDropdown;
