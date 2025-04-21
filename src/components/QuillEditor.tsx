
import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  content: string;
  onChange: (content: string) => void;
  getCursorPosition?: () => number;
}

const QuillEditor: React.FC<QuillEditorProps> = ({ 
  content, 
  onChange,
  getCursorPosition
}) => {
  const [value, setValue] = useState(content);
  const quillRef = useRef<ReactQuill>(null);
  
  useEffect(() => {
    setValue(content);
  }, [content]);
  
  const handleChange = useCallback((value: string) => {
    setValue(value);
    onChange(value);
  }, [onChange]);
  
  // Expose the Quill instance for external access to cursor position
  useEffect(() => {
    if (getCursorPosition && quillRef.current) {
      const quill = quillRef.current.getEditor();
      quill.on('selection-change', () => {
        const range = quill.getSelection();
        if (range) {
          // Store the position in a property so it can be accessed externally
          (quillRef.current as any).cursorPosition = range.index;
        }
      });
    }
  }, [getCursorPosition, quillRef]);
  
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];
  
  return (
    <ReactQuill 
      ref={quillRef}
      theme="snow" 
      value={value} 
      onChange={handleChange}
      modules={modules}
      formats={formats}
      className="h-full"
    />
  );
};

export default QuillEditor;
