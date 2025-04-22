
import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './QuillEditor.css'; // Custom styles for the editor

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

  // Enable image resizing when the editor is initialized
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      
      // Add image resize capability if it doesn't exist
      if (!quill.getModule('imageResize')) {
        // For non-Quill built-in modules, we would typically need to use additional libraries
        // like quill-image-resize-module, but since we can't install new packages directly,
        // we'll add basic resize functionality using CSS and the existing Quill API
        
        // Add click handler for images
        quill.root.addEventListener('click', (event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === 'IMG') {
            // When an image is clicked, add a resize class
            target.classList.add('quill-image-resizable');
            
            // Remove the class from all other images
            quill.root.querySelectorAll('img.quill-image-resizable').forEach((img: Element) => {
              if (img !== target) {
                img.classList.remove('quill-image-resizable');
              }
            });
          } else {
            // When clicking elsewhere, remove all resize classes
            quill.root.querySelectorAll('img.quill-image-resizable').forEach((img: Element) => {
              img.classList.remove('quill-image-resizable');
            });
          }
        });
      }
    }
  }, [quillRef]);
  
  // Define custom font sizes (in px)
  const fontSizeAttributor = {
    "8pt": "8pt",
    "9pt": "9pt",
    "10pt": "10pt",
    "12pt": "12pt",
    "14pt": "14pt",
    "16pt": "16pt",
    "18pt": "18pt",
    "24pt": "24pt",
    "30pt": "30pt",
    "36pt": "36pt",
    "48pt": "48pt",
    "60pt": "60pt",
    "72pt": "72pt"
  };
  
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      [{ 'font': [] }],
      [{ 'size': Object.keys(fontSizeAttributor) }], // Font size options
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'color': [] }, { 'background': [] }], // Text color and highlighting
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };
  
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background',
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
