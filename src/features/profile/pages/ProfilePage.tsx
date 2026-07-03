import { useQuery } from '@tanstack/react-query'
import { Loader2, UserCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { profileService } from '../services/profileService'
import { ProfileInfoTab } from '../components/ProfileInfoTab'
import { SecurityTab } from '../components/SecurityTab'
import { ProfileSessionsTab } from '../components/ProfileSessionsTab'
import { ProfileLoginHistoryTab } from '../components/ProfileLoginHistoryTab'
import { ProfileActivityTab } from '../components/ProfileActivityTab'

export function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => profileService.getProfile(),
  })

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <UserCircle className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">Không thể tải thông tin hồ sơ</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin cá nhân, bảo mật và theo dõi hoạt động tài khoản
        </p>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info" className="cursor-pointer">Thông tin</TabsTrigger>
          <TabsTrigger value="security" className="cursor-pointer">Bảo mật</TabsTrigger>
          <TabsTrigger value="sessions" className="cursor-pointer">Phiên đăng nhập</TabsTrigger>
          <TabsTrigger value="login-history" className="cursor-pointer">Lịch sử đăng nhập</TabsTrigger>
          <TabsTrigger value="activity" className="cursor-pointer">Nhật ký hoạt động</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ProfileInfoTab profile={profile} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="sessions">
          <ProfileSessionsTab />
        </TabsContent>

        <TabsContent value="login-history">
          <ProfileLoginHistoryTab />
        </TabsContent>

        <TabsContent value="activity">
          <ProfileActivityTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
