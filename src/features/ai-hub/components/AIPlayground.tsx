import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Cpu,
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  Clock,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  latency_ms?: number;
  actual_model?: string;
}

interface AIPlaygroundProps {
  chatModels: AIModel[]
  defaultModel: string
  isLoadingModels: boolean
}

export function AIPlayground({ chatModels, defaultModel, isLoadingModels }: AIPlaygroundProps) {
  const queryClient = useQueryClient()
  const [playgroundModel, setPlaygroundModel] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(300)
  const [inputMessage, setInputMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (defaultModel && !playgroundModel) {
      setPlaygroundModel(defaultModel)
    }
  }, [defaultModel, playgroundModel])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const playgroundMutation = useMutation({
    mutationFn: (promptText: string) =>
      aiHubService.callPlayground({
        model: playgroundModel,
        prompt: promptText,
        system_prompt: systemPrompt || undefined,
        temperature,
        max_tokens: maxTokens,
      }),
    onMutate: (promptText) => {
      setChatHistory((prev) => [...prev, { role: 'user', content: promptText }])
      setInputMessage('')
      return { tempMsg: promptText }
    },
    onSuccess: (res) => {
      setChatHistory((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: res.response, 
          latency_ms: res.latency_ms,
          actual_model: res.actual_model 
        },
      ])
      queryClient.invalidateQueries({ queryKey: ['ai-logs'] })
      queryClient.invalidateQueries({ queryKey: ['ai-spend'] })
    },
    onError: (error: any, variables, context) => {
      const msg = error?.response?.data?.detail || error?.response?.data?.error?.message || 'Lỗi gọi mô hình AI.'
      toast.error(msg)
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Lỗi: ${msg}` },
      ])
      if (context?.tempMsg) setInputMessage(context.tempMsg)
    },
  })

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || playgroundMutation.isPending) return
    playgroundMutation.mutate(inputMessage)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Panel Cấu hình bên trái */}
      <Card className="lg:col-span-1 border shadow-xs bg-card">
        <CardHeader className="p-4 border-b bg-muted/20">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
            Tham số mô phỏng
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mô hình AI</label>
            {isLoadingModels ? (
              <div className="h-9 w-full bg-muted animate-pulse rounded border" />
            ) : (
              <Select value={playgroundModel} onValueChange={setPlaygroundModel}>
                <SelectTrigger className="w-full bg-background h-9 text-xs cursor-pointer">
                  <SelectValue placeholder="Chọn model" />
                </SelectTrigger>
                <SelectContent>
                  {chatModels?.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="cursor-pointer text-xs">
                      {model.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Chỉ thị hệ thống</label>
            <Textarea
              placeholder="Chỉ thị hệ thống (ví dụ: Bạn là một dịch giả chuyên nghiệp...)"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="min-h-[140px] text-xs resize-none bg-background/40 focus:bg-background transition-colors leading-relaxed border-border/80"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-muted-foreground">Temperature</span>
              <span className="font-mono text-primary font-bold">{temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Chính xác (0.0)</span>
              <span>Sáng tạo (1.2)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Max Tokens</label>
            <Input
              type="number"
              min={50}
              max={8000}
              value={maxTokens}
              onChange={(e) => setMaxTokens(Math.min(8000, Math.max(50, parseInt(e.target.value) || 100)))}
              onBlur={() => setMaxTokens((prev) => Math.min(8000, Math.max(50, prev)))}
              className="bg-background h-8 text-xs font-mono border-border/80"
            />
          </div>
        </CardContent>
      </Card>

      {/* Khung Chat bên phải */}
      <Card className="lg:col-span-3 border shadow-md flex flex-col h-[650px] overflow-hidden bg-card">
        <CardHeader className="p-4 border-b bg-muted/10 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
              AI Sandbox Playground
            </CardTitle>
          </div>
          {chatHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChatHistory([])}
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 cursor-pointer flex items-center gap-1 h-8 rounded-full px-3"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa hội thoại
            </Button>
          )}
        </CardHeader>

        {/* Khung tin nhắn */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-muted/5 relative">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3.5">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-inner">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="font-bold text-foreground text-sm">Bắt đầu mô phỏng AI Chat!</h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Thiết lập mô hình ở cột cấu hình bên trái, nhập tin nhắn hoặc nội dung cần biên dịch thử nghiệm dưới đây.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 shadow-sm relative group transition-all duration-200 border ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                        : 'bg-card text-foreground border-border/80 rounded-tl-none'
                    }`}
                  >
                    <div className="text-xs whitespace-pre-wrap leading-relaxed select-text font-medium">{msg.content}</div>

                    {msg.latency_ms !== undefined && (
                      <div className={`flex flex-wrap items-center gap-2 mt-2 text-[9px] border-t pt-1.5 ${
                        msg.role === 'user' ? 'border-primary-foreground/20 text-primary-foreground/75' : 'border-border/60 text-muted-foreground'
                      }`}>
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          Phản hồi: {msg.latency_ms}ms
                        </span>
                        {msg.actual_model && (
                          <span className="flex items-center gap-1 font-mono">
                            • Thực tế: 
                            <span className={msg.actual_model !== playgroundModel ? "text-amber-500 font-semibold" : ""}>
                              {msg.actual_model}
                            </span>
                            {msg.actual_model !== playgroundModel && (
                              <Badge className="bg-amber-500/10 text-[8px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/20 h-4 px-1 rounded-sm scale-90">
                                Fallback
                              </Badge>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-muted border border-border/80 flex items-center justify-center shrink-0 shadow-2xs">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {playgroundMutation.isPending && (
            <div className="flex gap-3.5 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-card text-foreground border border-border/80 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground animate-pulse font-medium">AI đang xử lý...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Khung soạn thảo */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-muted/10 flex gap-2">
          <Input
            placeholder="Gửi tin nhắn hoặc nội dung cần dịch..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={playgroundMutation.isPending}
            className="bg-background border-border/80 focus-visible:ring-primary flex-1 h-10 text-xs px-4"
          />
          <Button
            type="submit"
            disabled={playgroundMutation.isPending || !inputMessage.trim()}
            className="flex items-center justify-center gap-1.5 cursor-pointer shadow-md px-4 font-semibold h-10"
          >
            <Send className="h-4 w-4" />
            <span>Gửi</span>
          </Button>
        </form>
      </Card>
    </div>
  )
}
