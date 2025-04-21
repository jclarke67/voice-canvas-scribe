import React, { useState, useEffect } from 'react';
import { Mic, StopCircle, Keyboard } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { formatTime } from '@/lib/utils';
import { useNotes } from '@/context/NoteContext';
import PermissionPrompt from './PermissionPrompt';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface RecordingButtonProps {
  getCursorPosition: () => number;
}

const RecordingButton: React.FC<RecordingButtonProps> = ({ getCursorPosition }) => {
  const { isRecording, recordingTime, startRecording, stopRecording, permissionStatus, checkPermission } = useAudioRecorder();
  const { currentNote, saveRecording } = useNotes();
  const [isHovering, setIsHovering] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showKeyboardTip, setShowKeyboardTip] = useState(false);

  useEffect(() => {
    // Check for microphone permission once when component mounts
    checkPermission();
    
    // Show keyboard shortcut tip after 5 seconds if no recording has started
    const timer = setTimeout(() => {
      if (!isRecording && !localStorage.getItem('shortcut-tip-shown')) {
        setShowKeyboardTip(true);
        localStorage.setItem('shortcut-tip-shown', 'true');
      }
    }, 5000);
    
    // Handle beforeunload to save recording if page is refreshed
    const handleBeforeUnload = async () => {
      if (isRecording && currentNote) {
        const result = await stopRecording();
        if (result) {
          saveRecording(currentNote.id, {
            audioUrl: result.audioUrl,
            duration: result.duration,
            timestamp: getCursorPosition(),
            createdAt: Date.now()
          });
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [checkPermission, isRecording, stopRecording, currentNote, saveRecording, getCursorPosition]);

  const handleStartRecording = async () => {
    try {
      setRecordingError(null);
      setShowKeyboardTip(false);
      
      if (permissionStatus === 'prompt' || permissionStatus === 'unknown') {
        setShowPermissionPrompt(true);
        return;
      }
      
      if (permissionStatus === 'denied') {
        setRecordingError('Microphone access denied. Please allow microphone access in your browser settings.');
        return;
      }
      
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRecordingError('Could not access microphone. Please check your permissions.');
    }
  };

  const handleRequestPermission = async () => {
    setShowPermissionPrompt(false);
    try {
      await startRecording();
    } catch (error) {
      console.error('Permission request failed:', error);
      setRecordingError('Microphone access denied. Please allow microphone access in your browser settings.');
    }
  };

  const handlePermissionCancel = () => {
    setShowPermissionPrompt(false);
  };

  const handleStopRecording = async () => {
    try {
      const result = await stopRecording();
      if (result && currentNote) {
        saveRecording(currentNote.id, {
          audioUrl: result.audioUrl,
          duration: result.duration,
          timestamp: getCursorPosition(),
          createdAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setRecordingError('Failed to save recording. Please try again.');
    }
  };
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts(handleStartRecording, handleStopRecording, isRecording);

  return (
    <>
      {showPermissionPrompt && (
        <PermissionPrompt 
          onRequestPermission={handleRequestPermission} 
          onCancel={handlePermissionCancel} 
        />
      )}
      
      <div 
        className="relative inline-block"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {(isHovering || showKeyboardTip) && !isRecording && !recordingError && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-background border border-border shadow-md rounded-md px-3 py-2 text-xs whitespace-nowrap animate-fade-in z-10">
            {showKeyboardTip ? (
              <div className="flex items-center">
                <Keyboard size={14} className="mr-1" />
                <span>Pro tip: Press <kbd className="px-1 py-0.5 bg-accent rounded">Ctrl+R</kbd> to record</span>
                <button 
                  className="ml-2 text-xs underline"
                  onClick={() => setShowKeyboardTip(false)}
                >
                  Got it
                </button>
              </div>
            ) : (
              'Record voice note'
            )}
          </div>
        )}
        
        {recordingError && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground shadow-md rounded-md px-3 py-2 text-xs whitespace-nowrap animate-fade-in z-10 max-w-[200px] text-center">
            {recordingError}
            <button 
              className="ml-2 text-xs underline"
              onClick={() => setRecordingError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        
        <button
          className={`flex items-center justify-center p-2 rounded-full transition-all duration-200 ${
            isRecording 
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse-recording' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={!currentNote}
          title={!currentNote ? "Create a note first" : isRecording ? "Stop recording (Ctrl+R)" : "Start recording (Ctrl+R)"}
        >
          {isRecording ? (
            <div className="flex items-center">
              <StopCircle size={18} />
              <span className="ml-2 text-sm">{formatTime(recordingTime)}</span>
            </div>
          ) : (
            <Mic size={18} />
          )}
        </button>
      </div>
    </>
  );
};

export default RecordingButton;
