import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  List,
  BlockQuote,
  CodeBlock,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  MediaEmbed,
  HorizontalLine,
  Undo,
  FindAndReplace,
  SourceEditing,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  ImageUpload,
  ImageInsert,
  Base64UploadAdapter,
  Autoformat,
  HtmlEmbed,
  Indent,
  IndentBlock,
  Alignment,
} from 'ckeditor5'
import { Maximize2, Minimize2 } from 'lucide-react'

import 'ckeditor5/ckeditor5.css'

interface CmsEditorProps {
  /** Nội dung HTML */
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Chiều cao tối thiểu vùng soạn thảo (px). Mặc định 200 */
  minHeight?: number
  /** Chiều cao tối đa vùng soạn thảo (px), vượt sẽ cuộn. Mặc định 500 */
  maxHeight?: number
}

// CKEditor config — khai báo ngoài component để tránh tạo object mới mỗi render
const EDITOR_PLUGINS = [
  Essentials,
  Autoformat,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  List,
  BlockQuote,
  CodeBlock,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  MediaEmbed,
  HtmlEmbed,
  HorizontalLine,
  Undo,
  FindAndReplace,
  SourceEditing,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  ImageUpload,
  ImageInsert,
  Base64UploadAdapter,
  Indent,
  IndentBlock,
  Alignment,
]

const EDITOR_TOOLBAR = {
  items: [
    'heading',
    '|',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    '|',
    'alignment',
    '|',
    'link',
    'insertImage',
    'insertTable',
    'mediaEmbed',
    'htmlEmbed',
    '|',
    'bulletedList',
    'numberedList',
    'outdent',
    'indent',
    '|',
    'blockQuote',
    'codeBlock',
    'horizontalLine',
    '|',
    'findAndReplace',
    'sourceEditing',
    '|',
    'undo',
    'redo',
  ],
  shouldNotGroupWhenFull: false,
}

const HEADING_OPTIONS = {
  options: [
    { model: 'paragraph' as const, title: 'Paragraph', class: 'ck-heading_paragraph' },
    { model: 'heading1' as const, view: 'h1' as const, title: 'Heading 1', class: 'ck-heading_heading1' },
    { model: 'heading2' as const, view: 'h2' as const, title: 'Heading 2', class: 'ck-heading_heading2' },
    { model: 'heading3' as const, view: 'h3' as const, title: 'Heading 3', class: 'ck-heading_heading3' },
    { model: 'heading4' as const, view: 'h4' as const, title: 'Heading 4', class: 'ck-heading_heading4' },
  ],
}

const IMAGE_CONFIG = {
  toolbar: [
    'imageTextAlternative',
    'toggleImageCaption',
    '|',
    'imageStyle:inline',
    'imageStyle:wrapText',
    'imageStyle:breakText',
    '|',
    'resizeImage',
  ],
  resizeOptions: [
    { name: 'resizeImage:original', value: null, label: 'Kích thước gốc' },
    { name: 'resizeImage:25', value: '25', label: '25%' },
    { name: 'resizeImage:50', value: '50', label: '50%' },
    { name: 'resizeImage:75', value: '75', label: '75%' },
  ],
  insert: { type: 'auto' as const },
}

const TABLE_CONFIG = {
  contentToolbar: [
    'tableColumn',
    'tableRow',
    'mergeTableCells',
    'tableProperties',
    'tableCellProperties',
  ],
}

const LINK_CONFIG = {
  addTargetToExternalLinks: true,
  defaultProtocol: 'https://',
}

/**
 * CmsEditor — Rich text editor bọc CKEditor 5.
 * Được bọc trong React.memo để tránh re-render không cần thiết khi parent re-render
 * do form.watch trên các field khác (name, seo_title, unit_type...).
 * onChange được debounce 200ms để giảm tần suất cập nhật form state.
 */
export const CmsEditor = memo(function CmsEditor({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  minHeight = 200,
  maxHeight = 500,
}: CmsEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const editorRef = useRef<any>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Lưu giá trị cuối cùng đã gửi lên parent, dùng để so sánh khi sync từ parent
  const lastSentValueRef = useRef(value)
  // Ref cho onChange để dùng trong cleanup mà không cần dependency
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Sync value từ parent (ví dụ: khi auto-translate điền dữ liệu)
  useEffect(() => {
    if (editorRef.current) {
      const safeValue = value || ''
      // Chỉ sync nếu giá trị parent khác với giá trị cuối cùng ta đã gửi
      // → tránh revert nội dung user đang gõ trong lúc debounce chưa fire
      if (safeValue !== lastSentValueRef.current) {
        const currentData = editorRef.current.getData()
        if (currentData !== safeValue) {
          editorRef.current.setData(safeValue)
        }
        lastSentValueRef.current = safeValue
      }
    }
  }, [value])

  // Flush debounce khi component unmount để đảm bảo dữ liệu mới nhất được lưu
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        if (editorRef.current && onChangeRef.current) {
          onChangeRef.current(editorRef.current.getData())
        }
      }
    }
  }, [])

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsFullscreen(false)
  }, [])

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isFullscreen, handleEsc])

  // Debounced onChange — CKEditor tự quản lý DOM nội bộ nên UI luôn mượt,
  // chỉ trì hoãn việc cập nhật react-hook-form state
  const handleEditorChange = useCallback((_event: any, editor: any) => {
    const data = editor.getData()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      lastSentValueRef.current = data
      onChangeRef.current?.(data)
    }, 200)
  }, [])

  const editorConfig = {
    licenseKey: 'GPL',
    plugins: EDITOR_PLUGINS,
    toolbar: EDITOR_TOOLBAR,
    placeholder,
    heading: HEADING_OPTIONS,
    image: IMAGE_CONFIG,
    mediaEmbed: { previewsInData: true },
    table: TABLE_CONFIG,
    htmlEmbed: { showPreviews: true },
    link: LINK_CONFIG,
  }

  const renderEditor = () => (
    <CKEditor
      editor={ClassicEditor}
      data={value || ''}
      disabled={disabled}
      onReady={(editor) => {
        editorRef.current = editor
        const safeValue = value || ''
        editor.setData(safeValue)
      }}
      config={editorConfig}
      onChange={handleEditorChange}
    />
  )

  return (
    <>
      <div
        className="ck-editor-wrapper relative group"
        style={{
          '--ck-editor-min-height': `${minHeight}px`,
          '--ck-editor-max-height': `${maxHeight}px`,
        } as React.CSSProperties}
      >
        {!disabled && (
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="absolute right-2 top-2 z-10 p-1 rounded-md bg-background border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Phóng to toàn màn hình"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
        {renderEditor()}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col p-6 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{placeholder || 'Soạn thảo'} (Toàn màn hình)</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Esc</kbd> hoặc nút Thu nhỏ để quay lại
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-card hover:bg-muted text-xs font-semibold cursor-pointer shadow-xs transition-all"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Thu nhỏ</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto ck-editor-fullscreen-content">
            <style>{`
              .ck-editor-fullscreen-content .ck-content {
                min-height: calc(100vh - 160px) !important;
                max-height: calc(100vh - 160px) !important;
              }
            `}</style>
            {renderEditor()}
          </div>
        </div>
      )}
    </>
  )
})
