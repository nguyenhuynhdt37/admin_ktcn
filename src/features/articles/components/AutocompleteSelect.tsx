import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Button } from '@/shared/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/lib/utils'

export interface AutocompleteOption {
  id: string
  label: string
  color?: string
  [key: string]: any
}

interface AutocompleteSelectProps {
  placeholder?: string
  emptyMessage?: string
  searchPlaceholder?: string
  onSearch?: (query: string) => Promise<AutocompleteOption[]>
  options?: AutocompleteOption[]
  value: any // string | string[]
  onChange: (value: any) => void
  isMulti?: boolean
  multiple?: boolean
  renderOption?: (option: AutocompleteOption) => React.ReactNode
  disabled?: boolean
  onCreateOption?: (query: string) => Promise<AutocompleteOption>
}

export function AutocompleteSelect({
  placeholder = 'Chọn...',
  emptyMessage = 'Không tìm thấy kết quả',
  searchPlaceholder = 'Tìm kiếm...',
  onSearch,
  options: staticOptions,
  value,
  onChange,
  isMulti = false,
  multiple = false,
  renderOption,
  disabled = false,
  onCreateOption,
}: AutocompleteSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [options, setOptions] = React.useState<AutocompleteOption[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isCreatingOption, setIsCreatingOption] = React.useState(false)
  
  const actualIsMulti = isMulti || multiple

  // Cache to store loaded options mapping id -> option details
  const [selectedOptionsMap, setSelectedOptionsMap] = React.useState<Record<string, AutocompleteOption>>({})

  // Update selectedOptionsMap when staticOptions change
  React.useEffect(() => {
    if (staticOptions) {
      const newMap: Record<string, AutocompleteOption> = { ...selectedOptionsMap }
      staticOptions.forEach((opt) => {
        newMap[opt.id] = opt
      })
      setSelectedOptionsMap(newMap)
    }
  }, [staticOptions])

  // Debounced search logic or local filtering
  React.useEffect(() => {
    if (staticOptions) {
      const filtered = staticOptions.filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase())
      )
      setOptions(filtered)
    } else if (onSearch) {
      let active = true
      
      const fetchOptions = async () => {
        setIsLoading(true)
        try {
          const results = await onSearch(query)
          if (active) {
            setOptions(results)
            // Update selectedOptionsMap to show label for initially selected item
            results.forEach((opt) => {
              setSelectedOptionsMap((prev) => ({ ...prev, [opt.id]: opt }))
            })
          }
        } catch (err) {
          console.error('Error fetching autocomplete options:', err)
        } finally {
          if (active) setIsLoading(false)
        }
      }

      const timer = setTimeout(() => {
        fetchOptions()
      }, query ? 300 : 0)

      return () => {
        active = false
        clearTimeout(timer)
      }
    }
  }, [query, onSearch, staticOptions, open])

  // Extract selected list to show on trigger button
  const selectedList = React.useMemo(() => {
    if (actualIsMulti) {
      const ids = Array.isArray(value) ? value : []
      return ids.map((id) => selectedOptionsMap[id] || { id, label: id })
    } else {
      if (!value) return []
      return [selectedOptionsMap[value] || { id: value, label: value }]
    }
  }, [value, actualIsMulti, selectedOptionsMap])

  const handleSelect = (option: AutocompleteOption) => {
    setSelectedOptionsMap((prev) => ({ ...prev, [option.id]: option }))

    if (actualIsMulti) {
      const currentValues = Array.isArray(value) ? value : []
      if (currentValues.includes(option.id)) {
        onChange(currentValues.filter((id) => id !== option.id))
      } else {
        onChange([...currentValues, option.id])
      }
    } else {
      onChange(value === option.id ? null : option.id)
      setOpen(false)
    }
  }

  const handleRemove = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (actualIsMulti) {
      const currentValues = Array.isArray(value) ? value : []
      onChange(currentValues.filter((id) => id !== optionId))
    } else {
      onChange(null)
    }
  }

  const handleCreateNewOption = async () => {
    if (!onCreateOption || !query.trim()) return

    setIsCreatingOption(true)
    try {
      const newOption = await onCreateOption(query.trim())
      setSelectedOptionsMap((prev) => ({ ...prev, [newOption.id]: newOption }))
      
      if (actualIsMulti) {
        const currentValues = Array.isArray(value) ? value : []
        if (!currentValues.includes(newOption.id)) {
          onChange([...currentValues, newOption.id])
        }
      } else {
        onChange(newOption.id)
        setOpen(false)
      }
      setQuery('')
    } catch (err) {
      console.error('Failed to create option in autocomplete:', err)
    } finally {
      setIsCreatingOption(false)
    }
  }

  // Check if current search query already exists in options
  const queryExists = options.some(
    (opt) => opt.label.toLowerCase() === query.trim().toLowerCase()
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal min-h-9 h-auto py-1 px-3 border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground text-left flex flex-wrap gap-1 cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {selectedList.length > 0 ? (
            <div className="flex flex-wrap gap-1 items-center max-w-[90%]">
              {actualIsMulti ? (
                selectedList.map((item) => (
                  <Badge
                    key={item.id}
                    variant="secondary"
                    className="flex items-center gap-1 py-0.5 px-2 text-xs font-normal"
                    style={
                      item.color
                        ? { backgroundColor: `${item.color}15`, color: item.color, borderColor: `${item.color}30` }
                        : undefined
                    }
                  >
                    {item.label}
                    {!disabled && (
                      <X
                        className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                        onClick={(e) => handleRemove(item.id, e)}
                      />
                    )}
                  </Badge>
                ))
              ) : (
                <span className="truncate text-sm text-foreground">
                  {selectedList[0].label}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm truncate">{placeholder}</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading && options.length === 0 && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Đang tìm kiếm...
              </div>
            )}
            
            {!isLoading && options.length === 0 && !onCreateOption && (
              <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </CommandEmpty>
            )}

            {/* Quick create option item when query not found */}
            {onCreateOption && query.trim() && !queryExists && (
              <div className="p-1 border-b border-border/40 bg-muted/20">
                <button
                  type="button"
                  disabled={isCreatingOption || disabled}
                  onClick={handleCreateNewOption}
                  className="w-full flex items-center justify-start gap-1.5 py-1.5 px-2.5 text-xs text-primary font-semibold hover:bg-primary/5 rounded-md transition-colors cursor-pointer text-left focus:outline-hidden disabled:opacity-50"
                >
                  {isCreatingOption ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span>+</span>
                  )}
                  Tạo nhanh tag "{query}"
                </button>
              </div>
            )}

            <CommandGroup>
              {options.map((option) => {
                const isSelected = actualIsMulti
                  ? (Array.isArray(value) ? value : []).includes(option.id)
                  : value === option.id

                return (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => handleSelect(option)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex-1 truncate">
                      {renderOption ? renderOption(option) : option.label}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

