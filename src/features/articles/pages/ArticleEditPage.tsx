import { useParams } from 'react-router'
import { ArticleForm } from '../components/ArticleForm'

export default function ArticleEditPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="w-full">
      <ArticleForm articleId={id || null} showDraftsFeature={false} />
    </div>
  )
}
