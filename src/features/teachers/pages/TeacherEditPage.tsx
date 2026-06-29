import { useParams } from 'react-router'
import { TeacherForm } from '../components/TeacherForm'

export default function TeacherEditPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="w-full">
      <TeacherForm teacherId={id || null} />
    </div>
  )
}
