import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Loader2, Sparkles, CheckCircle2, XCircle, Coins, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { AiPricingDialog } from './AiPricingTable'
import type { AISettings, AISettingsUpdatePayload, AITestConnectionPayload, AITestConnectionResponse, AIModelPricing } from '../types'

interface AiConfigFormProps {
  settingType: 'text' | 'embedding'
  initialData: AISettings
  onSubmit: (data: AISettingsUpdatePayload) => void
  isSubmitting: boolean
  onTestConnection: (payload: AITestConnectionPayload) => Promise<AITestConnectionResponse>
  pricings: AIModelPricing[]
  isPricingLoading: boolean
}

// ── Cấu hình theo loại setting ──
const SETTING_CONFIG = {
  text: {
    icon: <Sparkles className="h-4 w-4 text-primary animate-pulse" />,
    title: 'Cấu hình AI Sinh Văn Bản',
    description: 'Thiết lập API Key và model LLM sử dụng cho trợ lý AI SEO sinh nội dung.',
    defaultModel: 'gemini-2.5-flash',
    fallbackModels: ['gemini-2.5-flash', 'gemini-2.5-pro'],
    showTemperature: true,
    defaultBudget: 50,
  },
  embedding: {
    icon: <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />,
    title: 'Cấu hình AI Embedding',
    description: 'Cấu hình model Embedding cho tìm kiếm ngữ nghĩa (Vector Search) và bài viết liên quan.',
    defaultModel: 'text-embedding-004',
    fallbackModels: ['text-embedding-004', 'text-multilingual-embedding-002'],
    showTemperature: false,
    defaultBudget: 10,
  },
} as const

export function AiConfigForm({
  settingType,
  initialData,
  onSubmit,
  isSubmitting,
  onTestConnection,
  pricings = [],
  isPricingLoading = false,
}: AiConfigFormProps) {
  const config = SETTING_CONFIG[settingType]

  const [isEnabled, setIsEnabled] = useState(initialData.is_enabled)
  const [provider, setProvider] = useState(initialData.provider)
  const [model, setModel] = useState(initialData.model || config.defaultModel)
  const [baseUrl, setBaseUrl] = useState(initialData.base_url || '')
  const [apiKey, setApiKey] = useState('')
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState(String(initialData.monthly_budget_limit))
  const [budgetResetDay, setBudgetResetDay] = useState(String(initialData.budget_reset_day))
  const [temperature, setTemperature] = useState(String(initialData.temperature))
  const [timeout, setTimeoutVal] = useState(String(initialData.timeout))

  // State kiểm tra kết nối
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null)
  const [detectedModels, setDetectedModels] = useState<any[]>([])
  const [isMac, setIsMac] = useState(false)

  const [lastTestedConfig, setLastTestedConfig] = useState<{
    provider: string
    model: string
    baseUrl: string
    apiKey: string
    timeout: number
  } | null>(null)

  const [lastUpdatedAt, setLastUpdatedAt] = useState(initialData.updated_at)

  useEffect(() => {
    setIsMac(navigator.userAgent.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  useEffect(() => {
    setIsEnabled(initialData.is_enabled)
    setProvider(initialData.provider)
    setModel(initialData.model || config.defaultModel)
    setBaseUrl(initialData.base_url || '')
    setMonthlyBudgetLimit(String(initialData.monthly_budget_limit))
    setBudgetResetDay(String(initialData.budget_reset_day))
    setTemperature(String(initialData.temperature))
    setTimeoutVal(String(initialData.timeout))
    
    // Chỉ reset API Key và cấu hình kiểm thử khi dữ liệu thực sự được cập nhật mới trên server (sau khi Lưu thành công)
    if (initialData.updated_at !== lastUpdatedAt) {
      setApiKey('')
      setLastTestedConfig(null)
      setLastUpdatedAt(initialData.updated_at)
      setTestResult(null)
      setDetectedModels([])
    }
  }, [initialData])

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await onTestConnection({
        provider,
        setting_type: settingType,
        base_url: baseUrl.trim() || null,
        api_key: apiKey.trim() || null,
        model: model || config.defaultModel,
        timeout: Number(timeout) || 10,
      })

      setTestResult({
        success: res.success,
        message: res.message,
        details: res.error_details,
      })

      if (res.success) {
        toast.success(res.message)
        const activeModelName = res.detected_models && res.detected_models.length > 0
          ? res.detected_models[0].model_name
          : (model || config.defaultModel)

        setLastTestedConfig({
          provider,
          model: activeModelName,
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
          timeout: Number(timeout) || 10,
        })

        if (res.detected_models && res.detected_models.length > 0) {
          setDetectedModels(res.detected_models)
          setModel(res.detected_models[0].model_name)
        }
      } else {
        toast.error(res.message)
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Lỗi hệ thống khi gửi yêu cầu kiểm tra kết nối.',
        details: err?.message || 'Không xác định',
      })
      toast.error('Gửi yêu cầu kiểm tra kết nối thất bại.')
    } finally {
      setIsTesting(false)
    }
  }

  const handleModelChange = async (newModel: string) => {
    setModel(newModel)
    
    // Tự động kiểm tra xem model được chọn có hoạt động tốt không
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await onTestConnection({
        provider,
        setting_type: settingType,
        base_url: baseUrl.trim() || null,
        api_key: apiKey.trim() || null,
        model: newModel,
        timeout: Number(timeout) || 10,
      })

      setTestResult({
        success: res.success,
        message: res.success 
          ? `Model '${newModel}' hoạt động tốt và khả dụng!` 
          : `Model '${newModel}' kiểm thử kết nối thất bại.`,
        details: res.error_details,
      })

      if (res.success) {
        toast.success(`Model '${newModel}' hoạt động tốt!`)
        setLastTestedConfig({
          provider,
          model: newModel,
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
          timeout: Number(timeout) || 10,
        })
      } else {
        toast.error(`Model '${newModel}' không khả dụng: ${res.message}`)
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Lỗi kết nối khi kiểm tra model '${newModel}'.`,
        details: err?.message || 'Không xác định',
      })
      toast.error(`Kiểm tra model '${newModel}' thất bại.`)
    } finally {
      setIsTesting(false)
    }
  }

  // Trích xuất danh sách model khả dụng thực tế
  const availableModels = React.useMemo(() => {
    const dbModels = pricings
      .filter((p) => p.provider.toLowerCase() === provider.toLowerCase())
      .map((p) => p.model_name)

    const tempModels = detectedModels.map((m) => m.model_name)
    const all = Array.from(new Set([...dbModels, ...tempModels]))
    return all.sort()
  }, [pricings, detectedModels, provider])

  const selectedPricing = pricings.find(
    (p) => p.provider.toLowerCase() === provider.toLowerCase() && p.model_name === model,
  )
  const detectedModelInfo = detectedModels.find((m) => m.model_name === model)
  const inputPrice = selectedPricing?.input_price_per_1m ?? detectedModelInfo?.input_price_per_1m
  const outputPrice = selectedPricing?.output_price_per_1m ?? detectedModelInfo?.output_price_per_1m

  // 1. Kiểm tra xem form có bất kỳ thay đổi nào so với DB hiện tại không
  const hasChanges = 
    isEnabled !== initialData.is_enabled ||
    provider !== initialData.provider ||
    model !== initialData.model ||
    baseUrl.trim() !== (initialData.base_url || '').trim() ||
    apiKey.trim() !== '' ||
    Number(monthlyBudgetLimit) !== initialData.monthly_budget_limit ||
    Number(budgetResetDay) !== initialData.budget_reset_day ||
    (config.showTemperature && Number(temperature) !== initialData.temperature) ||
    Number(timeout) !== initialData.timeout

  // 2. Kiểm tra xem cấu hình kết nối hiện tại có giữ nguyên như trong DB không
  const isConnectionSameAsDB =
    provider === initialData.provider &&
    model === initialData.model &&
    baseUrl.trim() === (initialData.base_url || '').trim() &&
    apiKey.trim() === '' &&
    Number(timeout) === initialData.timeout

  // 3. Đã test connection thành công cho cấu hình kết nối hiện tại chưa
  const isConnectionTested =
    isConnectionSameAsDB ||
    (lastTestedConfig !== null &&
      lastTestedConfig.provider === provider &&
      lastTestedConfig.model === model &&
      lastTestedConfig.baseUrl === baseUrl.trim() &&
      lastTestedConfig.apiKey === apiKey.trim() &&
      lastTestedConfig.timeout === Number(timeout))

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      setting_type: settingType,
      provider,
      model,
      base_url: baseUrl.trim() || null,
      temperature: config.showTemperature ? Number(temperature) || 0.2 : 0.0,
      max_tokens: settingType === 'embedding' ? 1 : 1000,
      timeout: Number(timeout) || 30,
      is_enabled: isEnabled,
      monthly_budget_limit: Number(monthlyBudgetLimit) || config.defaultBudget,
      budget_reset_day: Number(budgetResetDay) || 1,
    }

    if (apiKey.trim()) {
      payload.api_key = apiKey.trim()
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSave}>
      <Card className="border border-border/80 shadow-xs bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold text-foreground/90 flex items-center gap-1.5">
            {config.icon}
            {config.title}
          </CardTitle>
          <CardDescription className="text-xs">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cảnh báo API Key chưa cấu hình */}
          {initialData.api_key_masked === null && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs flex gap-2.5 items-start dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">API Key chưa cấu hình hoặc không hoạt động. Hệ thống AI đang tạm tắt.</p>
                <p className="opacity-90 leading-relaxed text-[11px]">
                  Vui lòng cung cấp Google Gemini API Key hợp lệ và bấm Lưu Cấu Hình để kích hoạt.
                </p>
              </div>
            </div>
          )}

          {/* Trạng thái Bật/Tắt */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-dashed">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-foreground/80">Kích hoạt {settingType === 'embedding' ? 'AI Embedding' : 'Trợ lý AI'}</Label>
              <p className="text-[10px] text-muted-foreground">
                {settingType === 'embedding'
                  ? 'Bật hoặc tắt tính năng embedding/vector search.'
                  : 'Bật hoặc tắt toàn bộ các tính năng AI sinh văn bản trên CMS.'}
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nhà cung cấp */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Nhà cung cấp</Label>
              <Select value={provider} onValueChange={setProvider} disabled>
                <SelectTrigger className="w-full h-9 text-xs bg-muted/50 cursor-not-allowed">
                  <SelectValue placeholder="Chọn nhà cung cấp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini (Google)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={initialData.api_key_masked || '••••••••••••••••'}
                className="h-9 text-xs"
              />
              <p className="text-[9px] text-muted-foreground leading-none">
                Khóa API được mã hóa bảo mật. Chỉ nhập để thay đổi hoặc cập nhật khóa mới.
              </p>
            </div>
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground/80">
                {settingType === 'embedding' ? 'Model Embedding' : 'Model AI'}
              </Label>
              <AiPricingDialog data={pricings} isLoading={isPricingLoading} />
            </div>
            <Select value={model} onValueChange={handleModelChange} disabled={isTesting || isSubmitting}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder={settingType === 'embedding' ? 'Chọn Model Embedding' : 'Chọn Model AI'} />
              </SelectTrigger>
              <SelectContent>
                {/* Luôn render model hiện tại ở đầu */}
                {model && (
                  <SelectItem value={model}>{model}</SelectItem>
                )}
                {availableModels
                  .filter((m_name) => m_name !== model)
                  .map((m_name) => (
                    <SelectItem key={m_name} value={m_name}>{m_name}</SelectItem>
                  ))}
                {availableModels.length === 0 && (
                  <>
                    {initialData.model && initialData.model !== model && (
                      <SelectItem value={initialData.model}>{initialData.model} (Hiện tại)</SelectItem>
                    )}
                    {config.fallbackModels
                      .filter((fm) => fm !== model)
                      .map((fm) => (
                        <SelectItem key={fm} value={fm}>{fm} (Gợi ý)</SelectItem>
                      ))}
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Hiển thị đơn giá model được chọn */}
            {(inputPrice !== undefined || outputPrice !== undefined) && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/40 px-2 py-1 rounded-md border border-dashed">
                <Coins className="h-3 w-3 text-emerald-600 shrink-0" />
                <span className="font-semibold text-foreground/80">Đơn giá:</span>
                <span>Input: <strong className="text-foreground/90 font-mono">${(inputPrice ?? 0).toFixed(4)}</strong> / 1M</span>
                <span>•</span>
                <span>Output: <strong className="text-foreground/90 font-mono">${(outputPrice ?? 0).toFixed(4)}</strong> / 1M</span>
              </div>
            )}
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/80">Base URL (Không bắt buộc)</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://generativelanguage.googleapis.com (để trống nếu dùng mặc định)"
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ngân sách hàng tháng */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Hạn mức hàng tháng (USD)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={monthlyBudgetLimit}
                onChange={(e) => setMonthlyBudgetLimit(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Ngày Reset ngân sách */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Ngày tự động reset ngân sách</Label>
              <Input
                type="number"
                min="1"
                max="28"
                value={budgetResetDay}
                onChange={(e) => setBudgetResetDay(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[9px] text-muted-foreground">Hệ thống reset chi tiêu về 0 vào ngày này mỗi tháng.</p>
            </div>
          </div>

          {/* Temperature & Timeout — chỉ hiện cho text */}
          {config.showTemperature && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Độ sáng tạo (Temperature)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="h-9 text-xs"
                />
                <p className="text-[9px] text-muted-foreground">Giá trị thấp giúp đầu ra ổn định và nhất quán (khuyên dùng: 0.2).</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/80">Thời gian chờ (Timeout giây)</Label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={timeout}
                  onChange={(e) => setTimeoutVal(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          {!config.showTemperature && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Thời gian chờ (Timeout giây)</Label>
              <Input
                type="number"
                min="5"
                max="120"
                value={timeout}
                onChange={(e) => setTimeoutVal(e.target.value)}
                className="h-9 text-xs w-full md:w-1/2"
              />
            </div>
          )}

          {/* Hiển thị kết quả Test Connection */}
          {testResult && (
            <div className={`p-3 rounded-lg border text-xs flex gap-2 items-start ${testResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
              }`}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.details && (
                  <pre className="text-[10px] opacity-80 leading-relaxed font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                    Chi tiết lỗi: {testResult.details}
                  </pre>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t p-4 bg-muted/10">
          <Button
            id="ai-config-test-btn"
            type="button"
            variant="outline"
            disabled={isTesting || isSubmitting}
            onClick={handleTestConnection}
            className="flex items-center gap-1.5 h-9 text-xs font-medium cursor-pointer"
            title={`Kiểm tra kết nối (${isMac ? 'Ctrl+⌥+T' : 'Ctrl+Alt+T'})`}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang kết nối...
              </>
            ) : (
              <>
                ⚡ Kiểm tra kết nối <kbd className="hidden sm:inline-block px-1 py-0.2 text-[8px] font-mono bg-muted border rounded shadow-xs ml-1 font-bold">{isMac ? 'Ctrl+⌥+T' : 'Ctrl+Alt+T'}</kbd>
              </>
            )}
          </Button>

          <Button
            id="ai-config-submit-btn"
            type="submit"
            disabled={isSubmitting || isTesting || !hasChanges || !isConnectionTested}
            className="flex items-center gap-1.5 h-9 text-xs font-medium cursor-pointer"
            title={
              !hasChanges
                ? 'Không có thay đổi nào để lưu'
                : !isConnectionTested
                ? 'Vui lòng nhấn Kiểm tra kết nối thành công trước khi lưu'
                : `Lưu cấu hình (${isMac ? '⌘S' : 'Ctrl+S'})`
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                Lưu Cấu Hình <kbd className="hidden sm:inline-block px-1 py-0.2 text-[8px] bg-primary-foreground/20 border border-primary-foreground/30 rounded ml-1 font-bold">{isMac ? '⌘S' : 'Ctrl+S'}</kbd>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
