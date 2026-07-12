import { useParams } from 'react-router'
import { DepartmentForm } from '../components/DepartmentForm'

export default function DepartmentCreatePage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="w-full">
      <DepartmentForm departmentId={id || null} />
    </div>
  )
}
