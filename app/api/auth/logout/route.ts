import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const supabase = createServerClient(cookies())

  // Isso invalidará o token do usuário e limpará o cookie de sessão
  await supabase.auth.signOut()

  return NextResponse.json({ message: "Logout realizado com sucesso" })
}
