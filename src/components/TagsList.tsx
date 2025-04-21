
import React from 'react';
import { useNotes } from '@/context/NoteContext';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface TagsListProps {
  onSelectTag: (tag: string) => void;
  activeTag: string | null;
}

const TagsList: React.FC<TagsListProps> = ({ onSelectTag, activeTag }) => {
  const { getAllTags } = useNotes();
  const tags = getAllTags();
  
  if (tags.length === 0) {
    return (
      <div className="text-xs text-muted-foreground p-2">
        No tags yet
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {tags.map(tag => (
        <div
          key={tag}
          onClick={() => onSelectTag(tag)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer",
            activeTag === tag ? "bg-accent" : "hover:bg-accent/50"
          )}
        >
          <Tag size={16} className="text-primary" />
          <span className="truncate">{tag}</span>
        </div>
      ))}
    </div>
  );
};

export default TagsList;
