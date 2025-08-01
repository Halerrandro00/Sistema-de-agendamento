import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const supabase = createServerClient(cookies())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
  }

  // Combina os dados de autenticação com os do perfil
  return NextResponse.json({ user: { ...user, ...profile } })
}

