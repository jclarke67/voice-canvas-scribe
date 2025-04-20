
/**
 * Date utilities for grouping and organizing notes
 */

/**
 * Get the week number for a given date
 */
export const getWeekNumber = (date: Date): string => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

/**
 * Get formatted week display (e.g., "Week 12, 2025")
 */
export const getWeekDisplay = (weekId: string): string => {
  const [year, week] = weekId.split('-W');
  return `Week ${parseInt(week)}, ${year}`;
};

/**
 * Get start and end dates for a given week
 */
export const getWeekDateRange = (weekId: string): { start: Date; end: Date } => {
  const [year, weekNum] = weekId.split('-W');
  const simple = new Date(parseInt(year), 0, 1 + (parseInt(weekNum) - 1) * 7);
  const dayOfWeek = simple.getDay();
  const diff = simple.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  
  const start = new Date(simple.setDate(diff));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  return { start, end };
};

/**
 * Group notes by week
 */
export const groupNotesByWeek = (notes: any[]): Record<string, any[]> => {
  const groupedNotes: Record<string, any[]> = {};
  
  notes.forEach(note => {
    const date = new Date(note.createdAt);
    const weekId = getWeekNumber(date);
    
    if (!groupedNotes[weekId]) {
      groupedNotes[weekId] = [];
    }
    
    groupedNotes[weekId].push(note);
  });
  
  return groupedNotes;
};

/**
 * Check if a week is the current week
 */
export const isCurrentWeek = (weekId: string): boolean => {
  const currentWeek = getWeekNumber(new Date());
  return weekId === currentWeek;
};

/**
 * Get the previous week's ID
 */
export const getPreviousWeekId = (weekId: string): string => {
  const [year, week] = weekId.split('-W');
  const weekNumber = parseInt(week);
  
  if (weekNumber > 1) {
    return `${year}-W${(weekNumber - 1).toString().padStart(2, '0')}`;
  } else {
    // Last week of the previous year
    const prevYear = parseInt(year) - 1;
    // Assuming 52 weeks in a year (simplified)
    return `${prevYear}-W52`;
  }
};
