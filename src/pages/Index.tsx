
import React, { useState, useEffect } from 'react';
import { NoteProvider, useNotes } from '@/context/NoteContext';
import Sidebar from '@/components/Sidebar';
import NoteEditor from '@/components/NoteEditor';
import EmptyState from '@/components/EmptyState';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';
import { Menu, Plus, HelpCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/App';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const NoteContainer = () => {
  const { notes, currentNote, createNote, selectedNoteIds, toggleNoteSelection, clearNoteSelection } = useNotes();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    if (isMobile) {
      // On mobile, show sidebar by default but with smaller size
      setSidebarOpen(true);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        setTheme(theme === 'light' ? 'dark' : 'light');
      }
      
      if (e.key === '?') {
        setShowKeyboardHelp(true);
      }
      
      // Clear selection when Escape is pressed
      if (e.key === 'Escape' && selectedNoteIds.length > 0) {
        clearNoteSelection();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setTheme, theme, selectedNoteIds.length, clearNoteSelection]);
  
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  const handleCreateNote = () => {
    createNote();
  };
  
  const handleNoteCtrlClick = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    toggleNoteSelection(noteId);
  };
  
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes) => {
          // Store the sizes in localStorage to persist user preferences
          localStorage.setItem('sidebar-sizes', JSON.stringify(sizes));
        }}
      >
        {sidebarOpen && (
          <>
            <ResizablePanel
              id="sidebar-panel"
              order={1}
              defaultSize={isMobile ? 40 : 25}
              minSize={isMobile ? 25 : 15}
              maxSize={isMobile ? 75 : 40}
              className="h-screen"
              // This makes the panel resize correctly on mobile
              style={{ minWidth: isMobile ? '180px' : '200px' }}
            >
              <Sidebar
                isOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
                onNoteCtrlClick={handleNoteCtrlClick}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        <ResizablePanel
          id="main-panel"
          order={2}
          defaultSize={75}
        >
          <div className="flex-1 flex flex-col overflow-hidden relative h-[100vh]">
            {!sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="absolute top-4 left-4 p-2 rounded-md bg-background border shadow-sm hover:bg-accent transition-colors z-10"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            )}

            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 rounded-md bg-background border shadow-sm hover:bg-accent transition-colors"
                aria-label="Keyboard shortcuts"
              >
                <HelpCircle size={18} />
              </button>
            </div>

            {notes.length === 0 ? (
              <EmptyState />
            ) : (
              <NoteEditor />
            )}

            {isMobile && (
              <button
                onClick={handleCreateNote}
                className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors z-10"
                aria-label="Create new note"
              >
                <Plus size={24} />
              </button>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <KeyboardShortcutsHelp isOpen={showKeyboardHelp} onClose={() => setShowKeyboardHelp(false)} />
    </div>
  );
};

const Index = () => {
  return (
    <NoteProvider>
      <NoteContainer />
    </NoteProvider>
  );
};

export default Index;
