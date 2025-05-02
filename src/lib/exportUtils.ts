
import { jsPDF } from "jspdf";
import { Note, Folder, Recording } from "@/types";
import { getAudioFromStorage } from "./storage";

// Helper function to convert HTML to plain text
const htmlToPlainText = (html: string): string => {
  // Create a temporary element to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  // Get the text content, which strips all HTML tags
  return tempDiv.textContent || '';
};

export const exportNoteAsText = (note: Note): void => {
  if (!note) return;

  // Convert all pages to plain text and join them
  let noteContent = "";
  note.pages.forEach((page, index) => {
    noteContent += `---- Page ${index + 1} ----\n\n`;
    noteContent += htmlToPlainText(page.content);
    noteContent += "\n\n";
  });

  // Create a blob with the note content
  const blob = new Blob([`${note.title}\n\n${noteContent}`], {
    type: "text/plain;charset=utf-8",
  });

  // Create a download link and trigger it
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${note.title || "Note"}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportNotesAsPDF = (notes: Note[], filename: string): void => {
  const pdf = new jsPDF();
  let currentPage = 1;

  notes.forEach((note, noteIndex) => {
    // Add note title
    if (noteIndex > 0) {
      pdf.addPage();
      currentPage++;
    }

    pdf.setFontSize(16);
    pdf.text(note.title || "Untitled Note", 20, 20);
    
    pdf.setFontSize(11);
    let yPosition = 30;
    
    // Process all pages for this note
    note.pages.forEach((page, pageIndex) => {
      // Add page header for multi-page notes
      if (pageIndex > 0) {
        yPosition += 10;
      }
      
      pdf.setFontSize(12);
      pdf.text(`Page ${pageIndex + 1}`, 20, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      
      // Convert HTML content to plain text
      const plainText = htmlToPlainText(page.content);
      
      // Split text into lines that fit on PDF page
      const textLines = pdf.splitTextToSize(plainText, 170);
      
      // Check if we need a new page
      if (yPosition + textLines.length * 7 > 280) {
        pdf.addPage();
        currentPage++;
        yPosition = 20;
      }
      
      // Add content lines
      pdf.text(textLines, 20, yPosition);
      yPosition += textLines.length * 7 + 10;
      
      // Check if we need a page break for the next note page
      if (pageIndex < note.pages.length - 1 && yPosition > 250) {
        pdf.addPage();
        currentPage++;
        yPosition = 20;
      }
    });
  });

  pdf.save(`${filename || "Notes"}.pdf`);
};

// Add the missing exportFolderAsPDF function
export const exportFolderAsPDF = (folder: Folder, allNotes: Note[]): void => {
  // Filter notes that belong to this folder
  const folderNotes = allNotes.filter(note => note.folderId === folder.id);
  
  if (folderNotes.length === 0) {
    console.error("No notes found in this folder");
    return;
  }
  
  // Use the existing exportNotesAsPDF function
  exportNotesAsPDF(folderNotes, folder.name);
};

// Add the missing exportRecording function
export const exportRecording = (recording: Recording): void => {
  if (!recording || !recording.audioUrl) {
    console.error("Recording not found or has no audio URL");
    return;
  }
  
  // Get the audio data from storage
  const audioData = getAudioFromStorage(`audio-${recording.audioUrl}`);
  
  if (!audioData) {
    console.error("Audio data not found in storage");
    return;
  }
  
  // Create a download link for the audio
  const link = document.createElement("a");
  link.href = audioData;
  link.download = `${recording.name || "Recording"}.webm`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
