import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Search } from 'lucide-react'

interface RoleData {
  id: string
  name: string
  code: string
}

interface RolesSectionProps {
  assignableRoles: RoleData[]
  selectedRoleIds: string[]
  handleToggleRole: (roleId: string) => void
}

export function RolesSection({
  assignableRoles,
  selectedRoleIds,
  handleToggleRole,
}: RolesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredRoles = assignableRoles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Vai trò thành viên</span>
          {selectedRoleIds.length > 0 && (
            <span className="text-[10px] font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              Đã chọn {selectedRoleIds.length}
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-[11px]">
          Gán các nhóm quyền thao tác CMS cho tài khoản.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search Input for Roles */}
        {assignableRoles.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm vai trò..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8.5 text-xs rounded-lg border-muted-foreground/20 focus-visible:ring-primary"
            />
          </div>
        )}

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {filteredRoles.map((role) => {
            const isChecked = selectedRoleIds.includes(role.id)

            return (
              <label
                key={role.id}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 select-none text-xs cursor-pointer transition-colors duration-150 ${
                  isChecked ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleRole(role.id)}
                  className="rounded border-muted-foreground/30 text-primary focus:ring-primary h-4 w-4"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{role.name}</p>
                  <p className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">{role.code}</p>
                </div>
              </label>
            )
          })}

          {assignableRoles.length > 0 && filteredRoles.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Không tìm thấy vai trò phù hợp.
            </p>
          )}

          {assignableRoles.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 animate-pulse">
              Đang tải danh sách vai trò...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
