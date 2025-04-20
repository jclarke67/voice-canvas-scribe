
import { useState, useRef, useCallback } from 'react';
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
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert blob to base64 and save it
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64data = reader.result as string;
              const audioId = Math.random().toString(36).substring(2, 15);
              localStorage.setItem(`audio-${audioId}`, base64data);
              
              // Stop all tracks in the stream
              mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
              
              // Clear the recording timer
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              setIsRecording(false);
              setRecordingTime(0);
              resolve({ audioUrl: audioId, duration });
            } catch (error) {
              console.error('Error saving audio:', error);
              resolve(null);
            }
          };
          reader.onerror = () => {
            console.error('Error reading audio blob');
            resolve(null);
          };
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Error creating audio blob:', error);
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
