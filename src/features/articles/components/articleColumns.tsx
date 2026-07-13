import { Link } from 'react-router'
import dayjs from 'dayjs'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Pin,
  Star,
  CornerDownRight,
  RotateCcw,
  Edit,
  Trash,
  MoreHorizontal,
  Archive,
  Globe,
  Eye,
  ArrowUpDown
} from 'lucide-react'
import { getMediaUrl } from '../utils/media'

import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Switch } from '@/shared/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import type { Article } from '../types/articles.types'
import { cn } from '@/lib/utils'

interface ArticleColumnsProps {
  deleted: boolean
  currentUser: any
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  onArchive: (id: string) => void
  onPublish: (id: string) => void
  onToggleAttribute: (id: string, attributes: { is_pinned?: boolean }) => void
}

export const getArticleColumns = ({
  deleted,
  currentUser,
  onEdit,
  onDelete,
  onRestore,
  onArchive,
  onPublish,
  onToggleAttribute,
}: ArticleColumnsProps): ColumnDef<Article>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Chọn tất cả"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Chọn dòng"
        className="translate-y-[2px] cursor-pointer"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'thumbnail',
    header: 'Ảnh',
    cell: ({ row }) => {
      const article = row.original
      const thumbUrl = getMediaUrl(article.thumbnail_object_key)
      const title = article.translations?.vi?.title || '(Không tiêu đề)'
      return thumbUrl ? (
        <img
          src={thumbUrl}
          alt={title}
          className="h-10 w-14 rounded-md object-cover border border-border"
        />
      ) : (
        <div className="h-10 w-14 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground/60 border border-border/40 font-mono">
          No IMG
        </div>
      )
    }
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent hover:text-foreground p-0 h-auto font-semibold text-muted-foreground gap-1 text-xs -ml-2"
      >
        <span>Bài viết</span>
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const article = row.original
      const title = article.translations?.vi?.title || '(Không tiêu đề)'
      const slug = article.translations?.vi?.slug || ''
      const isAuthor = currentUser?.id === article.author_id || currentUser?.id === article.author?.id
      const isAdmin = !!currentUser?.is_admin || currentUser?.roles?.includes('super_admin') || currentUser?.roles?.includes('admin')
      const canEdit = isAuthor || isAdmin
      return (
        <div className="flex flex-col gap-1 min-w-[200px] max-w-[320px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={canEdit ? `/articles/${article.id}/edit` : `/articles/${article.id}/preview`}
              className="font-medium text-sm text-foreground hover:text-primary transition-colors hover:underline truncate block"
            >
              {title}
            </Link>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
            <CornerDownRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            <span className="truncate">{slug}</span>
          </div>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {article.tags.slice(0, 3).map((tag) => {
                const tagName = tag.translations?.vi?.name || tag.name || '(Không tên)'
                return (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-[10px] py-0 px-1.5 font-normal rounded border-transparent"
                    style={
                      tag.color
                        ? {
                            backgroundColor: `${tag.color}12`,
                            color: tag.color,
                            borderColor: `${tag.color}25`,
                          }
                        : undefined
                    }
                  >
                    {tagName}
                  </Badge>
                )
              })}
              {article.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal text-muted-foreground rounded">
                  +{article.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      )
    }
  },
  {
    id: 'category',
    header: 'Danh mục',
    cell: ({ row }) => {
      const category = row.original.category
      return (
        <div className="flex flex-col text-left">
          <span className="text-sm font-medium text-foreground">{category?.name || '(Chưa phân loại)'}</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
            {category?.slug || ''}
          </span>
        </div>
      )
    }
  },
  {
    id: 'translations',
    header: 'Bản dịch',
    cell: ({ row }) => {
      const isTranslated = row.original.is_translated || {}
      return (
        <div className="flex gap-1">
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] py-0 px-1 rounded font-bold border-none",
              isTranslated.vi ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-400"
            )}
          >
            VI
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] py-0 px-1 rounded font-bold border-none",
              isTranslated.en ? "bg-sky-500/10 text-sky-600" : "bg-slate-100 text-slate-400"
            )}
          >
            EN
          </Badge>
        </div>
      )
    }
  },
  {
    id: 'author',
    header: 'Tác giả',
    cell: ({ row }) => {
      const author = row.original.author
      const avatarUrl = author ? getMediaUrl(author.avatar_url) : null
      return (
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={author?.full_name || ''}
              className="h-6 w-6 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border border-border">
              {author?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-xs font-semibold text-foreground truncate max-w-[100px]" title={author?.full_name || ''}>
              {author?.full_name || ''}
            </span>
            <span className="text-[9px] text-muted-foreground truncate max-w-[100px]" title={author?.username || ''}>
              {author?.username || ''}
            </span>
          </div>
        </div>
      )
    }
  },
  {
    id: 'attributes',
    header: 'Thuộc tính',
    cell: ({ row }) => {
      const article = row.original
      return (
        <div className="flex flex-col gap-1.5 min-w-[90px]">
          <div className="flex items-center gap-1.5">
            <Switch
              checked={article.is_pinned}
              disabled={deleted}
              onCheckedChange={(checked) => onToggleAttribute(article.id, { is_pinned: checked })}
              className="scale-75 origin-left cursor-pointer"
            />
            <span className="text-[11px] font-semibold text-muted-foreground">Ghim</span>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: 'view_count',
    header: ({ column }) => (
      <Button
        type="button"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent hover:text-foreground p-0 h-auto font-semibold text-muted-foreground gap-1 text-xs mx-auto flex cursor-pointer"
      >
        <span>Xem</span>
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium text-foreground block text-center">
        {row.original.view_count.toLocaleString()}
      </span>
    )
  },
  {
    id: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const status = row.original.status
      switch (status) {
        case 'PUBLISHED':
          return (
            <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-none hover:bg-emerald-500/15 py-0.5 px-2.5 rounded-full font-medium text-xs">
              Đã xuất bản
            </Badge>
          )
        case 'SCHEDULED':
          return (
            <Badge className="bg-sky-500/10 text-sky-600 border border-sky-500/20 shadow-none hover:bg-sky-500/15 py-0.5 px-2.5 rounded-full font-medium text-xs">
              Lên lịch
            </Badge>
          )
        case 'ARCHIVED':
          return (
            <Badge className="bg-zinc-500/10 text-zinc-600 border border-zinc-500/20 shadow-none hover:bg-zinc-500/15 py-0.5 px-2.5 rounded-full font-medium text-xs">
              Lưu trữ
            </Badge>
          )
        default:
          return null
      }
    }
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <Button
        type="button"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent hover:text-foreground p-0 h-auto font-semibold text-muted-foreground gap-1 text-xs -ml-2 cursor-pointer"
      >
        <span>Ngày tạo</span>
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const article = row.original
      return (
        <div className="flex flex-col text-xs text-muted-foreground gap-0.5 text-left">
          <span className="font-semibold text-foreground/80">
            {dayjs(article.created_at).format('DD/MM/YYYY')}
          </span>
          <span className="text-[10px] text-muted-foreground/75">Lúc: {dayjs(article.created_at).format('HH:mm')}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'published_at',
    header: ({ column }) => (
      <Button
        type="button"
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="hover:bg-transparent hover:text-foreground p-0 h-auto font-semibold text-muted-foreground gap-1 text-xs -ml-2 cursor-pointer"
      >
        <span>Ngày đăng</span>
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const article = row.original
      if (article.status === 'PUBLISHED' && article.published_at) {
        return (
          <div className="flex flex-col text-xs text-emerald-600 gap-0.5 text-left font-medium">
            <span>{dayjs(article.published_at).format('DD/MM/YYYY')}</span>
            <span className="text-[10px] opacity-80">Lúc: {dayjs(article.published_at).format('HH:mm')}</span>
          </div>
        )
      }
      if (article.status === 'SCHEDULED' && article.publish_at) {
        return (
          <div className="flex flex-col text-xs text-sky-600 gap-0.5 text-left font-medium">
            <span>{dayjs(article.publish_at).format('DD/MM/YYYY')}</span>
            <span className="text-[10px] opacity-80">Lên lịch: {dayjs(article.publish_at).format('HH:mm')}</span>
          </div>
        )
      }
      return <span className="text-xs text-muted-foreground/60">-</span>
    }
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => {
      const article = row.original
      const isAuthor = currentUser?.id === article.author_id || currentUser?.id === article.author?.id
      const isAdmin = !!currentUser?.is_admin || currentUser?.roles?.includes('super_admin') || currentUser?.roles?.includes('admin')
      const canEdit = isAuthor || isAdmin
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer hover:bg-muted rounded-md">
                <span className="sr-only font-medium">Mở menu thao tác</span>
                <MoreHorizontal className="h-4.5 w-4.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Thao tác bài viết</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {deleted ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => onRestore(article.id)}
                >
                  <RotateCcw className="mr-2 h-4 w-4 text-emerald-600" />
                  <span>Khôi phục</span>
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to={`/articles/${article.id}/preview`}>
                      <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Xem chi tiết</span>
                    </Link>
                  </DropdownMenuItem>

                  {canEdit && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => onEdit(article.id)}
                    >
                      <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Chỉnh sửa</span>
                    </DropdownMenuItem>
                  )}

                  {article.status === 'PUBLISHED' && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => onArchive(article.id)}
                    >
                      <Archive className="mr-2 h-4 w-4 text-amber-600" />
                      <span>Lưu trữ (Archive)</span>
                    </DropdownMenuItem>
                  )}

                  {article.status === 'ARCHIVED' && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => onPublish(article.id)}
                    >
                      <Globe className="mr-2 h-4 w-4 text-emerald-600" />
                      <span>Đăng tải (Publish)</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:bg-destructive/10"
                    onClick={() => onDelete(article.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Xóa bài viết</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  }
]