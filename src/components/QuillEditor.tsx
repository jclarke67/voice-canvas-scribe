
import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './QuillEditor.css'; // Custom styles for the editor
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Ellipsis, TextCursor } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  
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
      
      // Setup image resizing
      quill.root.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'IMG') {
          // When an image is clicked, add a resize class
          document.querySelectorAll('.ql-editor img').forEach((img: Element) => {
            img.classList.remove('quill-image-resizable');
          });
          target.classList.add('quill-image-resizable');
        } else if (!target.closest('img')) {
          // When clicking elsewhere, remove all resize classes
          document.querySelectorAll('.ql-editor img').forEach((img: Element) => {
            img.classList.remove('quill-image-resizable');
          });
        }
      });
      
      // Register the custom size formats
      const sizeStyle = quill.constructor.import('attributors/style/size');
      sizeStyle.whitelist = [
        '8pt', '9pt', '10pt', '12pt', '14pt', '16pt', 
        '18pt', '24pt', '30pt', '36pt', '48pt', '60pt', '72pt'
      ];
      quill.constructor.register(sizeStyle, true);
      
      // Register line height formats
      const Parchment = quill.constructor.import('parchment');
      const lineHeightConfig = {
        scope: Parchment.Scope.INLINE,
        whitelist: ['1.0', '1.2', '1.5', '1.8', '2.0', '2.5', '3.0']
      };
      const LineHeightStyle = new Parchment.Attributor.Style('lineHeight', 'line-height', lineHeightConfig);
      quill.constructor.register({
        'formats/lineHeight': LineHeightStyle
      });
    }
  }, [quillRef]);
  
  // Define custom font sizes
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
  
  // Define line height options
  const lineHeightOptions = [
    { value: '1.0', label: '1.0' },
    { value: '1.2', label: '1.2' },
    { value: '1.5', label: '1.5' },
    { value: '1.8', label: '1.8' },
    { value: '2.0', label: '2.0' },
    { value: '2.5', label: '2.5' },
    { value: '3.0', label: '3.0' }
  ];
  
  // Determine which controls to show in the main toolbar vs the overflow menu
  const mainControls = isSmallScreen ? [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, {'list': 'bullet'}],
    ['link']
  ] : [
    [{ 'header': [1, 2, 3, false] }],
    [{ 'font': [] }],
    [{ 'size': Object.keys(fontSizeAttributor) }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image']
  ];
  
  // Define controls that will go into the overflow menu on small screens
  const overflowControls = [
    [{ 'font': [] }],
    [{ 'size': Object.keys(fontSizeAttributor) }],
    ['strike', 'blockquote'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'lineHeight': lineHeightOptions.map(opt => opt.value) }],
    [{'indent': '-1'}, {'indent': '+1'}],
    ['image'],
    ['clean']
  ];
  
  const modules = {
    toolbar: {
      container: isSmallScreen 
        ? [...mainControls, ['overflow']] 
        : [...mainControls, [{ 'lineHeight': lineHeightOptions.map(opt => opt.value) }], ['clean']],
      handlers: {
        overflow: function() {
          // This is just a placeholder, the actual overflow menu is handled by the Popover component
        }
      }
    }
  };
  
  const formats = [
    'header', 'font', 'size', 'lineHeight',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];
  
  return (
    <div className="quill-editor-container h-full">
      <ReactQuill 
        ref={quillRef}
        theme="snow" 
        value={value} 
        onChange={handleChange}
        modules={modules}
        formats={formats}
        className="h-full"
      />
      
      {isSmallScreen && (
        <div className="quill-overflow-menu">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="quill-overflow-button"
                aria-label="More formatting options"
              >
                <Ellipsis size={18} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="quill-popover-content">
              <div className="quill-overflow-toolbar">
                <h4 className="text-sm font-medium mb-2">Additional Formatting</h4>
                <div className="overflow-formats">
                  <div className="mb-3">
                    <label className="text-xs block mb-1">Font Size</label>
                    <select className="w-full text-xs p-1 border rounded">
                      {Object.entries(fontSizeAttributor).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="text-xs block mb-1">Line Spacing</label>
                    <select className="w-full text-xs p-1 border rounded">
                      {lineHeightOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      Add Image
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Text Color
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Background
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Blockquote
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default QuillEditor;
