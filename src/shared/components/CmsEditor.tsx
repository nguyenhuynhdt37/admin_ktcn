import { useRef, useEffect, memo } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { httpClient } from '@/services/http/client'
import { getMediaUrl } from '@/features/articles/utils/media'

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
  minHeight = 250,
  maxHeight = 600,
}: CmsEditorProps) {
  const editorRef = useRef<any>(null)

  // Sync outside changes (like translations or form loads) to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.getContent()
      if (value !== currentContent) {
        editorRef.current.setContent(value || '')
      }
    }
  }, [value])

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
          if (value && editor.getContent() !== value) {
            editor.setContent(value)
          }
        }}
        initialValue={value}
        disabled={disabled}
        onEditorChange={handleEditorChange}
        init={{
          base_url: 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/7.1.1',
          suffix: '.min',
          min_height: minHeight,
          max_height: maxHeight,
          menubar: 'file edit view insert format tools table help',
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'autogrow'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic underline strikethrough | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | image media table link | code fullscreen',
          content_style: 'body { font-family:system-ui, -apple-system, sans-serif; font-size:15px; color:#1e293b; line-height: 1.6; text-align: justify; } img { max-width: 100% !important; height: auto !important; }',
          placeholder: placeholder || 'Nhập nội dung...',
          branding: false,
          promotion: false,
          // Upload dragged/pasted images directly to MinIO backend
          images_upload_handler: (blobInfo) => new Promise(async (resolve, reject) => {
            try {
              const formData = new FormData()
              formData.append('file', blobInfo.blob(), blobInfo.filename())

              const { data } = await httpClient.post<{ object_key: string }>('/admin/media/upload', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              })

              const fullUrl = getMediaUrl(data.object_key)
              resolve(fullUrl)
            } catch (error) {
              console.error('TinyMCE image upload failed:', error)
              reject('Tải hình ảnh lên thất bại')
            }
          }),
          // Upload links/files (PDF, word docs) directly to MinIO backend via link dialog
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

            input.onchange = async function () {
              const file = (this as HTMLInputElement).files?.[0]
              if (!file) return

              try {
                const formData = new FormData()
                formData.append('file', file, file.name)

                const { data } = await httpClient.post<{ object_key: string }>('/admin/media/upload', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                })

                const fullUrl = getMediaUrl(data.object_key)
                cb(fullUrl, { title: file.name, text: file.name })
              } catch (error) {
                console.error('TinyMCE file upload failed:', error)
                alert('Tải tập tin lên thất bại!')
              }
            }

            input.click()
          }
        }}
      />
    </div>
  )
})
