import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { validators } from "@/lib/validation"

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  let userId: string | undefined = undefined

  try {
    const { email, password, full_name, user_type, phone, specialty, crm } = await request.json()

    // Validação de dados
    const errors = []

    const emailError = validators.email(email)
    const passwordError = validators.password(password)
    const nameError = validators.required(full_name, "Nome completo")

    if (emailError) errors.push(emailError)
    if (passwordError) errors.push(passwordError)
    if (nameError) errors.push(nameError)

    if (!["admin", "doctor", "patient"].includes(user_type)) {
      errors.push({ field: "user_type", message: "Tipo de usuário inválido" })
    }

    if (user_type === "doctor") {
      const crmError = validators.crm(crm)
      const specialtyError = validators.required(specialty, "Especialidade")
      if (crmError) errors.push(crmError)
      if (specialtyError) errors.push(specialtyError)
    }

    const phoneError = validators.phone(phone)
    if (phoneError) errors.push(phoneError)

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    // 1. Criar usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Em produção, considere enviar um email de confirmação
    })

    if (authError) {
      if (authError.message.includes("already exists")) {
        return NextResponse.json({ error: "Usuário com este email já existe." }, { status: 409 })
      }
      throw new Error(`Erro de autenticação: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error("Falha ao criar usuário, nenhum dado de usuário retornado.")
    }
    userId = authData.user.id // Armazena o ID para poder deletar em caso de erro

    // 2. Criar o perfil correspondente na tabela `profiles`
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email,
      full_name,
      user_type,
      phone,
    })

    if (profileError) {
      throw new Error(`Falha ao criar perfil: ${profileError.message}`)
    }

    // 3. Criar o registro específico do tipo de usuário (paciente ou médico)
    if (user_type === "patient") {
      const { error: patientError } = await supabase.from("patients").insert({ user_id: userId })
      if (patientError) {
        throw new Error(`Falha ao criar registro de paciente: ${patientError.message}`)
      }
    } else if (user_type === "doctor") {
      const { error: doctorError } = await supabase.from("doctors").insert({
        user_id: userId,
        specialty,
        crm,
      })
      if (doctorError) {
        throw new Error(`Falha ao criar registro de médico: ${doctorError.message}`)
      }
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: authData.user,
    })
  } catch (error: any) {
    // Se qualquer passo após a criação do usuário falhar, deleta o usuário da autenticação para evitar inconsistências.
    if (userId) {
      await supabase.auth.admin.deleteUser(userId)
    }
    console.error("Erro no registro:", error) // Adicionar log para depuração
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
