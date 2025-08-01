import { type CookieOptions, createServerClient as _createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

/**
 * Cria um cliente Supabase para uso em Componentes do Servidor,
 * Rotas de API e Ações do Servidor, usando a sessão do usuário.
 */
export const createServerClient = (cookieStore: ReturnType<typeof cookies>) => {
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignorado em Server Components de leitura
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            // Ignorado em Server Components de leitura
          }
        },
      },
    },
  )
}

/**
 * Cria um cliente Supabase com privilégios de administrador para uso
 * em rotas de API seguras.
 */
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

