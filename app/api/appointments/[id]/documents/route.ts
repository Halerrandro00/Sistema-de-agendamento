import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { requirePermission } from "@/lib/permissions"
import { validators } from "@/lib/validation"
import { cookies } from "next/headers"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createServerClient(cookies())
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    // Apenas médicos podem adicionar documentos
    requirePermission(profile.user_type, "documents", "create")

    const { document_name } = await request.json()
    const appointment_id = params.id

    // Validação do nome do documento
    const nameError = validators.required(document_name, "Nome do documento")
    if (nameError) {
      return NextResponse.json({ errors: [nameError] }, { status: 400 })
    }

    // Simulação: Apenas salvamos o nome do documento e uma URL falsa.
    const { data, error } = await supabase.from("documents").insert({
      appointment_id,
      file_name: document_name,
      file_url: `/documents/${appointment_id}/${document_name}.pdf`, // URL simulada
      uploaded_by: user.id,
    }).select()

    if (error) throw error

    return NextResponse.json({ message: "Documento adicionado", document: data[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
