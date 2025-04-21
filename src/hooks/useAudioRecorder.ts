
import { useState, useRef, useCallback, useEffect } from 'react';
import { saveAudioToStorage } from '@/lib/storage';

interface RecordingResult {
  audioUrl: string;
  duration: number;
}

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'prompt'|'granted'|'denied'|'unknown'>('unknown');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  // Keep recording state in sessionStorage to recover after page refresh
  useEffect(() => {
    const savedRecordingState = sessionStorage.getItem('voice-canvas-recording-state');
    if (savedRecordingState) {
      try {
        const state = JSON.parse(savedRecordingState);
        if (state.isRecording) {
          // Try to restart recording
          startTimeRef.current = state.startTime || Date.now();
          setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
          // We can't truly restore the MediaRecorder, but we can update the UI
          // to indicate recording and then let user manually stop/restart
          setIsRecording(true);
          // Start timer
          timerRef.current = window.setInterval(() => {
            setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
          }, 1000);
          
          // Auto-restart recording
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              const mediaRecorder = new MediaRecorder(stream);
              mediaRecorderRef.current = mediaRecorder;
              audioChunksRef.current = [];
              
              mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
                }
              };
              
              mediaRecorder.start();
              setPermissionStatus('granted');
            })
            .catch(error => {
              console.error('Failed to restart recording after refresh:', error);
              setIsRecording(false);
              sessionStorage.removeItem('voice-canvas-recording-state');
            });
        }
      } catch (error) {
        console.error('Failed to parse recording state:', error);
        sessionStorage.removeItem('voice-canvas-recording-state');
      }
    }

    // Add beforeunload event to auto-save recording on page refresh
    const handleBeforeUnload = () => {
      if (isRecording && mediaRecorderRef.current) {
        // Force the media recorder to stop and save data
        mediaRecorderRef.current.stop();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Update session storage whenever recording state changes
  useEffect(() => {
    if (isRecording) {
      sessionStorage.setItem('voice-canvas-recording-state', JSON.stringify({
        isRecording,
        startTime: startTimeRef.current
      }));
    } else {
      sessionStorage.removeItem('voice-canvas-recording-state');
    }
  }, [isRecording]);

  // Check microphone permission status
  const checkPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionStatus(result.state as 'prompt'|'granted'|'denied');
      
      // Listen for permission changes
      result.addEventListener('change', () => {
        setPermissionStatus(result.state as 'prompt'|'granted'|'denied');
      });
      
      return result.state;
    } catch (error) {
      console.error('Failed to query microphone permission:', error);
      return 'unknown';
    }
  }, []);

  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      // Check permission first
      const permission = await checkPermission();
      if (permission === 'denied') {
        throw new Error('Microphone permission denied');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionStatus('granted');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      
      // Update recording time every second
      timerRef.current = window.setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermissionStatus('denied');
      throw error;
    }
  }, [checkPermission]);

  // Stop recording and return the audio blob
  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      mediaRecorderRef.current.onstop = async () => {
        try {
          // Only process if we have chunks
          if (audioChunksRef.current.length === 0) {
            resolve(null);
            return;
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert blob to base64 and save it
          const audioId = await saveAudioToStorage(audioBlob);
          
          // Stop all tracks in the stream
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          
          // Clear the recording timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          setIsRecording(false);
          setRecordingTime(0);

          // Clear recording state from session storage
          sessionStorage.removeItem('voice-canvas-recording-state');
          
          resolve({ audioUrl: audioId, duration });
        } catch (error) {
          console.error('Error saving audio:', error);
          resolve(null);
        }
      };
      
      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    permissionStatus,
    checkPermission
  };
};
