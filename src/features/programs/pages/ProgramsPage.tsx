import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Pencil,
  RefreshCw,
  Search,
} from 'lucide-react'
import { programService } from '../services/programService'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

export function ProgramsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 300)
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['programs', debouncedSearch],
    queryFn: () =>
      programService.list({
        page: 1,
        page_size: 100,
        search: debouncedSearch || undefined,
      }),
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="size-6 text-primary" />
            <h1 className="text-2xl font-bold">Chương trình đào tạo</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý hồ sơ, phiên bản, tài liệu và khung học phần công bố trên website.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-emerald-600" />
          {data?.total ?? 0} chương trình
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <span className="sr-only">Tìm chương trình</span>
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc mã ngành"
            className="pl-9"
          />
        </label>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Tải lại dữ liệu"
        >
          <RefreshCw className={isFetching ? 'animate-spin' : ''} />
          <span className="sr-only">Tải lại dữ liệu</span>
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_120px] border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground sm:grid-cols-[120px_minmax(0,1fr)_150px_150px_120px]">
          <span className="hidden sm:block">Mã ngành</span>
          <span>Chương trình</span>
          <span className="hidden sm:block">Trình độ</span>
          <span className="hidden sm:block">Trạng thái</span>
          <span className="text-right">Thao tác</span>
        </div>

        {isLoading ? (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            Đang tải chương trình đào tạo...
          </div>
        ) : isError ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm font-medium text-destructive">Không thể tải dữ liệu.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : data?.items.length ? (
          data.items.map((program) => (
            <button
              key={program.id}
              type="button"
              onClick={() => navigate(`/programs/${program.id}/edit`)}
              className="grid w-full grid-cols-[minmax(0,1fr)_120px] items-center gap-3 border-b px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/30 sm:grid-cols-[120px_minmax(0,1fr)_150px_150px_120px]"
            >
              <span className="hidden font-mono text-sm font-semibold sm:block">
                {program.code || '—'}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold">
                  <GraduationCap className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{program.name}</span>
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {program.translations.en?.name || program.slug}
                </span>
                <span className="mt-1 block font-mono text-xs text-muted-foreground sm:hidden">
                  {program.code || 'Chưa có mã ngành'}
                </span>
              </span>
              <span className="hidden text-sm text-muted-foreground sm:block">
                {{ bachelor: 'Đại học', master: 'Thạc sĩ', doctorate: 'Tiến sĩ' }[
                  program.degree_level
                ] ?? program.degree_level}
              </span>
              <span className="hidden items-center gap-2 sm:flex">
                <Badge
                  variant={program.is_published ? 'default' : 'secondary'}
                  className={program.is_published ? 'bg-emerald-600' : ''}
                >
                  {program.is_published ? 'Đã công bố' : 'Bản nháp'}
                </Badge>
              </span>
              <span className="flex items-center justify-end gap-2 text-sm font-medium text-primary">
                <Pencil className="size-4" />
                <span className="hidden sm:inline">Chỉnh sửa</span>
                <ChevronRight className="size-4" />
              </span>
            </button>
          ))
        ) : (
          <div className="px-4 py-16 text-center text-sm text-muted-foreground">
            Không tìm thấy chương trình phù hợp.
          </div>
        )}
      </div>
    </div>
  )
}
