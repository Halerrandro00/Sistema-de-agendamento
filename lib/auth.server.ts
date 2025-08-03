import { createServerClient } from "./supabase"
import { cookies } from "next/headers"

export const authServer = {
  async getCurrentUser() {
    const supabase = createServerClient(cookies())

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

  async signOut() {
    const supabase = createServerClient(cookies())
    return await supabase.auth.signOut()
  },
}
