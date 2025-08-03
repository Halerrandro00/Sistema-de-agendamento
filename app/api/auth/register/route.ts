import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"

export async function POST(request: Request) {
  const { email, password, full_name, phone } = await request.json()

  // Validação básica de entrada
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Email, senha e nome completo são obrigatórios." }, { status: 400 })
  }

  // Usamos o cliente com role de admin para ter permissão de criar usuários e perfis.
  const supabaseAdmin = createAdminClient()

  // 1. Criar o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name, // Adiciona o nome aos metadados do usuário no Auth
      },
    },
  })

  if (authError || !authData.user) {
    console.error("Erro ao criar usuário no Auth:", authError)
    return NextResponse.json({ error: authError?.message || "Não foi possível registrar o usuário." }, { status: 400 })
  }

  const user = authData.user

  // 2. Criar o perfil do usuário na tabela 'profiles' (O PASSO QUE FALTAVA)
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: user.id,
    email: user.email!,
    full_name,
    phone,
    user_type: "patient", // Assumindo que novos registros são sempre de pacientes
  })

  if (profileError) {
    console.error("Erro ao criar perfil do usuário:", profileError)
    // Se a criação do perfil falhar, deletamos o usuário do Auth para manter a consistência.
    await supabaseAdmin.auth.admin.deleteUser(user.id)
    return NextResponse.json({ error: "Falha ao criar o perfil do usuário." }, { status: 500 })
  }

  // 3. Criar a entrada correspondente na tabela 'patients'
  const { error: patientError } = await supabaseAdmin.from("patients").insert({ user_id: user.id })

  if (patientError) {
    console.error("Erro ao criar registro de paciente:", patientError)
    // Rollback: se falhar, deletamos o perfil e o usuário do Auth
    await supabaseAdmin.from("profiles").delete().eq("id", user.id)
    await supabaseAdmin.auth.admin.deleteUser(user.id)
    return NextResponse.json({ error: "Falha ao criar o registro de paciente." }, { status: 500 })
  }

  return NextResponse.json({
    message: "Usuário registrado com sucesso!",
    user,
  })
}