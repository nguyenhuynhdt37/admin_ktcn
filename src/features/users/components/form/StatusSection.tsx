import { Card, CardContent } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'

interface StatusSectionProps {
  isActive: boolean
  setIsActive: (active: boolean) => void
  disabled?: boolean
}

export function StatusSection({ isActive, setIsActive, disabled }: StatusSectionProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold text-foreground">Trạng thái hoạt động</Label>
          <p className="text-[11px] text-muted-foreground">
            Cho phép tài khoản đăng nhập vào CMS.
          </p>
        </div>
        <Switch checked={isActive} onCheckedChange={setIsActive} disabled={disabled} />
      </CardContent>
    </Card>
  )
}
