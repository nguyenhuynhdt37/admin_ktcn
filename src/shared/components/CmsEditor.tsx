import { useRef, useMemo, memo } from 'react'
import JoditEditor from 'jodit-react'
import 'jodit/es5/jodit.min.css'

interface CmsEditorProps {
  /** Nội dung HTML */
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Chiều cao tối thiểu vùng soạn thảo (px). Mặc định 350 */
  minHeight?: number
  /** Chiều cao tối đa vùng soạn thảo (px), vượt sẽ cuộn. Mặc định 600 */
  maxHeight?: number
}

export const CmsEditor = memo(function CmsEditor({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  minHeight = 350,
  maxHeight = 600,
}: CmsEditorProps) {
  const editorRef = useRef<any>(null)

  const config = useMemo(() => ({
    readonly: disabled,
    placeholder: placeholder || 'Nhập nội dung...',
    height: 'auto',
    minHeight: minHeight,
    maxHeight: maxHeight,
    toolbarSticky: false,
    theme: 'default',
    buttons: [
      'source',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'ul',
      'ol',
      '|',
      'outdent',
      'indent',
      '|',
      'font',
      'fontsize',
      'brush',
      'paragraph',
      '|',
      'image',
      'video',
      'table',
      'link',
      '|',
      'align',
      'undo',
      'redo',
      '|',
      'hr',
      'eraser',
      'copyformat',
      '|',
      'symbol',
      'fullsize',
      'print'
    ],
    uploader: {
      insertImageAsBase64URI: true
    },
    // Customize style in the editor area
    style: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '15px',
      color: '#1e293b',
      background: '#ffffff'
    }
  }), [disabled, placeholder, minHeight, maxHeight])

  const handleBlur = (newContent: string) => {
    onChange?.(newContent)
  }

  return (
    <div 
      className="jodit-editor-wrapper relative w-full border rounded-lg overflow-hidden bg-background"
      style={{
        '--jodit-editor-min-height': `${minHeight}px`,
        '--jodit-editor-max-height': `${maxHeight}px`,
      } as React.CSSProperties}
    >
      <style>{`
        /* Overrides to make Jodit blend nicely with Shadcn UI */
        .jodit-container {
          border: none !important;
        }
        .jodit-workplace {
          background-color: #ffffff !important;
        }
        .jodit-wysiwyg {
          min-height: \${minHeight}px !important;
          max-height: \${maxHeight}px !important;
          overflow-y: auto !important;
          padding: 1rem 1.25rem !important;
        }
        .dark .jodit-wysiwyg {
          background-color: #0f172a !important;
          color: #f8fafc !important;
        }
        .dark .jodit-container {
          background-color: #1e293b !important;
          color: #f8fafc !important;
        }
        .dark .jodit-toolbar__box {
          background-color: #1e293b !important;
        }
        .dark .jodit-toolbar-button__button {
          color: #cbd5e1 !important;
        }
        .dark .jodit-toolbar-button__button:hover {
          background-color: #334155 !important;
        }
        .dark .jodit-status-bar {
          background-color: #1e293b !important;
          border-top-color: #334155 !important;
        }
      `}</style>
      <JoditEditor
        ref={editorRef}
        value={value}
        config={config}
        onBlur={handleBlur}
        onChange={onChange}
      />
    </div>
  )
})
