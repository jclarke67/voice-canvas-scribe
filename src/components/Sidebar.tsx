
import React, { useState } from 'react';
import { useNotes } from '@/context/NoteContext';
import NoteCard from './NoteCard';
import { Plus, Search, Menu, FolderPlus, Folder, ChevronDown, ChevronRight, FileDown, Trash2, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import FolderManager from './FolderManager';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { exportFolderAsPDF, exportNotesAsPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';
import MultiSelectControls from './MultiSelectControls';
import TagsList from './TagsList';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onNoteCtrlClick?: (e: React.MouseEvent, noteId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  onNoteCtrlClick
}) => {
  const {
    notes,
    folders,
    currentNote,
    selectedNoteIds,
    createNote,
    deleteFolder,
    updateFolder,
    getNotesWithTag
  } = useNotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    folders: true,
    tags: true,
    unfiled: true
  });
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDeleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder toggle
    if (window.confirm('Are you sure you want to delete this folder? Notes will be moved to Unfiled.')) {
      deleteFolder(folderId);
    }
  };

  const handleExportFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder toggle
    const folder = folders.find(f => f.id === folderId);
    if (!folder) {
      toast.error('Folder not found');
      return;
    }
    exportFolderAsPDF(folder, notes);
  };

  const handleExportAllNotes = () => {
    if (notes.length === 0) {
      toast.error('No notes to export');
      return;
    }
    exportNotesAsPDF(notes, 'All Notes');
  };

  let filteredNotes = searchTerm 
    ? notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        note.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : notes;
  
  // If a tag is selected, filter notes by that tag
  if (selectedTag && !searchTerm) {
    filteredNotes = getNotesWithTag(selectedTag);
  }
  
  const sortedNotes = [...filteredNotes].sort((a, b) => b.updatedAt - a.updatedAt);
  const unfilteredNotes = sortedNotes.filter(note => !note.folderId);
  const folderNotes: Record<string, typeof sortedNotes> = {};
  
  folders.forEach(folder => {
    folderNotes[folder.id] = sortedNotes.filter(note => note.folderId === folder.id);
  });

  const handleStartEditingFolder = (folderId: string, folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folderId);
    setEditingFolderName(folderName);
  };

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFolderId && editingFolderName.trim()) {
      updateFolder(editingFolderId, editingFolderName.trim());
      setEditingFolderId(null);
      setEditingFolderName('');
    }
  };

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(prev => !prev);
  };

  const handleSelectTag = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="font-semibold text-lg">Voice Canvas</h1>
        <div className="flex items-center space-x-1">
          <ThemeToggle />
          <button onClick={toggleSidebar} className="p-1 rounded-md hover:bg-accent">
            <Menu size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {selectedNoteIds.length > 0 && <MultiSelectControls />}
        
        <div className="mb-4 flex items-center justify-between">
          <div className="relative flex-1 mr-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedTag(null); // Clear selected tag when searching
              }}
              placeholder="Search notes..."
              className="w-full h-9 px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          
          <button
            onClick={toggleMultiSelectMode}
            className={cn(
              "px-2 py-1 text-xs rounded-md transition-colors",
              multiSelectMode 
                ? "bg-primary text-primary-foreground" 
                : "bg-accent text-accent-foreground"
            )}
          >
            {multiSelectMode ? "Cancel Select" : "Select"}
          </button>
        </div>
        
        {searchTerm && sortedNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <p className="mb-2">No notes found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}

        {selectedTag && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-accent rounded-md">
                <Tag size={14} className="text-primary" />
                <span className="text-sm font-medium">{selectedTag}</span>
                <button 
                  onClick={() => setSelectedTag(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              {sortedNotes.length === 0 ? (
                <div className="text-xs text-muted-foreground p-2">
                  No notes with this tag
                </div>
              ) : (
                sortedNotes.map(note => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    isSelected={selectedNoteIds.includes(note.id)}
                    multiSelectMode={multiSelectMode}
                    onCtrlClick={onNoteCtrlClick}
                  />
                ))
              )}
            </div>
          </div>
        )}
        
        {!searchTerm && !selectedTag && (
          <>
            {/* Tags Section */}
            <Collapsible 
              open={expandedSections.tags}
              onOpenChange={() => toggleSection('tags')}
              className="mb-4"
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
                <div className="text-sm font-medium flex items-center">
                  <Tag size={16} className="mr-2 text-primary" />
                  Tags
                </div>
                {expandedSections.tags ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              
              <CollapsibleContent className="ml-4 mt-1">
                <TagsList onSelectTag={handleSelectTag} activeTag={selectedTag} />
              </CollapsibleContent>
            </Collapsible>
            
            {/* Folders Section */}
            <Collapsible 
              open={expandedSections.folders}
              onOpenChange={() => toggleSection('folders')}
              className="mb-4"
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
                <div className="text-sm font-medium flex items-center">
                  <Folder size={16} className="mr-2 text-primary" />
                  Folders
                </div>
                <div className="flex space-x-1">
                  <button onClick={handleExportAllNotes} className="p-1 rounded-md hover:bg-accent text-muted-foreground" title="Export all notes">
                    <FileDown size={16} />
                  </button>
                  <button onClick={() => setShowFolderManager(true)} className="p-1 rounded-md hover:bg-accent text-muted-foreground" title="Manage folders">
                    <FolderPlus size={16} />
                  </button>
                  {expandedSections.folders ? (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={16} className="text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="ml-4 mt-1">
                {folders.map(folder => (
                  <Collapsible 
                    key={folder.id} 
                    open={expandedFolders[folder.id]} 
                    onOpenChange={() => toggleFolder(folder.id)} 
                    className="mb-1"
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-accent/50 rounded-md">
                      <div className="flex items-center text-sm flex-1">
                        <Folder size={16} className="mr-2 text-primary" />
                        {editingFolderId === folder.id ? (
                          <form onSubmit={handleSaveFolder} className="flex-1">
                            <input 
                              type="text" 
                              value={editingFolderName} 
                              onChange={e => setEditingFolderName(e.target.value)} 
                              onBlur={handleSaveFolder} 
                              className="w-full bg-background px-2 py-1 rounded-md text-sm" 
                              autoFocus 
                            />
                          </form>
                        ) : (
                          <>
                            <span 
                              onDoubleClick={e => handleStartEditingFolder(folder.id, folder.name, e)} 
                              className="flex-1"
                            >
                              {folder.name}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({folderNotes[folder.id]?.length || 0})
                            </span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={e => handleExportFolder(folder.id, e)} 
                          className="p-1 rounded-md hover:bg-accent text-muted-foreground" 
                          title="Export folder"
                        >
                          <FileDown size={14} />
                        </button>
                        <button 
                          onClick={e => handleDeleteFolder(folder.id, e)} 
                          className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-destructive" 
                          title="Delete folder"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expandedFolders[folder.id] ? (
                          <ChevronDown size={16} className="text-muted-foreground" />
                        ) : (
                          <ChevronRight size={16} className="text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-4 mt-1 space-y-1">
                      {folderNotes[folder.id]?.length > 0 ? (
                        folderNotes[folder.id].map(note => (
                          <NoteCard 
                            key={note.id} 
                            note={note} 
                            isSelected={selectedNoteIds.includes(note.id)}
                            multiSelectMode={multiSelectMode}
                            onCtrlClick={onNoteCtrlClick}
                          />
                        ))
                      ) : (
                        <div className="text-xs text-muted-foreground p-2">
                          No notes in this folder
                        </div>
                      )}
                      <button 
                        onClick={() => createNote(folder.id)} 
                        className="w-full text-left text-xs p-2 text-muted-foreground hover:bg-accent/50 rounded-md flex items-center"
                      >
                        <Plus size={14} className="mr-1" />
                        New note in this folder
                      </button>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CollapsibleContent>
            </Collapsible>
            
            {/* Unfiled Notes */}
            <Collapsible 
              open={expandedSections.unfiled}
              onOpenChange={() => toggleSection('unfiled')}
              className="mb-4"
            >
              <CollapsibleTrigger className="w-full flex justify-between items-center p-2 hover:bg-accent/50 rounded-md">
                <div className="text-sm font-medium flex items-center">
                  <Folder size={16} className="mr-2 text-muted-foreground" />
                  Unfiled Notes
                </div>
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-md hover:bg-accent text-muted-foreground" title="Export unfiled notes">
                        <FileDown size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportNotesAsPDF(unfilteredNotes, 'Unfiled Notes')}>
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {expandedSections.unfiled ? (
                    <ChevronDown size={16} className="text-muted-foreground ml-1" />
                  ) : (
                    <ChevronRight size={16} className="text-muted-foreground ml-1" />
                  )}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-1 space-y-1">
                {unfilteredNotes.length > 0 ? (
                  unfilteredNotes.map(note => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      isSelected={selectedNoteIds.includes(note.id)}
                      multiSelectMode={multiSelectMode}
                      onCtrlClick={onNoteCtrlClick}
                    />
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground p-2">
                    No unfiled notes
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </div>
      
      <div className="p-3 border-t">
        <button 
          onClick={() => createNote()} 
          className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center"
        >
          <Plus size={16} className="mr-1" />
          New Note
        </button>
      </div>

      {showFolderManager && (
        <FolderManager 
          isOpen={showFolderManager} 
          onClose={() => setShowFolderManager(false)} 
        />
      )}
    </div>
  );
};

export default Sidebar;
