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
import { HelpCircle } from 'lucide-react'
import dayjs from 'dayjs'
import type { AIModelPricing } from '../types'

interface AiPricingDialogProps {
  data: AIModelPricing[]
  isLoading: boolean
  trigger?: React.ReactNode
}

export function AiPricingDialog({ data, isLoading, trigger }: AiPricingDialogProps) {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    setIsMac(navigator.userAgent.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  const columns: ColumnDef<AIModelPricing>[] = [
    {
      accessorKey: 'provider',
      header: 'Nhà cung cấp',
      cell: ({ row }) => {
        const provider = row.getValue('provider') as string
        return (
          <Badge variant="outline" className="capitalize text-xs font-medium">
            {provider}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'model_name',
      header: 'Tên Model',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground/80">
          {row.getValue('model_name')}
        </span>
      ),
    },
    {
      accessorKey: 'input_price_per_1m',
      header: 'Giá Input / 1M Tokens',
      cell: ({ row }) => {
        const val = row.getValue('input_price_per_1m') as number
        return <span className="text-xs font-medium tabular-nums">{val.toFixed(4)} USD</span>
      },
    },
    {
      accessorKey: 'output_price_per_1m',
      header: 'Giá Output / 1M Tokens',
      cell: ({ row }) => {
        const val = row.getValue('output_price_per_1m') as number
        return <span className="text-xs font-medium tabular-nums">{val.toFixed(4)} USD</span>
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Cập nhật ngày',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {dayjs(row.getValue('created_at')).format('DD/MM/YYYY HH:mm')}
        </span>
      ),
    },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button id="ai-config-pricing-btn" type="button" variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground hover:text-foreground border border-dashed flex items-center gap-1.5 px-2">
            <HelpCircle className="h-3 w-3" />
            Tra cứu bảng giá <kbd className="hidden sm:inline-block px-1 py-0.2 text-[8px] font-mono bg-muted border rounded shadow-xs ml-1 font-bold">{isMac ? 'Ctrl+⌥+P' : 'Ctrl+Alt+P'}</kbd>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-foreground/90">Bảng Đơn Giá Model AI</DialogTitle>
          <DialogDescription className="text-xs flex items-center gap-2">
            <span>Chi tiết đơn giá trên 1 triệu tokens (1M tokens) do hệ thống cấu hình để tính chi phí sử dụng.</span>
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
            pageSize={5}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
