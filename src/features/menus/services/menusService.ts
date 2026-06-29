import { httpClient } from '@/services/http/client'
import type { MenuListItem, MenuTreeResponse, MenuItemNode, MenuItemPayload } from '../types'

export const menusService = {
  // Lấy danh sách menus cấu hình (Header, Footer, Sidebar,...)
  list: async (): Promise<MenuListItem[]> => {
    const response = await httpClient.get('/menus')
    return response.data
  },

  // Lấy cấu trúc cây menu
  getTree: async (menuId: string): Promise<MenuTreeResponse> => {
    const response = await httpClient.get(`/menus/${menuId}/tree`)
    return response.data
  },

  // Batch update thứ tự và cấu trúc phân cấp của các menu items
  reorder: async (
    menuId: string,
    items: { id: string; parent_id: string | null; sort_order: number }[]
  ): Promise<{ success: boolean }> => {
    const response = await httpClient.put(`/menus/${menuId}/reorder`, { items })
    return response.data
  },

  // Lấy chi tiết một Menu Item
  getItem: async (menuId: string, itemId: string): Promise<MenuItemNode> => {
    const response = await httpClient.get(`/menus/${menuId}/items/${itemId}`)
    return response.data
  },

  // Cập nhật cấu hình chi tiết của Menu Item
  updateItem: async (
    menuId: string,
    itemId: string,
    payload: Partial<MenuItemPayload>
  ): Promise<MenuItemNode> => {
    const response = await httpClient.put(`/menus/${menuId}/items/${itemId}`, payload)
    return response.data
  },

  // Tạo mới một Menu Item
  createItem: async (
    menuId: string,
    payload: Partial<MenuItemPayload> & { parent_id?: string | null }
  ): Promise<MenuItemNode> => {
    const response = await httpClient.post(`/menus/${menuId}/items`, payload)
    return response.data
  },

  // Xóa một Menu Item
  deleteItem: async (menuId: string, itemId: string): Promise<{ success: boolean }> => {
    const response = await httpClient.delete(`/menus/${menuId}/items/${itemId}`)
    return response.data
  },

  // Lấy danh sách icon khuyên dùng
  getCuratedIcons: async (): Promise<{ category: string; icons: { name: string; code: string }[] }[]> => {
    const response = await httpClient.get('/menus/config/icons')
    return response.data
  },

  // Lấy danh sách danh mục từ backend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCategories: async (): Promise<any[]> => {
    const response = await httpClient.get('/categories')
    return response.data
  },
}
