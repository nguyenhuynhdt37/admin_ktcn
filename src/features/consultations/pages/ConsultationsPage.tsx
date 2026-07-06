import { useEffect, useState, useCallback } from 'react'
import {
  PhoneCall,
  Search,
  Download,
  AlertCircle,
  RefreshCw,
  Edit2,
  CheckCircle,
  UserCheck,
  X,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { consultationService } from '../services/consultationService'
import type { Consultation, ConsultationStatus } from '../types'

export function ConsultationsPage() {
  const { user: currentUser } = useAuthStore()
  const [items, setItems] = useState<Consultation[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Dialog State
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<ConsultationStatus>('PENDING')
  const [updateNotes, setUpdateNotes] = useState('')

  // Phát tiếng chuông báo hiệu khi có lead mới
  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Node 1: Nốt D5
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime)
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.15)
      
      // Node 2: Nốt A5
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator()
        const gain2 = audioCtx.createGain()
        osc2.connect(gain2)
        gain2.connect(audioCtx.destination)
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime)
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime)
        osc2.start()
        osc2.stop(audioCtx.currentTime + 0.25)
      }, 150)
    } catch (e) {
      console.warn('AudioContext không khởi chạy được do trình duyệt chặn tự động phát:', e)
    }
  }, [])

  // Fetch Data
  const fetchConsultations = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      const data = await consultationService.listConsultations({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setItems(data.items)
      setTotalItems(data.total_items)
      setTotalPages(data.total_pages)
    } catch (error) {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, search, statusFilter])

  // Tránh spam API khi gõ ô tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchConsultations()
    }, 400)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  // Lắng nghe thông báo realtime qua SSE
  useEffect(() => {
    // Chỉ lắng nghe khi admin đã đăng nhập
    if (!currentUser) return

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
    const eventSource = new EventSource(`${baseUrl}/admin/consultations/events`, {
      withCredentials: true,
    })

    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.event === 'new_consultation') {
          const lead = msg.data
          playNotificationSound()
          toast.success(
            <div className="flex flex-col gap-1 text-left">
              <span className="font-bold text-slate-800">Yêu cầu tư vấn mới!</span>
              <span className="text-xs text-muted-foreground">Mã: {lead.request_code}</span>
              <span className="text-xs font-semibold">{lead.fullname} ({lead.phone})</span>
            </div>,
            { duration: 8000 }
          )
          // Tự động tải lại danh sách
          fetchConsultations()
        }
      } catch (err) {
        // Bỏ qua lỗi parsing welcome ping
      }
    }

    eventSource.onerror = () => {
      // Tự động reconnect bởi Browser EventSource
    }

    return () => {
      eventSource.close()
    }
  }, [currentUser, fetchConsultations, playNotificationSound])

  // Nhận xử lý lead trực tiếp
  const handleAssignToMe = async (consultation: Consultation) => {
    if (!currentUser) return
    try {
      await consultationService.updateConsultation(consultation.id, {
        status: 'PROCESSING',
        assigned_to: currentUser.id,
      })
      toast.success(`Đã nhận xử lý yêu cầu ${consultation.request_code}`)
      fetchConsultations()
    } catch (err) {
      // Đã được handle ở http client toast
    }
  }

  // Mở modal cập nhật trạng thái & ghi chú
  const handleOpenUpdate = (consultation: Consultation) => {
    setSelectedConsultation(consultation)
    setUpdateStatus(consultation.status)
    setUpdateNotes(consultation.notes || '')
    setIsUpdateOpen(true)
  }

  // Lưu thông tin cập nhật
  const handleSaveUpdate = async () => {
    if (!selectedConsultation || !currentUser) return
    setIsUpdating(true)
    try {
      // Nếu trạng thái đổi sang PROCESSING mà chưa gán ai, tự động gán cho admin hiện tại
      const payload: any = {
        status: updateStatus,
        notes: updateNotes,
      }
      if (updateStatus === 'PROCESSING' && !selectedConsultation.assigned_to) {
        payload.assigned_to = currentUser.id
      }

      await consultationService.updateConsultation(selectedConsultation.id, payload)
      toast.success('Cập nhật thông tin thành công!')
      setIsUpdateOpen(false)
      fetchConsultations()
    } catch (err) {
      // Handle error
    } finally {
      setIsUpdating(false)
    }
  }

  // Trigger export CSV
  const handleExportCSV = () => {
    const url = consultationService.getExportUrl(
      search.trim() || undefined,
      statusFilter === 'all' ? undefined : statusFilter
    )
    window.open(url, '_blank')
  }

  // Định nghĩa màu sắc cho Status Badge
  const getStatusBadge = (status: ConsultationStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 border-amber-200 text-xs px-2 py-0.5 font-medium rounded-sm">
            Chờ xử lý
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge className="bg-blue-100 hover:bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-0.5 font-medium rounded-sm">
            Đang xử lý
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-2 py-0.5 font-medium rounded-sm">
            Đã hoàn thành
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge className="bg-slate-100 hover:bg-slate-100 text-slate-800 border-slate-200 text-xs px-2 py-0.5 font-medium rounded-sm">
            Đã hủy
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-primary animate-pulse" />
            Yêu cầu tư vấn tuyển sinh
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Danh sách đăng ký tư vấn tuyển sinh và hướng nghiệp từ cổng thông tin học sinh, phụ huynh.
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          className="cursor-pointer shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 self-start sm:self-auto text-xs h-9 font-semibold"
        >
          <Download className="h-4 w-4" />
          Xuất dữ liệu CSV
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-muted/10 p-3 rounded-xl border border-border/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo mã yêu cầu, tên, sđt, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 text-xs focus-visible:ring-primary/20 h-9 bg-background"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="w-full sm:w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs focus:ring-primary/20 bg-background text-left">
              <SelectValue placeholder="Trạng thái xử lý" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING" className="text-xs">Chờ xử lý</SelectItem>
              <SelectItem value="PROCESSING" className="text-xs">Đang xử lý</SelectItem>
              <SelectItem value="COMPLETED" className="text-xs">Đã hoàn thành</SelectItem>
              <SelectItem value="CANCELLED" className="text-xs">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Content */}
      {isError ? (
        <Card className="border-destructive/30 bg-destructive/5 text-left">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="font-semibold text-lg text-destructive">Lỗi tải danh sách yêu cầu</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Đã xảy ra sự cố khi tải danh sách từ máy chủ. Vui lòng làm mới lại.
            </p>
            <Button variant="outline" size="sm" onClick={fetchConsultations} className="mt-4 flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="h-3.5 w-3.5" /> Tải lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5">Mã yêu cầu</th>
                  <th className="px-4 py-3.5">Thông tin khách hàng</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Ghi chú</th>
                  <th className="px-4 py-3.5">Người xử lý</th>
                  <th className="px-4 py-3.5">Ngày đăng ký</th>
                  <th className="px-4 py-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        <span>Đang tải danh sách dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                      Không tìm thấy bất kỳ yêu cầu tư vấn nào.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-4 py-4 font-mono font-bold text-xs text-slate-800">
                        {item.request_code}
                      </td>
                      <td className="px-4 py-4 space-y-1">
                        <div className="font-semibold text-foreground">{item.fullname}</div>
                        <div className="text-xs text-muted-foreground flex flex-col">
                          <span>SĐT: {item.phone}</span>
                          {item.email && <span>Email: {item.email}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(item.status)}</td>
                      <td className="px-4 py-4">
                        {item.notes ? (
                          <div className="text-xs max-w-[200px] truncate text-slate-600 flex items-center gap-1.5" title={item.notes}>
                            <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {item.notes}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">Không có</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium">
                        {item.assignee ? (
                          <span className="text-foreground flex items-center gap-1">
                            <div className="size-2 rounded-full bg-emerald-500" />
                            {item.assignee.full_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/75 italic">Chưa gán</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {item.status === 'PENDING' && (
                            <Button
                              onClick={() => handleAssignToMe(item)}
                              variant="outline"
                              size="sm"
                              className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50/50 cursor-pointer h-7 flex items-center gap-1"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Nhận xử lý
                            </Button>
                          )}
                          <Button
                            onClick={() => handleOpenUpdate(item)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-muted/10 text-xs">
              <span className="text-muted-foreground">
                Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng cộng <strong>{totalItems}</strong> yêu cầu)
              </span>
              <div className="flex gap-1.5">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs cursor-pointer"
                >
                  Trước
                </Button>
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs cursor-pointer"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Cập nhật Trạng thái & Ghi chú */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="max-w-[420px] text-left">
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái yêu cầu</DialogTitle>
            <DialogDescription>
              Mã yêu cầu: <strong className="font-mono text-slate-800">{selectedConsultation?.request_code}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Trạng thái xử lý</label>
              <Select
                value={updateStatus}
                onValueChange={(val) => setUpdateStatus(val as ConsultationStatus)}
              >
                <SelectTrigger className="h-10 text-sm bg-background">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                  <SelectItem value="PROCESSING">Đang xử lý (Nhận xử lý)</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành (Đã xử lý xong)</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Ghi chú hỗ trợ</label>
              <textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Nhập các ghi chú trao đổi, thông tin kết quả xử lý..."
                className="w-full text-sm border border-border rounded-md px-3 py-2 focus:outline-hidden focus:ring-1 focus:ring-primary min-h-[90px] bg-background resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsUpdateOpen(false)}
              className="text-xs h-9 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveUpdate}
              disabled={isUpdating}
              className="text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer flex items-center gap-1.5"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
