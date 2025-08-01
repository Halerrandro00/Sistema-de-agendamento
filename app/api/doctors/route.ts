import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requirePermission } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    requirePermission(profile.user_type, "doctors", "read")

    const { data: doctors, error } = await supabase.from("doctors").select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        )
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ doctors })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
