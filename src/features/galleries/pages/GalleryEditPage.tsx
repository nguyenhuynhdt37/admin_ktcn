import { useParams } from 'react-router'
import { GalleryForm } from '../components/GalleryForm'

export default function GalleryEditPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="w-full">
      <GalleryForm galleryId={id || null} />
    </div>
  )
}
