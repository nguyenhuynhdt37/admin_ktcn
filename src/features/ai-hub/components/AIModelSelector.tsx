import { useState, useEffect } from 'react'
import { Cpu, Save, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import type { AIModel } from '../types'

interface AIModelSelectorProps {
  activeModel: string
  models: AIModel[]
  isLoading: boolean
  onSave: (model: string) => void
  isPending: boolean
  title: string
  description: string
}

export function AIModelSelector({
  activeModel,
  models,
  isLoading,
  onSave,
  isPending,
  title,
  description,
}: AIModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState('')

  useEffect(() => {
    if (activeModel) {
      setSelectedModel(activeModel)
    }
  }, [activeModel])

  return (
    <Card className="border shadow-xs bg-gradient-to-r from-background via-background to-muted/30 overflow-hidden">
      <CardContent className="p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-primary shrink-0" />
            {title}
          </h3>
          <p className="text-muted-foreground text-xs leading-normal">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-[180px] bg-muted animate-pulse rounded border" />
          ) : (
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={isPending}
            >
              <SelectTrigger className="w-[180px] bg-background h-9 text-xs cursor-pointer focus:ring-1">
                <SelectValue placeholder="Chọn mô hình" />
              </SelectTrigger>
              <SelectContent>
                {models?.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="cursor-pointer text-xs">
                    {model.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            size="sm"
            onClick={() => onSave(selectedModel)}
            disabled={isPending || selectedModel === activeModel || !selectedModel}
            className="flex items-center gap-1.5 cursor-pointer h-9 shadow-xs shrink-0 font-semibold"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">Lưu cài đặt</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
