import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email e senha são obrigatórios" },
      { status: 400 },
    )
  }

  // É crucial usar o createServerClient aqui para que os cookies de sessão
  // sejam definidos corretamente na resposta para o navegador.
  const supabase = createServerClient(cookies())

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
  }

  return NextResponse.json({ message: "Login realizado com sucesso" })
}
