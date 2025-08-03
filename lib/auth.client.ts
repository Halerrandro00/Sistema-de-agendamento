"use client"

import { createBrowserClient } from "./supabase"

const supabase = createBrowserClient()

export interface User {
  id: string
  email: string
  full_name: string
  user_type: "admin" | "doctor" | "patient"
  phone?: string
}

export const authClient = {
  async signInWithEmail(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password })
  },

  async signInWithGoogle() {
    return await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  },

  async signUp(email: string, password: string, userData: Partial<User>) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })
  },

  async signOut() {
    return await supabase.auth.signOut()
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return profile
  },
}
