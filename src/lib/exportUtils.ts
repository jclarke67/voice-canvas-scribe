
import { Note, Recording, Folder } from '@/types';
import { getAudioFromStorage } from './storage';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

// Format date for file names
const formatDateForFilename = (date: number): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}_${d.getHours().toString().padStart(2, '0')}-${d.getMinutes().toString().padStart(2, '0')}`;
};

// Get plain text content from HTML
const htmlToPlainText = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

// Export a single note as text file
export const exportNoteAsText = (note: Note): void => {
  try {
    let plainText = `${note.title}\n\n`;
    
    // Add content from all pages
    note.pages.forEach((page, index) => {
      if (index > 0) {
        plainText += `\n\n--- Page ${index + 1} ---\n\n`;
      }
      plainText += htmlToPlainText(page.content || '');
    });
    
    const blob = new Blob([plainText], { type: 'text/plain' });
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
    notes.forEach((note, noteIndex) => {
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

      // Process all pages for this note (preserving order and moving on only after all pages are printed)
      note.pages.forEach((page, pageIndex) => {
        // Add page number if not first page of the note
        if (pageIndex > 0) {
          yPos += 5;
          doc.setFontSize(9);
          doc.text(`Page ${pageIndex + 1}`, 20, yPos);
          yPos += 7;
        }

        // Convert HTML content to plain text and split by lines
        const plainContent = htmlToPlainText(page.content || '');
        const lineArr = plainContent.split('\n');

        doc.setFontSize(10);

        // Write each line, preserving empty lines as paragraph gaps
        for (const line of lineArr) {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
            // Add a continuation header
            doc.setFontSize(8);
            doc.text(`${note.title || 'Untitled Note'} (continued, page ${pageIndex + 1})`, 20, yPos);
            doc.setFontSize(10);
            yPos += 10;
          }
          // Word wrap each line to fit PDF width (170)
          const wrappedLines = doc.splitTextToSize(line, 170);
          for (const wrappedLine of wrappedLines) {
            doc.text(wrappedLine, 20, yPos);
            yPos += 5;
          }
          // If the line is empty (a paragraph break or extra newline), add vertical space
          if (line.trim() === '') {
            yPos += 3; // extra gap for empty lines
          }
        }

        // Gap between pages
        yPos += 5;
      });

      // Add extra space between notes
      yPos += 10;

      // Add separator between notes
      if (noteIndex < notes.length - 1) {
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
