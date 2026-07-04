import { useEffect, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { FormLabel, FormDescription } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
]

interface ColorPickerFieldProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPickerField({
  value,
  onChange,
}: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [hexInput, setHexInput] = useState(value || '')

  useEffect(() => {
    setHexInput(value || '')
  }, [value])

  const handleHexInputChange = (text: string) => {
    const cleaned = text.startsWith('#') ? text : `#${text}`
    setHexInput(cleaned)
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      onChange(cleaned)
    }
  }

  return (
    <div className="space-y-2">
      <FormLabel className="text-xs font-semibold">Màu thẻ</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-2.5 w-full h-9 px-3 rounded-md border bg-background text-xs cursor-pointer",
              "hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <div
              className="h-5 w-5 rounded-full border border-border/60 shadow-xs shrink-0"
              style={{ backgroundColor: value || '#94a3b8' }}
            />
            <span className="font-mono text-muted-foreground">
              {value || 'Chọn màu...'}
            </span>
            <Palette className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-3 space-y-3" align="start">
          {/* Preset color grid */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Màu gợi ý</p>
            <div className="grid grid-cols-8 gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "h-6 w-6 rounded-full border-2 cursor-pointer transition-all hover:scale-110 active:scale-95",
                    value === color
                      ? "border-foreground shadow-md ring-2 ring-primary/30"
                      : "border-transparent hover:border-border"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color)
                    setHexInput(color)
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Hue spectrum picker (react-colorful) */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tùy chỉnh</p>
            <HexColorPicker
              color={value || '#3B82F6'}
              onChange={(newColor) => {
                onChange(newColor)
                setHexInput(newColor)
              }}
              style={{ width: '100%', height: '120px' }}
            />
          </div>

          {/* HEX input + preview */}
          <div className="flex items-center gap-2 pt-1">
            <div
              className="h-8 w-8 rounded-md border border-border/60 shadow-xs shrink-0"
              style={{ backgroundColor: value || '#94a3b8' }}
            />
            <div className="flex-1 relative">
              <Input
                value={hexInput}
                onChange={(e) => handleHexInputChange(e.target.value)}
                placeholder="#000000"
                className="text-xs font-mono h-8 pl-2 pr-2 bg-background uppercase"
                maxLength={7}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <FormDescription className="text-[10px] leading-relaxed text-muted-foreground/80">
        Mã màu HEX dùng để phân biệt thẻ trên giao diện.
      </FormDescription>
    </div>
  )
}
