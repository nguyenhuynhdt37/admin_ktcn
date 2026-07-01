import { useEffect, useRef } from 'react'
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

export function CmsEditor({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  minHeight = 200,
  maxHeight = 500,
}: CmsEditorProps) {
  const editorRef = useRef<any>(null)
  const isInitializedRef = useRef(false)

  // Sync value from parent when it finishes loading asynchronously or when tab changes
  useEffect(() => {
    if (editorRef.current) {
      const currentData = editorRef.current.getData()
      const safeValue = value || ''
      if (currentData !== safeValue) {
        editorRef.current.setData(safeValue)
      }
    }
  }, [value])

  return (
    <div
      className="ck-editor-wrapper"
      style={{
        '--ck-editor-min-height': `${minHeight}px`,
        '--ck-editor-max-height': `${maxHeight}px`,
      } as React.CSSProperties}
    >
      <CKEditor
        editor={ClassicEditor}
        data={value || ''}
        disabled={disabled}
        onReady={(editor) => {
          editorRef.current = editor
          const safeValue = value || ''
          editor.setData(safeValue)
        }}
        config={{
          licenseKey: 'GPL',
          plugins: [
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
          ],
          toolbar: {
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
          },
          placeholder,
          heading: {
            options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
              { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
            ],
          },
          image: {
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
            insert: {
              type: 'auto',
            },
          },
          mediaEmbed: {
            previewsInData: true,
          },
          table: {
            contentToolbar: [
              'tableColumn',
              'tableRow',
              'mergeTableCells',
              'tableProperties',
              'tableCellProperties',
            ],
          },
          htmlEmbed: {
            showPreviews: true,
          },
          link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
          },
        }}
        onChange={(_event, editor) => {
          const data = editor.getData()
          onChange?.(data)
        }}
      />
    </div>
  )
}
