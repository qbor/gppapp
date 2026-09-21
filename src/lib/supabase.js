import { createClient } from '@supabase/supabase-js'

// Supabase 配置全部来自 .env，禁止硬编码
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 是否已配置 Supabase：未配置时应用以纯游客模式运行（数据存本机）
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
