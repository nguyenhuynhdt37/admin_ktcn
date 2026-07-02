import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Cpu,
  Play,
  RotateCcw,
  Sparkles,
  Loader2,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { aiHubService } from '../services/aiHubService'
import type { AIModel } from '../types'

interface AIEmbeddingSandboxProps {
  embeddingModels: AIModel[]
  defaultModel: string
}

export function AIEmbeddingSandbox({ embeddingModels, defaultModel }: AIEmbeddingSandboxProps) {
  const queryClient = useQueryClient()
  const [testModel, setTestModel] = useState('')
  const [testInput, setTestInput] = useState('Google DeepMind AI Assistant Antigravity is pair programming with the developer to build a state of the art CMS system.')
  const [embeddingResult, setEmbeddingResult] = useState<{
    embedding: number[];
    dimensions: number;
    latency_ms: number;
    actual_model: string;
  } | null>(null)

  // Đồng bộ testModel mặc định là defaultModel
  useEffect(() => {
    if (defaultModel && !testModel) {
      setTestModel(defaultModel)
    }
  }, [defaultModel, testModel])

  // Mutation gọi playground test sinh vector
  const embeddingPlaygroundMutation = useMutation({
    mutationFn: (payload: { model: string; input: string }) =>
      aiHubService.callEmbeddingPlayground(payload),
    onSuccess: (res) => {
      setEmbeddingResult(res)
      toast.success('Vector hóa văn bản thành công!')
      // Refresh logs & spend
      queryClient.invalidateQueries({ queryKey: ['ai-logs'] })
      queryClient.invalidateQueries({ queryKey: ['ai-spend'] })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Lỗi khi gọi API sinh vector embedding.'
      toast.error(msg)
    },
  })

  const handleTestEmbedding = () => {
    if (!testInput.trim()) {
      toast.warning('Vui lòng nhập văn bản cần vector hóa!')
      return
    }
    embeddingPlaygroundMutation.mutate({
      model: testModel || defaultModel,
      input: testInput,
    })
  }

  return (
    <Card className="border shadow-sm bg-card">
      <CardHeader className="p-5 border-b bg-muted/10">
        <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
          <Play className="h-4 w-4 text-primary shrink-0" />
          Embedding Sandbox
        </CardTitle>
        <CardDescription className="text-xs">
          Thử nghiệm chuyển đổi một đoạn văn bản thô sang Vector đặc trưng nhiều chiều (1536/3072 chiều) bằng mô hình được lựa chọn.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Chọn mô hình thử nghiệm</label>
            <Select value={testModel} onValueChange={setTestModel}>
              <SelectTrigger className="bg-background h-9 text-xs cursor-pointer border-border/80">
                <SelectValue placeholder="Chọn mô hình test" />
              </SelectTrigger>
              <SelectContent>
                {embeddingModels?.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="cursor-pointer text-xs">
                    {model.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Văn bản đầu vào (Input Text)</label>
          <Textarea
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            rows={4}
            placeholder="Nhập văn bản cần vector hóa tại đây..."
            className="text-xs bg-background/40 focus:bg-background leading-relaxed resize-none border-border/80"
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTestInput('')
              setEmbeddingResult(null)
            }}
            disabled={embeddingPlaygroundMutation.isPending}
            className="cursor-pointer h-9 text-xs font-semibold px-4"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleTestEmbedding}
            disabled={embeddingPlaygroundMutation.isPending}
            className="cursor-pointer h-9 text-xs font-semibold px-4"
          >
            {embeddingPlaygroundMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            Trích xuất Vector
          </Button>
        </div>

        {/* Kết quả vector hóa */}
        {embeddingResult && (
          <div className="mt-5 space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg border text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Mô hình thực tế</span>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span className="text-xs font-mono font-bold text-foreground truncate max-w-[140px]" title={embeddingResult.actual_model}>
                    {embeddingResult.actual_model}
                  </span>
                  {embeddingResult.actual_model !== testModel && (
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[9px] py-0 px-1.5">
                      Fallback
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Số chiều Vector</span>
                <span className="text-xs font-extrabold text-primary block mt-1">{embeddingResult.dimensions} dimensions</span>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Thời gian phản hồi</span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">{embeddingResult.latency_ms} ms</span>
              </div>
            </div>

            {/* Vector Visualization (Heatmap) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-semibold">Mô phỏng đặc trưng ngữ nghĩa (Vector Heatmap Preview):</span>
                <span className="text-[10px]">Hiển thị 80 chiều đầu tiên (Chuẩn hóa nhiệt độ HSL)</span>
              </div>
              <div 
                className="grid gap-0.5 p-2 bg-slate-950 dark:bg-slate-900 rounded-lg border overflow-hidden"
                style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
              >
                {(() => {
                  const subset = embeddingResult.embedding.slice(0, 80)
                  const minVal = Math.min(...subset)
                  const maxVal = Math.max(...subset)
                  const range = maxVal - minVal || 1

                  return subset.map((val, idx) => {
                    const normalized = (val - minVal) / range
                    const hue = (1 - normalized) * 240
                    
                    return (
                      <div
                        key={idx}
                        className="aspect-square rounded-[1.5px] cursor-pointer hover:scale-125 transition-all duration-150 border border-slate-950/20 hover:border-white/50"
                        style={{
                          backgroundColor: `hsl(${hue}, 85%, 50%)`,
                        }}
                        title={`Chiều #${idx}: ${val.toFixed(6)} (Chuẩn hóa: ${(normalized * 100).toFixed(1)}%)`}
                      />
                    )
                  })
                })()}
              </div>
            </div>

            {/* Vector Text Area Preview */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground block">Mảng Vector giá trị số (10 phần tử đầu tiên):</span>
              <pre className="p-3 bg-muted/20 text-[10px] font-mono rounded-lg border text-foreground/80 overflow-x-auto select-all leading-normal">
                {JSON.stringify(embeddingResult.embedding.slice(0, 10), null, 2).replace(']', ',\n  ...\n]')}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
