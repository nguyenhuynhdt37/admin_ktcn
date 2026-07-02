import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Fingerprint } from 'lucide-react'
import { toast } from 'sonner'

import { usersService } from '@/features/users/services/usersService'
import { aiHubService } from '../services/aiHubService'

// Import Sub-components mới tách
import { AIModelSelector } from '../components/AIModelSelector'
import { AIEmbeddingSandbox } from '../components/AIEmbeddingSandbox'
import { AISpendAnalytics } from '../components/AISpendAnalytics'
import { AILogList } from '../components/AILogList'

export function EmbeddingSettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('sandbox')

  // --- QUERY: LẤY CẤU HÌNH MODELS ---
  const { data: aiSettings = { active_model: '', active_embedding_model: '', chat_models: [], embedding_models: [], embedding_priority_list: [] }, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: () => aiHubService.getAISettings(),
    refetchOnMount: 'always',
  })

  // Mutation: Lưu cấu hình active embedding model của hệ thống
  const saveAISettingsMutation = useMutation({
    mutationFn: (model: string) => aiHubService.updateAISettings(undefined, model),
    onSuccess: (res) => {
      toast.success(res.message || 'Đã cập nhật mô hình Vector hóa (Embedding) chính thành công!')
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Không thể cập nhật cấu hình mô hình Embedding.'
      toast.error(msg)
    },
  })

  // --- TAB 2: SPEND ANALYTICS STATE & QUERY ---
  const [spendPeriod, setSpendPeriod] = useState<'day' | 'month' | 'year' | 'all'>('day')
  const { data: spendData = { time_series: [], user_spend: [] }, isLoading: isLoadingSpend } = useQuery({
    queryKey: ['ai-spend-embedding', spendPeriod],
    queryFn: () => aiHubService.getAISpend(spendPeriod, 'embedding'),
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
    queryKey: ['ai-logs-embedding', logsPage, logsModelFilter, logsStatusFilter, logsUserFilter],
    queryFn: () =>
      aiHubService.getAILogs(
        logsPage,
        10,
        logsModelFilter === 'ALL' ? undefined : logsModelFilter,
        logsStatusFilter === 'ALL' ? undefined : logsStatusFilter,
        logsUserFilter === 'ALL' ? undefined : logsUserFilter,
        'embedding'
      ),
    enabled: activeTab === 'logs',
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Fingerprint className="h-6 w-6 text-primary shrink-0" />
            Cấu hình Vector hóa (Embedding)
          </h2>
          <p className="text-muted-foreground text-sm leading-normal">
            Quản lý, thử nghiệm vector hóa văn bản và giám sát chi tiêu, nhật ký các cuộc gọi API đặc trưng vector.
          </p>
        </div>
      </div>

      {/* Cấu hình active model của hệ thống (Embedding) */}
      <AIModelSelector
        activeModel={aiSettings?.active_embedding_model}
        models={aiSettings?.embedding_models}
        isLoading={isLoadingSettings}
        onSave={(model) => saveAISettingsMutation.mutate(model)}
        isPending={saveAISettingsMutation.isPending}
        title="Mô hình Embedding hệ thống chính"
        description="Mô hình được cấu hình làm mặc định để tự động sinh vector embedding cho các tác vụ lưu trữ DB/RAG."
      />

      {/* Tabs Navigation */}
      <div className="flex border-b border-border/80">
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'sandbox'
              ? 'border-primary text-primary font-bold bg-muted/20'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Sandbox & Cấu hình
        </button>
        <button
          onClick={() => setActiveTab('spend')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'spend'
              ? 'border-primary text-primary font-bold bg-muted/20'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Thống kê chi phí
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === 'logs'
              ? 'border-primary text-primary font-bold bg-muted/20'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Nhật ký cuộc gọi
        </button>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-3">
            <AIEmbeddingSandbox
              embeddingModels={aiSettings?.embedding_models}
              defaultModel={aiSettings?.active_embedding_model}
            />
          </div>
        </div>
      )}

      {activeTab === 'spend' && (
        <AISpendAnalytics
          spendData={spendData}
          isLoading={isLoadingSpend}
          spendPeriod={spendPeriod}
          onPeriodChange={setSpendPeriod}
          modelType="embedding"
        />
      )}

      {activeTab === 'logs' && (
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
          modelType="embedding"
        />
      )}
    </div>
  )
}

export default EmbeddingSettingsPage
