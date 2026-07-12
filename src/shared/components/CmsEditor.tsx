import { useRef, memo } from 'react'
import { Editor } from '@tinymce/tinymce-react'

interface CmsEditorProps {
  /** Nội dung HTML */
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Chiều cao tối thiểu vùng soạn thảo (px). Mặc định 400 */
  minHeight?: number
  /** Chiều cao tối đa vùng soạn thảo (px), vượt sẽ cuộn. Mặc định 650 */
  maxHeight?: number
}

export const CmsEditor = memo(function CmsEditor({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  minHeight = 400,
  maxHeight = 650,
}: CmsEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorChange = (content: string) => {
    onChange?.(content)
  }

  return (
    <div 
      className="tinymce-editor-wrapper relative w-full border rounded-lg overflow-hidden bg-background"
    >
      <style>{`
        /* Hide TinyMCE notification and branding */
        .tox-notifications-container,
        .tox-statusbar__branding {
          display: none !important;
        }
        .tox-tinymce {
          border: none !important;
        }
      `}</style>
      <Editor
        tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.1.1/tinymce.min.js"
        onInit={(_evt, editor) => {
          editorRef.current = editor
        }}
        value={value}
        disabled={disabled}
        onEditorChange={handleEditorChange}
        init={{
          height: minHeight,
          max_height: maxHeight,
          menubar: 'file edit view insert format tools table help',
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic underline strikethrough | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | image media table link | code fullscreen',
          content_style: 'body { font-family:system-ui, -apple-system, sans-serif; font-size:15px; color:#1e293b; line-height: 1.6; }',
          placeholder: placeholder || 'Nhập nội dung...',
          branding: false,
          promotion: false,
          // Support image/file drag and drop & copy-paste as Base64 automatically
          images_upload_handler: (blobInfo) => new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blobInfo.blob())
          }),
          // Support custom file upload (PDF, word docs, etc.) via link dialog
          file_picker_callback: function (cb, _value, meta) {
            const input = document.createElement('input')
            input.setAttribute('type', 'file')
            
            if (meta.filetype === 'image') {
              input.setAttribute('accept', 'image/*')
            } else if (meta.filetype === 'media') {
              input.setAttribute('accept', 'video/*,audio/*')
            } else {
              input.setAttribute('accept', '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx')
            }

            input.onchange = function () {
              const file = (this as HTMLInputElement).files?.[0]
              if (!file) return

              const reader = new FileReader()
              reader.onload = function () {
                cb(reader.result as string, { title: file.name, text: file.name })
              }
              reader.readAsDataURL(file)
            }

            input.click()
          }
        }}
      />
    </div>
  )
})
