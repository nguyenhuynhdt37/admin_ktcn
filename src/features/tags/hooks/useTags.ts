import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SortingState, RowSelectionState } from '@tanstack/react-table'
import { tagService } from '../services/tagService'
import { toast } from 'sonner'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { useSearchParams } from 'react-router'

export function useTags() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // UI states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    ids: string[]
  } | null>(null)

  // Filters from URL Search Params
  const pageParam = Number(searchParams.get('page'))
  const pageIndex = (pageParam && pageParam > 0) ? pageParam - 1 : 0
  const pageSize = Number(searchParams.get('limit')) || 10
  const isActiveFilter = searchParams.get('is_active') || 'all'
  const urlSearch = searchParams.get('search') || ''

  const [search, setSearch] = useState(urlSearch)
  const debouncedSearch = useDebounce(search, 400)

  // Chuẩn hóa trang nếu URL chứa page=0 hoặc nhỏ hơn 1
  useEffect(() => {
    const pParam = searchParams.get('page')
    if (pParam !== null) {
      const pageNum = Number(pParam)
      if (isNaN(pageNum) || pageNum < 1) {
        const params = new URLSearchParams(searchParams)
        params.set('page', '1')
        setSearchParams(params)
      }
    }
  }, [searchParams, setSearchParams])

  // Đồng bộ search term từ ô input lên URL sau khi debounced
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim())
    } else {
      params.delete('search')
    }
    params.set('page', '1') // reset trang khi tìm kiếm
    setSearchParams(params)
  }, [debouncedSearch])

  // Custom setters để đồng bộ filter lên URL
  const handleActiveFilterChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value !== 'all') {
      params.set('is_active', value)
    } else {
      params.delete('is_active')
    }
    params.set('page', '1')
    setSearchParams(params)
  }, [searchParams, setSearchParams])

  const handlePaginationChange = useCallback((value: any) => {
    const params = new URLSearchParams(searchParams)
    if (typeof value === 'function') {
      const next = value({ pageIndex, pageSize })
      params.set('page', String(next.pageIndex + 1))
      params.set('limit', String(next.pageSize))
    } else {
      params.set('page', String(value.pageIndex + 1))
      params.set('limit', String(value.pageSize))
    }
    setSearchParams(params)
  }, [pageIndex, pageSize, searchParams, setSearchParams])

  // Table states (Chỉ giữ rowSelection ở local, sorting client-side)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  // 1. Query: Fetch tag list
  const listParams = useMemo(() => {
    const is_active = isActiveFilter === 'active' ? true : isActiveFilter === 'inactive' ? false : null
    return {
      page: pageIndex + 1,
      limit: pageSize,
      search: debouncedSearch.trim() || null,
      is_active: is_active,
    }
  }, [pageIndex, pageSize, debouncedSearch, isActiveFilter])

  const {
    data: tagData,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['tags', listParams],
    queryFn: () => tagService.list(listParams),
  })

  const tags = tagData?.items || []
  const totalItems = tagData?.total || 0
  const totalPages = tagData?.pages || 1

  // 2. Query: Fetch details for the editing tag
  const { data: editingTag = null, isFetching: isFetchingDetail } = useQuery({
    queryKey: ['tags', editingTagId],
    queryFn: () => tagService.getDetail(editingTagId!),
    enabled: !!editingTagId,
  })

  // 3. Mutation: Create a new tag
  const createMutation = useMutation({
    mutationFn: tagService.create,
    onSuccess: () => {
      toast.success('Thêm thẻ mới thành công!')
      setIsFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      const msg = errorData?.message || 'Không thể tạo thẻ. Vui lòng thử lại.'
      toast.error(msg)
    },
  })

  // 4. Mutation: Update an existing tag
  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      tagService.update(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật thẻ thành công!')
      setEditingTagId(null)
      setIsFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      const msg = errorData?.message || 'Không thể cập nhật thẻ. Vui lòng thử lại.'
      toast.error(msg)
    },
  })

  // 5. Mutation: Toggle active status (Switch)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      tagService.updateStatus(id, { is_active }),
    onSuccess: () => {
      toast.success('Đã thay đổi trạng thái hoạt động thẻ')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Không thể thay đổi trạng thái thẻ.'
      toast.error(msg)
    },
  })

  // 6. Mutation: Delete tag
  const deleteMutation = useMutation({
    mutationFn: tagService.delete,
    onSuccess: () => {
      toast.success('Xóa thẻ thành công!')
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      const msg = errorData?.message || 'Không thể xóa thẻ. Vui lòng thử lại.'
      toast.error(msg)
    },
  })

  // 7. Bulk Mutations
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      return Promise.all(ids.map((id) => tagService.updateStatus(id, { is_active })))
    },
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái hàng loạt thành công!')
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái hàng loạt.'
      toast.error(msg)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return Promise.all(ids.map((id) => tagService.delete(id)))
    },
    onSuccess: () => {
      toast.success('Xóa hàng loạt thẻ thành công!')
      setRowSelection({})
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      const errorData = err?.response?.data?.error || err?.response?.data
      const msg = errorData?.message || 'Có lỗi xảy ra khi xóa hàng loạt.'
      toast.error(msg)
    },
  })

  // Handlers
  const handleEditClick = useCallback((id: string) => {
    setEditingTagId(id)
    setIsFormOpen(true)
  }, [])

  const handleAddClick = useCallback(() => {
    setEditingTagId(null)
    setIsFormOpen(true)
  }, [])

  const handleCancelForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingTagId(null)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormSubmit = useCallback((values: any) => {
    if (editingTagId) {
      updateMutation.mutate({ id: editingTagId, payload: values })
    } else {
      createMutation.mutate(values)
    }
  }, [editingTagId, updateMutation, createMutation])

  const handleToggleStatus = useCallback((id: string, active: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: active })
  }, [toggleStatusMutation])

  const handleDelete = useCallback((id: string) => {
    setDeleteTarget({ ids: [id] })
  }, [])

  // Selected IDs from table
  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .map((index) => tags[Number(index)]?.id)
      .filter(Boolean)
  }, [rowSelection, tags])

  // Bulk Handlers
  const handleBulkStatusChange = (active: boolean) => {
    if (selectedIds.length === 0) return
    bulkStatusMutation.mutate({ ids: selectedIds, is_active: active })
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    setDeleteTarget({ ids: selectedIds })
  }

  return {
    // States
    isFormOpen,
    setIsFormOpen,
    editingTagId,
    setEditingTagId,
    deleteTarget,
    setDeleteTarget,
    rowSelection,
    setRowSelection,
    sorting,
    setSorting,
    pagination: { pageIndex, pageSize },
    setPagination: handlePaginationChange,
    search,
    setSearch,
    isActiveFilter,
    setIsActiveFilter: handleActiveFilterChange,

    // Data
    tags,
    totalItems,
    totalPages,
    isLoading,
    isError,
    refetch,
    isFetching,
    editingTag,
    isFetchingDetail,
    selectedIds,

    // Mutations State
    isDeleting: deleteMutation.isPending || bulkDeleteMutation.isPending,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isBulkStatusPending: bulkStatusMutation.isPending,
    isBulkDeletePending: bulkDeleteMutation.isPending,

    // Handlers
    handleEditClick,
    handleAddClick,
    handleCancelForm,
    handleFormSubmit,
    handleToggleStatus,
    handleDelete,
    handleBulkStatusChange,
    handleBulkDelete,
    executeDelete: () => {
      if (deleteTarget) {
        if (deleteTarget.ids.length > 1) {
          bulkDeleteMutation.mutate(deleteTarget.ids)
        } else {
          deleteMutation.mutate(deleteTarget.ids[0])
        }
        setDeleteTarget(null)
      }
    }
  }
}
