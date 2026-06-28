import React, { useState, useEffect } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { DataTable } from '@/shared/components/DataTable'
import { Badge } from '@/shared/components/ui/badge'
import { History } from 'lucide-react'
import dayjs from 'dayjs'
import type { AIUsageLog } from '../types'

interface AiUsageLogsDialogProps {
  data: AIUsageLog[]
  isLoading: boolean
  pageSize: number
  trigger?: React.ReactNode
}

// Map các tính năng AI sang label tiếng Việt thân thiện
const FEATURE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  generate_seo: { label: 'Tối ưu SEO', variant: 'secondary' },
  connection_test: { label: 'Test kết nối', variant: 'outline' },
  chatbot: { label: 'Trò chuyện', variant: 'outline' },
  translate: { label: 'Dịch thuật', variant: 'outline' },
}

export function AiUsageLogsDialog({ data, isLoading, pageSize, trigger }: AiUsageLogsDialogProps) {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    setIsMac(navigator.userAgent.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  const columns: ColumnDef<AIUsageLog>[] = [
    {
      accessorKey: 'created_at',
      header: 'Thời gian',
      cell: ({ row }) => (
        <span className="text-xs text-foreground tabular-nums whitespace-nowrap">
          {dayjs(row.getValue('created_at')).format('DD/MM/YY HH:mm:ss')}
        </span>
      ),
    },
    {
      accessorKey: 'user_username',
      header: 'Người gọi',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground/80">
          {row.getValue('user_username') || 'Ẩn danh / Hệ thống'}
        </span>
      ),
    },
    {
      accessorKey: 'feature',
      header: 'Chức năng',
      cell: ({ row }) => {
        const feature = row.getValue('feature') as string
        const meta = FEATURE_LABELS[feature] || { label: feature, variant: 'default' }
        return <Badge variant={meta.variant} className="text-[10px] font-normal">{meta.label}</Badge>
      },
    },
    {
      accessorKey: 'model',
      header: 'Model AI',
      cell: ({ row }) => {
        const provider = row.original.provider
        const model = row.original.model
        return (
          <span className="text-xs font-mono text-muted-foreground">
            <span className="capitalize font-semibold text-foreground/75 mr-1">{provider}:</span>
            {model}
          </span>
        )
      },
    },
    {
      accessorKey: 'prompt_tokens',
      header: 'Tokens (P / C / T)',
      cell: ({ row }) => {
        const prompt = row.original.prompt_tokens
        const completion = row.original.completion_tokens
        const total = prompt + completion
        return (
          <span className="text-xs tabular-nums text-muted-foreground" title={`Prompt: ${prompt} | Completion: ${completion}`}>
            {prompt} / {completion} / <span className="font-semibold text-foreground/85">{total}</span>
          </span>
        )
      },
    },
    {
      accessorKey: 'cost',
      header: 'Chi phí (USD)',
      cell: ({ row }) => {
        const cost = row.getValue('cost') as number
        return (
          <span className="text-xs font-semibold text-emerald-600 tabular-nums">
            ${cost.toFixed(6)}
          </span>
        )
      },
    },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button id="ai-config-logs-btn" type="button" variant="outline" size="sm" className="flex items-center gap-1.5 h-9 text-xs">
            <History className="h-4 w-4" />
            Nhật ký sử dụng <kbd className="hidden sm:inline-block px-1 py-0.2 text-[8px] font-mono bg-muted border rounded shadow-xs ml-1 font-bold">{isMac ? 'Ctrl+⌥+H' : 'Ctrl+Alt+H'}</kbd>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-foreground/90">Nhật Ký Sử Dụng AI</DialogTitle>
          <DialogDescription className="text-xs flex items-center gap-2">
            <span>Lịch sử chi tiết các lượt gọi trợ lý AI, lượng token tiêu thụ và ước tính chi phí thực tế.</span>
            <span className="ml-auto shrink-0 flex items-center gap-1">
              Bấm <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-muted border rounded shadow-xs">ESC</kbd> để đóng
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            pageSize={pageSize}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
