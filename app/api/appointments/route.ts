export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    requirePermission(user.user_type, "appointments", "create")

    const appointmentData = await request.json()

    const supabase = createAdminClient() // Aqui você usa a instância administrativa

    if (user.user_type === "patient") {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (patient) {
        appointmentData.patient_id = patient.id
      } else {
        return NextResponse.json(
          { error: "Perfil de paciente não encontrado. O cadastro do usuário pode estar incompleto." },
          { status: 404 }
        )
      }
    }

    const errors = validators.validateAppointment(appointmentData)
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", appointmentData.doctor_id)
      .eq("appointment_date", appointmentData.appointment_date)
      .eq("status", "scheduled")
      .single()

    if (existingAppointment) {
      return NextResponse.json({ error: "Horário não disponível" }, { status: 400 })
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert(appointmentData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const { data: patientProfile } = await supabase
      .from("patients")
      .select("user_id")
      .eq("id", appointment.patient_id)
      .single()

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
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
