type StorageKeys = {
  auth_token: string
  refresh_token: string
  theme: 'light' | 'dark'
  user: {
    id: string
    email: string
    name: string
    role?: string
  }
}

export const storage = {
  get<K extends keyof StorageKeys>(key: K): StorageKeys[K] | null {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return null
    }
  },

  set<K extends keyof StorageKeys>(key: K, value: StorageKeys[K]): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  },

  remove<K extends keyof StorageKeys>(key: K): void {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  },

  clear(): void {
    try {
      window.localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  },
}
