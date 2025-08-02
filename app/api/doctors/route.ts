import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createServerClient(cookies())
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Qualquer usuário autenticado pode ver a lista de médicos.
    // A query busca em 'doctors' e junta com 'profiles' para pegar o nome.
    const { data: doctors, error } = await supabase.from("doctors").select(`
        id,
        specialty,
        crm,
        profiles (
          full_name,
          email,
          phone
        )
      `)

    if (error) {
      throw error
    }

    return NextResponse.json({ doctors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}