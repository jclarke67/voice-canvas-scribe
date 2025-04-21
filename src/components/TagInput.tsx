
import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onAddTag, onRemoveTag }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onAddTag(inputValue.trim());
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove the last tag when backspace is pressed on an empty input
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onRemoveTag(tag);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md mb-2 bg-background">
      {tags.map((tag) => (
        <div 
          key={tag}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-accent rounded-full"
        >
          <span>{tag}</span>
          <button
            onClick={() => handleRemoveTag(tag)}
            className="text-muted-foreground hover:text-foreground focus:outline-none"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={tags.length === 0 ? "Add tags..." : ""}
        className="flex-1 min-w-[100px] outline-none border-none bg-transparent text-sm"
      />
    </div>
  );
};

export default TagInput;
