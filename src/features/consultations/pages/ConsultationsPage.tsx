import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  LoaderCircle,
  MessageSquareText,
  Search,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { consultationService } from '../services/consultationService'
import type {
  ConsultationLead,
  ConsultationRequestType,
  ConsultationStatus,
} from '../types'

const statusOptions: { value: ConsultationStatus; label: string }[] = [
  { value: 'NEW', label: 'Mới' },
  { value: 'CONTACTED', label: 'Đã liên hệ' },
  { value: 'CONSULTING', label: 'Đang tư vấn' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'NOT_QUALIFIED', label: 'Không phù hợp' },
]

const requestLabels: Record<ConsultationRequestType, string> = {
  ADMISSION_CONSULTING: 'Tư vấn tuyển sinh',
  CAMPUS_VISIT: 'Tham quan trường',
  RECEIVE_MATERIALS: 'Nhận tài liệu',
  APPLICATION_REGISTRATION: 'Đăng ký xét tuyển',
}

export function ConsultationsPage() {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ConsultationStatus | ''>('')
  const [selectedLead, setSelectedLead] = useState<ConsultationLead | null>(null)
  const [note, setNote] = useState('')

  const params = useMemo(
    () => ({
      page,
      page_size: 20,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status ? { status } : {}),
    }),
    [page, search, status]
  )

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['consultations', params],
    queryFn: () => consultationService.list(params),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: { status?: ConsultationStatus; assigned_to_id?: string; note?: string }
    }) => consultationService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['consultations'] })
      toast.success('Đã cập nhật yêu cầu tư vấn')
    },
  })

  const saveNote = () => {
    if (!selectedLead || !note.trim()) return
    updateMutation.mutate(
      { id: selectedLead.id, payload: { note: note.trim() } },
      {
        onSuccess: () => {
          setSelectedLead(null)
          setNote('')
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Tuyển sinh</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Yêu cầu tư vấn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tiếp nhận và theo dõi thông tin thí sinh, phụ huynh cần hỗ trợ.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void consultationService.export(params)}
          className="shrink-0"
        >
          <Download className="size-4" />
          Xuất Excel
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto]">
            <label className="relative">
              <span className="sr-only">Tìm kiếm yêu cầu tư vấn</span>
              <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Tìm tên, số điện thoại, email, mã yêu cầu..."
                className="pl-9"
              />
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ConsultationStatus | '')
                setPage(1)
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Lọc theo trạng thái"
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex min-w-28 items-center justify-end text-sm text-muted-foreground">
              {isFetching && <LoaderCircle className="mr-2 size-4 animate-spin" />}
              {data?.total_items || 0} yêu cầu
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Thí sinh / phụ huynh</th>
                <th className="px-4 py-3">Nhu cầu</th>
                <th className="px-4 py-3">Ngành quan tâm</th>
                <th className="px-4 py-3">Ngày gửi</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="h-48 text-center text-muted-foreground">
                    <LoaderCircle className="mx-auto mb-2 size-5 animate-spin" />
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={6} className="h-48 text-center text-muted-foreground">
                    Chưa có yêu cầu phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                data.items.map((lead) => (
                  <tr key={lead.id} className="align-top hover:bg-muted/25">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">{lead.full_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lead.phone} · {lead.email}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {lead.reference_code}
                      </p>
                    </td>
                    <td className="px-4 py-4">{requestLabels[lead.request_type]}</td>
                    <td className="max-w-52 px-4 py-4">{lead.interested_major}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={lead.status}
                        onChange={(event) =>
                          updateMutation.mutate({
                            id: lead.id,
                            payload: { status: event.target.value as ConsultationStatus },
                          })
                        }
                        className="h-9 rounded-md border border-input bg-background px-2 text-xs font-medium"
                        aria-label={`Trạng thái của ${lead.full_name}`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {!lead.assigned_to_id && user?.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateMutation.mutate({
                                id: lead.id,
                                payload: { assigned_to_id: user.id },
                              })
                            }
                          >
                            <UserCheck className="size-4" />
                            Nhận xử lý
                          </Button>
                        )}
                        {lead.assigned_to_id && <Badge variant="outline">Đã phân công</Badge>}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLead(lead)
                            setNote('')
                          }}
                        >
                          <MessageSquareText className="size-4" />
                          Ghi chú
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Trang {data.page}/{data.total_pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.has_previous}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft className="size-4" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.has_next}
                onClick={() => setPage((value) => value + 1)}
              >
                Sau
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={Boolean(selectedLead)} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi chú chăm sóc</DialogTitle>
            <DialogDescription>
              Lưu lại nội dung trao đổi với {selectedLead?.full_name}.
            </DialogDescription>
          </DialogHeader>
          {selectedLead?.message && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Nội dung người dùng gửi</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {selectedLead.message}
              </p>
            </div>
          )}
          {selectedLead?.admin_notes && (
            <div className="max-h-40 overflow-y-auto rounded-md border p-3 text-sm">
              <p className="font-medium">Lịch sử chăm sóc</p>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {selectedLead.admin_notes}
              </p>
            </div>
          )}
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Nhập nội dung đã trao đổi hoặc việc cần làm tiếp theo..."
            className="min-h-28"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)}>
              Hủy
            </Button>
            <Button disabled={!note.trim() || updateMutation.isPending} onClick={saveNote}>
              {updateMutation.isPending && <LoaderCircle className="size-4 animate-spin" />}
              Lưu ghi chú
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
