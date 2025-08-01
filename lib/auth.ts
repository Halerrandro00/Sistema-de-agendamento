import { supabase } from "./supabase"

export interface User {
  id: string
  email: string
  full_name: string
  user_type: "admin" | "doctor" | "patient"
  phone?: string
}

export const authService = {
  // Autenticação por email/senha
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Autenticação OAuth (Google)
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    return profile
  },
}
