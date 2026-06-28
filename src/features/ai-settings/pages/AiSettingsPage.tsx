import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { aiSettingsService } from '../services/aiSettingsService'
import { AiConfigForm } from '../components/AiConfigForm'
import { AiBudgetProgressBar } from '../components/AiBudgetProgressBar'
import { AiCostByModel } from '../components/AiCostByModel'
import { AiUsageLogsDialog } from '../components/AiUsageLogsTable'
import { toast } from 'sonner'
import type { AISettingsUpdatePayload } from '../types'
import { BrainCircuit, Boxes } from 'lucide-react'

export function AiSettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'text' | 'embedding'>('text')

  // ── Queries riêng cho từng Tab ──

  const { data: textSettings, isLoading: isTextLoading, isError: isTextError } = useQuery({
    queryKey: ['ai-settings', 'text'],
    queryFn: () => aiSettingsService.getSettings('text'),
  })

  const { data: embeddingSettings, isLoading: isEmbeddingLoading, isError: isEmbeddingError } = useQuery({
    queryKey: ['ai-settings', 'embedding'],
    queryFn: () => aiSettingsService.getSettings('embedding'),
  })

  // Pricing riêng cho tab Text
  const { data: textPricing = [], isLoading: isTextPricingLoading } = useQuery({
    queryKey: ['ai-pricing', 'text'],
    queryFn: () => aiSettingsService.getPricing('text'),
  })

  // Pricing cho tab Embedding
  const { data: embeddingPricing = [], isLoading: isEmbeddingPricingLoading } = useQuery({
    queryKey: ['ai-pricing', 'embedding'],
    queryFn: () => aiSettingsService.getPricing('embedding'),
  })

  // Spending riêng từng loại
  const { data: textSpending = [] } = useQuery({
    queryKey: ['ai-spending-by-model', 'text'],
    queryFn: () => aiSettingsService.getSpendingByModel('text'),
  })

  const { data: embeddingSpending = [] } = useQuery({
    queryKey: ['ai-spending-by-model', 'embedding'],
    queryFn: () => aiSettingsService.getSpendingByModel('embedding'),
  })

  // Usage logs (chung)
  const { data: usageLogs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['ai-usage-logs'],
    queryFn: () => aiSettingsService.getUsageLogs(),
  })

  // ── Mutation (dùng chung, phân biệt bằng setting_type trong payload) ──

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: AISettingsUpdatePayload) => {
      // BƯỚC 1: Lưu cài đặt cấu hình
      const settings = await aiSettingsService.updateSettings(payload)

      // BƯỚC 2: Tự động chạy test connection ngầm
      let testResult = null
      try {
        testResult = await aiSettingsService.testConnection({
          provider: payload.provider,
          setting_type: payload.setting_type,
          model: payload.model,
          base_url: null,
          api_key: null,
          timeout: 15,
        })
      } catch {
        // Không throw, chỉ ghi nhận
      }
      return { settings, testResult }
    },
    onSuccess: (data) => {
      const { settings, testResult } = data
      const type = settings.setting_type

      if (testResult?.success) {
        toast.success('Lưu cấu hình và đồng bộ model thành công!')
      } else if (testResult) {
        toast.warning(`Đã lưu, nhưng kiểm thử thất bại: ${testResult.message}`)
      } else {
        toast.success('Đã lưu cấu hình thành công.')
      }

      // Invalidate queries của tab tương ứng
      queryClient.invalidateQueries({ queryKey: ['ai-settings', type] })
      queryClient.invalidateQueries({ queryKey: ['ai-spending-by-model', type] })
      queryClient.invalidateQueries({ queryKey: ['ai-pricing', type] })
      queryClient.invalidateQueries({ queryKey: ['ai-usage-logs'] })
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.error?.message || err?.response?.data?.detail || err.message
      toast.error(`Lưu cấu hình thất bại: ${errMsg}`)
    },
  })

  const handleTestConnection = async (payload: any) => {
    const res = await aiSettingsService.testConnection(payload)
    if (res.success) {
      queryClient.invalidateQueries({ queryKey: ['ai-pricing', payload.setting_type] })
    }
    return res
  }

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save Settings: Cmd+S hoặc Ctrl+S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        document.getElementById('ai-config-submit-btn')?.click()
      }
      // Test Connection: Ctrl + Alt + T
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        document.getElementById('ai-config-test-btn')?.click()
      }
      // Open Pricing Dialog: Ctrl + Alt + P
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        document.getElementById('ai-config-pricing-btn')?.click()
      }
      // Open Usage Logs Dialog: Ctrl + Alt + H
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        document.getElementById('ai-config-logs-btn')?.click()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ── Loading ──
  if (isTextLoading || isEmbeddingLoading || isTextPricingLoading || isEmbeddingPricingLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground font-medium">Đang tải cấu hình AI...</span>
      </div>
    )
  }

  // ── Error ──
  if (isTextError || isEmbeddingError || !textSettings || !embeddingSettings) {
    return (
      <div className="p-6 text-center border border-dashed rounded-lg bg-destructive/5 text-destructive max-w-lg mx-auto mt-12">
        <h3 className="font-semibold text-base">Lỗi tải cấu hình AI</h3>
        <p className="text-sm mt-1 opacity-90">Không thể kết nối đến API cấu hình AI. Vui lòng kiểm tra lại quyền truy cập hoặc làm mới trang.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cấu hình Trợ lý AI & Ngân sách</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý khóa API, Model và kiểm soát ngân sách cho từng loại AI riêng biệt.
          </p>
        </div>
        <div className="shrink-0">
          <AiUsageLogsDialog data={usageLogs} isLoading={isLogsLoading} pageSize={10} />
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'text' | 'embedding')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-1.5">
            <BrainCircuit className="h-4 w-4" />
            AI Sinh Văn Bản
          </TabsTrigger>
          <TabsTrigger value="embedding" className="flex items-center gap-1.5">
            <Boxes className="h-4 w-4" />
            AI Embedding
          </TabsTrigger>
        </TabsList>

        {/* Tab Content: Text */}
        <TabsContent value="text" className="mt-6">
          {textSettings && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AiConfigForm
                  key={`text-${textSettings.updated_at}`}
                  settingType="text"
                  initialData={textSettings}
                  onSubmit={(payload) => updateSettingsMutation.mutate(payload)}
                  isSubmitting={updateSettingsMutation.isPending && activeTab === 'text'}
                  onTestConnection={handleTestConnection}
                  pricings={textPricing}
                  isPricingLoading={isTextPricingLoading}
                />
              </div>
              <div className="space-y-6">
                <AiBudgetProgressBar
                  spent={textSettings.monthly_spent}
                  limit={textSettings.monthly_budget_limit}
                  currency={textSettings.currency}
                />
                <AiCostByModel
                  data={textSpending}
                  limit={textSettings.monthly_budget_limit}
                  currency={textSettings.currency}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab Content: Embedding */}
        <TabsContent value="embedding" className="mt-6">
          {embeddingSettings && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AiConfigForm
                  key={`embedding-${embeddingSettings.updated_at}`}
                  settingType="embedding"
                  initialData={embeddingSettings}
                  onSubmit={(payload) => updateSettingsMutation.mutate(payload)}
                  isSubmitting={updateSettingsMutation.isPending && activeTab === 'embedding'}
                  onTestConnection={handleTestConnection}
                  pricings={embeddingPricing}
                  isPricingLoading={isEmbeddingPricingLoading}
                />
              </div>
              <div className="space-y-6">
                <AiBudgetProgressBar
                  spent={embeddingSettings.monthly_spent}
                  limit={embeddingSettings.monthly_budget_limit}
                  currency={embeddingSettings.currency}
                />
                <AiCostByModel
                  data={embeddingSpending}
                  limit={embeddingSettings.monthly_budget_limit}
                  currency={embeddingSettings.currency}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
