import { Note, Recording, Folder } from '@/types';
import { getAudioFromStorage } from './storage';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

// Format date for file names
const formatDateForFilename = (date: number): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}_${d.getHours().toString().padStart(2, '0')}-${d.getMinutes().toString().padStart(2, '0')}`;
};

// Export a single note as text file
export const exportNoteAsText = (note: Note): void => {
  try {
    const blob = new Blob([`${note.title}\n\n${note.content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Note'}_${formatDateForFilename(note.updatedAt)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Note exported as text file');
  } catch (error) {
    console.error('Error exporting note:', error);
    toast.error('Failed to export note');
  }
};

// Export a recording
export const exportRecording = (recording: Recording): void => {
  try {
    const audioData = getAudioFromStorage(`audio-${recording.audioUrl}`);
    if (!audioData) {
      toast.error('Recording data not found');
      return;
    }
    
    const a = document.createElement('a');
    a.href = audioData;
    a.download = `${recording.name || 'recording'}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Recording exported');
  } catch (error) {
    console.error('Error exporting recording:', error);
    toast.error('Failed to export recording');
  }
};

// Export multiple notes as a single PDF
export const exportNotesAsPDF = (notes: Note[], title: string = 'Notes Export'): void => {
  try {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 20, yPos);
    yPos += 10;
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Exported on ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 15;
    
    // Process each note
    notes.forEach((note, index) => {
      // Add page break if needed
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add note title
      doc.setFontSize(14);
      doc.text(note.title || 'Untitled Note', 20, yPos);
      yPos += 7;
      
      // Add last modified date
      doc.setFontSize(8);
      doc.text(`Last modified: ${new Date(note.updatedAt).toLocaleString()}`, 20, yPos);
      yPos += 5;
      
      // Add recordings info if any
      if (note.recordings.length > 0) {
        doc.text(`Voice notes: ${note.recordings.length}`, 20, yPos);
        yPos += 5;
      }
      
      // Add separator
      doc.setLineWidth(0.1);
      doc.line(20, yPos, 190, yPos);
      yPos += 7;
      
      // Add note content with word wrapping and pagination
      doc.setFontSize(10);
      
      // Split content into lines with word wrapping
      const splitText = doc.splitTextToSize(note.content || '', 170);
      
      // Process content in chunks that fit on a page
      for (let i = 0; i < splitText.length; i++) {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
          // Add continuation header
          doc.setFontSize(8);
          doc.text(`${note.title || 'Untitled Note'} (continued)`, 20, yPos);
          doc.setFontSize(10);
          yPos += 10;
        }
        
        doc.text(splitText[i], 20, yPos);
        yPos += 5;
      }
      
      // Add extra space between notes
      yPos += 10;
      
      // Add separator between notes
      if (index < notes.length - 1) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setLineWidth(0.2);
        doc.line(15, yPos - 5, 195, yPos - 5);
        yPos += 15;
      }
    });
    
    // Save the PDF
    doc.save(`${title.replace(/\s+/g, '_')}_${formatDateForFilename(Date.now())}.pdf`);
    toast.success('Notes exported as PDF');
  } catch (error) {
    console.error('Error exporting notes as PDF:', error);
    toast.error('Failed to export notes as PDF');
  }
};

// Export folder content as PDF
export const exportFolderAsPDF = (folder: Folder, notes: Note[]): void => {
  const folderNotes = notes.filter(note => note.folderId === folder.id);
  if (folderNotes.length === 0) {
    toast.error('No notes in this folder to export');
    return;
  }
  
  exportNotesAsPDF(folderNotes, `Folder: ${folder.name}`);
};
