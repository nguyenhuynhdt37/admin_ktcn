import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('https://api.example.com/v1'),
  MODE: z.enum(['development', 'production', 'test']).default('development'),
})

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
})

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format())
  throw new Error('Invalid environment variables')
}

export const env = parsed.data
