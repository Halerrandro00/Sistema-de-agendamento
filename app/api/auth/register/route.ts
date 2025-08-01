import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase"
import { validators } from "@/lib/validation"

export async function POST(request: NextRequest) {
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

    const supabase = createAdminClient()

    // Criar usuário
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Criar perfil
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email,
      full_name,
      user_type,
      phone,
    })

    if (profileError) {
      // Tenta limpar o usuário criado na autenticação se o perfil falhar
      if (authData.user) {
        await supabase.auth.admin.deleteUser(authData.user.id)
      }
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Se for médico, criar registro específico
    if (user_type === "doctor") {
      const { error: doctorError } = await supabase.from("doctors").insert({
        user_id: authData.user.id,
        specialty,
        crm,
      })

      if (doctorError) {
        // Tenta limpar o usuário criado na autenticação
        if (authData.user) {
          await supabase.auth.admin.deleteUser(authData.user.id)
        }
        return NextResponse.json({ error: doctorError.message }, { status: 400 })
      }
    }

    // Se for paciente, criar registro específico
    if (user_type === "patient") {
      const { error: patientError } = await supabase.from("patients").insert({
        user_id: authData.user.id,
      })

      if (patientError) {
        // Tenta limpar o usuário criado na autenticação
        if (authData.user) {
          await supabase.auth.admin.deleteUser(authData.user.id)
        }
        return NextResponse.json({ error: patientError.message }, { status: 400 })
      }
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: authData.user,
    })
  } catch (error) {
    console.error("Erro no registro:", error) // Adicionar log para depuração
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
