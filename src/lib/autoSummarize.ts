
import { Note, Folder } from '@/types';
import { getWeekNumber, getWeekDisplay, getWeekDateRange, getPreviousWeekId } from './dateUtils';
import { formatISO } from 'date-fns';

/**
 * Creates a summary from a collection of notes
 */
export const createSummaryFromNotes = (notes: Note[]): string => {
  if (notes.length === 0) return '';
  
  // Sort notes by created date
  const sortedNotes = [...notes].sort((a, b) => a.createdAt - b.createdAt);
  
  // Create a summary header
  let summary = `# Weekly Summary\n\n`;
  summary += `## Overview\n\n`;
  summary += `This summary contains ${notes.length} notes from ${formatISO(new Date(sortedNotes[0].createdAt), { representation: 'date' })} to ${formatISO(new Date(sortedNotes[sortedNotes.length - 1].createdAt), { representation: 'date' })}\n\n`;
  
  // Add summary of each note
  summary += `## Note Summaries\n\n`;
  
  sortedNotes.forEach((note, index) => {
    summary += `### ${index + 1}. ${note.title}\n`;
    
    // Add note creation date
    summary += `*Created: ${formatISO(new Date(note.createdAt), { representation: 'date' })}*\n\n`;
    
    // Add note content (limited to first 150 characters to keep summary concise)
    const contentPreview = note.content.length > 150 
      ? note.content.substring(0, 150) + '...' 
      : note.content;
    
    summary += `${contentPreview}\n\n`;
    
    // Add recording information if any
    if (note.recordings.length > 0) {
      summary += `*This note has ${note.recordings.length} voice recording${note.recordings.length > 1 ? 's' : ''}*\n\n`;
    }
  });
  
  return summary;
};

/**
 * Check if a note is a weekly summary note
 */
export const isWeeklySummaryNote = (note: Note): boolean => {
  return note.title.startsWith('Weekly Summary:');
};

/**
 * Get the week ID from a weekly summary note
 */
export const getWeekIdFromSummaryNote = (note: Note): string | null => {
  const match = note.title.match(/Weekly Summary: Week (\d+), (\d+)/);
  if (match) {
    const weekNum = parseInt(match[1]);
    const year = match[2];
    return `${year}-W${weekNum.toString().padStart(2, '0')}`;
  }
  return null;
};

/**
 * Generate a title for a weekly summary
 */
export const generateWeeklySummaryTitle = (weekId: string): string => {
  return `Weekly Summary: ${getWeekDisplay(weekId)}`;
};

/**
 * Process auto-summarization of notes
 * @returns object with any created summary notes
 */
export const processAutoSummarization = (
  notes: Note[], 
  folders: Folder[],
  createFolder: (name: string) => void,
  createNote: (folderId?: string) => void,
  updateNote: (note: Note) => void
): { summaryNotes: Note[] } => {
  // Find or create the Auto Note Summaries folder
  let summariesFolder = folders.find(folder => folder.name === 'Auto Note Summaries');
  
  if (!summariesFolder) {
    createFolder('Auto Note Summaries');
    summariesFolder = folders.find(folder => folder.name === 'Auto Note Summaries');
    
    // If folder creation failed, we can't continue
    if (!summariesFolder) {
      console.error('Failed to create Auto Note Summaries folder');
      return { summaryNotes: [] };
    }
  }
  
  // Get the current week and check if we need to generate a summary for the previous week
  const currentDate = new Date();
  const currentWeekId = getWeekNumber(currentDate);
  const prevWeekId = getPreviousWeekId(currentWeekId);
  
  // Find notes from the previous week (excluding existing summary notes)
  const regularNotes = notes.filter(note => !isWeeklySummaryNote(note));
  const prevWeekNotes = regularNotes.filter(note => {
    const noteDate = new Date(note.createdAt);
    const noteWeekId = getWeekNumber(noteDate);
    return noteWeekId === prevWeekId;
  });
  
  // Find existing summary notes for the previous week
  const existingSummaryNotes = notes.filter(note => {
    return note.folderId === summariesFolder?.id && isWeeklySummaryNote(note);
  });
  
  const existingPrevWeekSummary = existingSummaryNotes.find(note => {
    const weekId = getWeekIdFromSummaryNote(note);
    return weekId === prevWeekId;
  });
  
  const createdSummaryNotes: Note[] = [];
  
  // If there are notes from the previous week and no existing summary
  if (prevWeekNotes.length > 0 && !existingPrevWeekSummary) {
    // Create a new summary note
    const title = generateWeeklySummaryTitle(prevWeekId);
    const content = createSummaryFromNotes(prevWeekNotes);
    
    // Find a newly created note to use as our summary note
    const lastCreatedNoteIndex = notes.length;
    createNote(summariesFolder.id);
    
    // If a new note was created, we should find it and update it
    if (notes.length > lastCreatedNoteIndex) {
      const newSummaryNote = notes[notes.length - 1];
      
      // Update the note with our summary content
      updateNote({
        ...newSummaryNote,
        title,
        content,
      });
      
      createdSummaryNotes.push({
        ...newSummaryNote,
        title,
        content,
      });
    }
  }
  
  return { summaryNotes: createdSummaryNotes };
};
