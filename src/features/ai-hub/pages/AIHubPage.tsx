import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BrainCircuit, MessageSquare, BarChart3, ListTodo } from 'lucide-react'
import { toast } from 'sonner'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { usersService } from '@/features/users/services/usersService'
import { aiHubService } from '../services/aiHubService'

// Import Sub-components mới tách
import { AIModelSelector } from '../components/AIModelSelector'
import { AIPlayground } from '../components/AIPlayground'
import { AISpendAnalytics } from '../components/AISpendAnalytics'
import { AILogList } from '../components/AILogList'

export function AIHubPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('playground')

  // --- QUERY: LẤY CẤU HÌNH MODELS ---
  const { data: aiSettings = { active_model: '', chat_models: [], embedding_models: [] }, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: () => aiHubService.getAISettings(),
    refetchOnMount: 'always',
  })

  // Mutation: Lưu cấu hình active model hệ thống (Chat)
  const saveAISettingsMutation = useMutation({
    mutationFn: (model: string) => aiHubService.updateAISettings(model),
    onSuccess: (res) => {
      toast.success(res.message || 'Đã cập nhật mô hình hoạt động chính thành công!')
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Không thể cập nhật cấu hình mô hình.'
      toast.error(msg)
    },
  })

  // --- TAB 2: SPEND ANALYTICS STATE & QUERY ---
  const [spendPeriod, setSpendPeriod] = useState<'day' | 'month' | 'year' | 'all'>('day')
  const { data: spendData = { time_series: [], user_spend: [] }, isLoading: isLoadingSpend } = useQuery({
    queryKey: ['ai-spend', spendPeriod],
    queryFn: () => aiHubService.getAISpend(spendPeriod, 'chat'),
    enabled: activeTab === 'spend',
  })

  // --- TAB 3: REQUEST LOGS STATE & QUERY ---
  const [logsPage, setLogsPage] = useState(1)
  const [logsModelFilter, setLogsModelFilter] = useState('ALL')
  const [logsStatusFilter, setLogsStatusFilter] = useState('ALL')
  const [logsUserFilter, setLogsUserFilter] = useState('ALL')

  // Query lấy danh sách users phục vụ bộ lọc
  const { data: usersData = { items: [] } } = useQuery({
    queryKey: ['users-list-for-filter'],
    queryFn: () => usersService.list({ page_size: 100 }),
    enabled: activeTab === 'logs',
  })

  const { data: logsData = { total: 0, page: 1, page_size: 10, items: [] }, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['ai-logs', logsPage, logsModelFilter, logsStatusFilter, logsUserFilter],
    queryFn: () =>
      aiHubService.getAILogs(
        logsPage,
        10,
        logsModelFilter === 'ALL' ? undefined : logsModelFilter,
        logsStatusFilter === 'ALL' ? undefined : logsStatusFilter,
        logsUserFilter === 'ALL' ? undefined : logsUserFilter,
        'chat'
      ),
    enabled: activeTab === 'logs',
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary shrink-0" />
            AI Management Hub
          </h2>
          <p className="text-muted-foreground text-sm leading-normal">
            Trung tâm thử nghiệm, cấu hình hoạt động, giám sát phân bổ chi phí và nhật ký cuộc gọi AI.
          </p>
        </div>
      </div>

      {/* Cấu hình active model của hệ thống (Chat) */}
      <AIModelSelector
        activeModel={aiSettings?.active_model}
        models={aiSettings?.chat_models}
        isLoading={isLoadingSettings}
        onSave={(model) => saveAISettingsMutation.mutate(model)}
        isPending={saveAISettingsMutation.isPending}
        title="Mô hình Chat hệ thống chính"
        description="Mô hình được cấu hình làm mặc định để tự động xử lý các tác vụ dịch bài viết trong CMS."
      />

      {/* Tabs Menu */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-[480px] bg-muted/60 border p-1 rounded-lg">
          <TabsTrigger value="playground" className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <MessageSquare className="h-4 w-4" />
            Playground
          </TabsTrigger>
          <TabsTrigger value="spend" className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <BarChart3 className="h-4 w-4" />
            Thống kê chi phí
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <ListTodo className="h-4 w-4" />
            Nhật ký cuộc gọi
          </TabsTrigger>
        </TabsList>

        {/* -------------------- TAB 1: PLAYGROUND -------------------- */}
        <TabsContent value="playground" className="outline-hidden">
          <AIPlayground
            chatModels={aiSettings?.chat_models}
            defaultModel={aiSettings?.active_model}
            isLoadingModels={isLoadingSettings}
          />
        </TabsContent>

        {/* -------------------- TAB 2: SPEND ANALYTICS -------------------- */}
        <TabsContent value="spend" className="outline-hidden">
          <AISpendAnalytics
            spendData={spendData}
            isLoading={isLoadingSpend}
            spendPeriod={spendPeriod}
            onPeriodChange={setSpendPeriod}
            modelType="chat"
          />
        </TabsContent>

        {/* -------------------- TAB 3: REQUEST LOGS -------------------- */}
        <TabsContent value="logs" className="outline-hidden">
          <AILogList
            logsData={logsData}
            isLoading={isLoadingLogs}
            page={logsPage}
            onPageChange={setLogsPage}
            modelFilter={logsModelFilter}
            onModelFilterChange={setLogsModelFilter}
            statusFilter={logsStatusFilter}
            onStatusFilterChange={setLogsStatusFilter}
            userFilter={logsUserFilter}
            onUserFilterChange={setLogsUserFilter}
            chatModels={aiSettings?.chat_models}
            embeddingModels={aiSettings?.embedding_models}
            usersList={usersData?.items}
            modelType="chat"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AIHubPage
