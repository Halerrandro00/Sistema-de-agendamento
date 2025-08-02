import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { validators } from "@/lib/validation"
import { requirePermission } from "@/lib/permissions"

import { cookies } from "next/headers"
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(cookies())
    const { searchParams } = new URL(request.url)

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

    requirePermission(profile.user_type, "appointments", "read")

    let query = supabase.from("appointments").select(`
        *,
        doctors:doctor_id (
          id,
          specialty,
          crm,
          profiles:user_id (full_name)
        ),
        patients:patient_id (
          id,
          profiles:user_id (full_name, email)
        )
      `)

    // Filtrar por tipo de usuário
    if (profile.user_type === "doctor") {
      const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", user.id).single()

      if (doctor) {
        query = query.eq("doctor_id", doctor.id)
      }
    } else if (profile.user_type === "patient") {
      const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).single()

      if (patient) {
        query = query.eq("patient_id", patient.id)
      }
    }

    // Filtros opcionais
    const doctorId = searchParams.get("doctor_id")
    const patientId = searchParams.get("patient_id")
    const status = searchParams.get("status")
    const date = searchParams.get("date")

    if (doctorId) query = query.eq("doctor_id", doctorId)
    if (patientId) query = query.eq("patient_id", patientId)
    if (status) query = query.eq("status", status)
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      query = query.gte("appointment_date", startDate.toISOString()).lt("appointment_date", endDate.toISOString())
    }

    const { data: appointments, error } = await query.order("appointment_date", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ appointments })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(cookies())

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

    requirePermission(profile.user_type, "appointments", "create")

    const appointmentData = await request.json()

    // Se for paciente, definir automaticamente o patient_id
    if (profile.user_type === "patient") {
      const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).single()

      if (patient) {
        appointmentData.patient_id = patient.id
      } else {
        // Este erro indica que o processo de cadastro não criou um registro na tabela 'patients'.
        return NextResponse.json({ error: "Perfil de paciente não encontrado. O cadastro do usuário pode estar incompleto." }, { status: 404 })
      }
    }

    // Validação de dados (agora que patient_id está garantido para pacientes)
    const errors = validators.validateAppointment(appointmentData)
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    // Verificar se o horário está disponível
    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", appointmentData.doctor_id)
      .eq("appointment_date", appointmentData.appointment_date)
      .eq("status", "scheduled")
      .single()

    if (existingAppointment) {
      return NextResponse.json(
        {
          error: "Horário não disponível",
        },
        { status: 400 },
      )
    }

    const { data: appointment, error } = await supabase.from("appointments").insert(appointmentData).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Criar notificação para o paciente (log interno)
    const { data: patientProfile } = await supabase.from("patients").select("user_id").eq("id", appointment.patient_id).single()
    if (patientProfile) {
      await supabase.from("notifications").insert({
        user_id: patientProfile.user_id,
        message: `Sua consulta para ${new Date(appointment.appointment_date).toLocaleString("pt-BR")} foi agendada.`,
      })
    }

    return NextResponse.json({
      message: "Consulta agendada com sucesso",
      appointment,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
