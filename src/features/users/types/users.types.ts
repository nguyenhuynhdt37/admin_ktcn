export interface RoleData {
  id: string;
  name: string;
  code: string;
}

export interface UserAvatar {
  id: string;
  name: string;
  object_key: string;
  thumbnail_key: string | null;
  mime_type: string;
  size: number;
}

export interface UserDetail {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  full_name: string;
  bio: string | null;
  title: string | null;
  department: string | null;
  avatar_id: string | null;
  avatar: UserAvatar | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles: RoleData[];
}

export interface UserCreatePayload {
  username: string;
  email: string;
  password?: string;
  full_name: string;
  phone?: string;
  bio?: string;
  title?: string;
  department?: string;
  avatar_id?: string;
  role_ids?: string[];
  is_active?: boolean;
}
