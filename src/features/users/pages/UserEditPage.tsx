import { useParams } from 'react-router'
import { UserForm } from '../components/UserForm'

export function UserEditPage() {
  const { id } = useParams<{ id: string }>()

  return <UserForm userId={id} />
}

export default UserEditPage
