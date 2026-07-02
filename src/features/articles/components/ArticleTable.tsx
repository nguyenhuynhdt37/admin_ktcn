import { Edit, Trash, RotateCcw, Eye, Star, Pin, CornerDownRight } from 'lucide-react'
import { Link } from 'react-router'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import type { Article } from '../types/articles.types'
import { useAuthStore } from '@/stores/authStore'

interface ArticleTableProps {
  articles: Article[]
  isLoading: boolean
  isFetching?: boolean
  sortField?: string
  sortDir?: 'asc' | 'desc'
  isTrashMode?: boolean
  onSort: (field: string) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
}

export function ArticleTable({
  articles,
  isLoading,
  isFetching = false,
  sortField,
  sortDir,
  isTrashMode = false,
  onSort,
  onDelete,
  onRestore,
}: ArticleTableProps) {
  const { user } = useAuthStore()
  
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null
    return (
      <span className="ml-1.5 font-bold text-xs text-primary animate-pulse">
        {sortDir === 'asc' ? '▲' : '▼'}
      </span>
    )
  }

  // Format thumbnail URL or return placeholders
  const getThumbnailUrl = (key?: string | null) => {
    if (!key) return null
    if (key.startsWith('http://') || key.startsWith('https://')) return key
    return `https://images.unsplash.com/photo-1516116211223-5c359a36298a?w=100&auto=format&fit=crop&q=60`
  }

  const renderStatusBadge = (status: Article['status']) => {
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

  if (isLoading) {
    return (
      <div className="border rounded-xl overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]"></TableHead>
              <TableHead>Bài viết</TableHead>
              <TableHead className="w-[150px]">Danh mục</TableHead>
              <TableHead className="w-[180px]">Tác giả</TableHead>
              <TableHead className="w-[120px] text-center">Lượt xem</TableHead>
              <TableHead className="w-[130px]">Trạng thái</TableHead>
              <TableHead className="w-[140px]">Thời gian</TableHead>
              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <div className="h-10 w-14 rounded-md bg-muted/60 animate-pulse" />
                </TableCell>
                <TableCell className="space-y-2">
                  <div className="h-4 w-48 rounded bg-muted/60 animate-pulse" />
                  <div className="h-3 w-32 rounded bg-muted/40 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 rounded bg-muted/60 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted/60 animate-pulse" />
                    <div className="h-4 w-20 rounded bg-muted/60 animate-pulse" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-8 rounded bg-muted/60 animate-pulse mx-auto" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-20 rounded bg-muted/60 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 rounded bg-muted/60 animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-8 w-16 rounded bg-muted/60 animate-pulse ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="border border-dashed rounded-xl p-16 text-center bg-card flex flex-col items-center justify-center">
        <div className="h-16 w-16 bg-muted/20 border border-muted/50 rounded-2xl flex items-center justify-center mb-4">
          <Eye className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Không tìm thấy bài viết nào</h3>
        <p className="text-muted-foreground text-sm max-w-sm mt-1">
          {isTrashMode
            ? 'Thùng rác hiện tại trống. Các bài viết bị xóa sẽ xuất hiện tại đây.'
            : 'Thử thay đổi bộ lọc tìm kiếm hoặc thêm bài viết mới vào hệ thống CMS.'}
        </p>
        {!isTrashMode && (
          <Button asChild className="mt-4 cursor-pointer" size="sm">
            <Link to="/articles/create">Viết bài mới</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("border border-border rounded-xl shadow-xs bg-card overflow-hidden transition-opacity duration-200", isFetching && "opacity-60")}>
      <div className="overflow-x-auto w-full">
        <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[80px]">Ảnh</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/40 transition-colors select-none text-left" onClick={() => onSort('title')}>
              Bài viết {renderSortIndicator('title')}
            </TableHead>
            <TableHead className="w-[140px] text-left">Danh mục</TableHead>
            <TableHead className="w-[160px] text-left">Tác giả</TableHead>
            <TableHead className="w-[110px] text-center cursor-pointer hover:bg-muted/40 transition-colors select-none" onClick={() => onSort('view_count')}>
              Xem {renderSortIndicator('view_count')}
            </TableHead>
            <TableHead className="w-[120px] text-left">Trạng thái</TableHead>
            <TableHead className="w-[150px] cursor-pointer hover:bg-muted/40 transition-colors select-none text-left" onClick={() => onSort('created_at')}>
              Thời gian {renderSortIndicator('created_at')}
            </TableHead>
            <TableHead className="w-[100px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TooltipProvider>
            {articles.map((article) => {
              const thumbUrl = getThumbnailUrl(article.thumbnail_object_key)
              const isAuthor = user?.id === article.author_id || user?.id === article.author?.id
              const title = article.translations?.vi?.title || article.title || '(Chưa có tiêu đề)'
              const slug = article.translations?.vi?.slug || article.slug || ''
              
              return (
                <TableRow key={article.id} className="hover:bg-muted/10 transition-colors">
                  {/* Ảnh bài viết */}
                  <TableCell>
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={title}
                        className="h-10 w-14 rounded-md object-cover border border-border/80 shadow-2xs hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="h-10 w-14 rounded-md bg-muted/40 flex items-center justify-center text-[10px] text-muted-foreground/60 border border-border/40 font-mono">
                        No IMG
                      </div>
                    )}
                  </TableCell>

                  {/* Chi tiết bài viết & Tags */}
                  <TableCell className="max-w-[300px] text-left">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {article.is_pinned && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="p-0.5 bg-amber-500/10 text-amber-500 rounded border border-amber-500/20 shrink-0">
                                <Pin className="h-3 w-3 fill-amber-500/10" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Bài viết được ghim</TooltipContent>
                          </Tooltip>
                        )}
                        {article.is_featured && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="p-0.5 bg-orange-500/10 text-orange-500 rounded border border-orange-500/20 shrink-0">
                                <Star className="h-3 w-3 fill-orange-500/20" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Bài viết nổi bật</TooltipContent>
                          </Tooltip>
                        )}
                        {isAuthor ? (
                          <Link
                            to={`/articles/${article.id}/edit`}
                            className="font-medium text-sm text-foreground hover:text-primary transition-colors hover:underline truncate block"
                          >
                            {title}
                          </Link>
                        ) : (
                          <Link
                            to={`/articles/${article.id}/preview`}
                            className="font-medium text-sm text-foreground hover:text-primary transition-colors hover:underline truncate block"
                          >
                            {title}
                          </Link>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
                        <CornerDownRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                        <span className="truncate" title={slug}>
                          {slug}
                        </span>
                      </div>

                      {/* Hiển thị Tags */}
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
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
                  </TableCell>

                  {/* Danh mục */}
                  <TableCell className="text-left">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{article.category?.name || '(Chưa phân loại)'}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {article.category?.slug || ''}
                      </span>
                    </div>
                  </TableCell>

                  {/* Tác giả */}
                  <TableCell className="text-left">
                    <div className="flex items-center gap-2">
                      {article.author?.avatar_url ? (
                        <img
                          src={article.author.avatar_url}
                          alt={article.author.full_name}
                          className="h-6 w-6 rounded-full object-cover border border-border/80 shadow-3xs"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border border-border">
                          {article.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate max-w-[100px]" title={article.author?.full_name}>
                          {article.author?.full_name}
                        </span>
                        <span className="text-[9px] text-muted-foreground truncate max-w-[100px]" title={article.author?.username}>
                          {article.author?.username}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Lượt xem */}
                  <TableCell className="text-center font-mono text-xs font-medium text-foreground">
                    {article.view_count.toLocaleString()}
                  </TableCell>

                  {/* Trạng thái */}
                  <TableCell className="text-left">{renderStatusBadge(article.status)}</TableCell>

                  {/* Thời gian */}
                  <TableCell className="text-left">
                    <div className="flex flex-col text-xs text-muted-foreground gap-0.5">
                      <span className="font-semibold text-foreground/80">
                        {dayjs(article.created_at).format('DD/MM/YYYY')}
                      </span>
                      <span>Tạo: {dayjs(article.created_at).format('HH:mm')}</span>
                      {article.published_at && (
                        <span className="text-[10px] text-emerald-600/80 font-medium">
                          Bản: {dayjs(article.published_at).format('DD/MM/YYYY')}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Hành động */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isTrashMode ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRestore(article.id)}
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 cursor-pointer"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Khôi phục bài viết</TooltipContent>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <Link to={`/articles/${article.id}/preview`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xem trước bài viết</TooltipContent>
                          </Tooltip>

                          {isAuthor && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  <Link to={`/articles/${article.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Chỉnh sửa bài viết</TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(article.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Xóa bài viết</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TooltipProvider>
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
