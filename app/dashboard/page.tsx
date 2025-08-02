"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface User {
  id: string
  full_name: string
  email: string
  user_type: "admin" | "doctor" | "patient"
}

interface Doctor {
  id: string
  specialty: string
  crm: string
  profiles: {
    full_name: string
    email: string
    phone: string
  }
}
interface Appointment {
  id: string
  appointment_date: string
  status: string
  doctors: {
    profiles: { full_name: string } | null
    specialty: string
  } | null
  patients: { // A relação 'patients' pode ser nula
    profiles: { full_name: string } | null // e o perfil dentro dela também
  } | null
  notes?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleMessage, setScheduleMessage] = useState("")
  const router = useRouter()

  const generateFakeSlots = () => {
    const slots = []
    const today = new Date()
    for (let i = 1; i <= 5; i++) {
      // Gera horários para os próximos 5 dias mocados...
      const day = new Date(today)
      day.setDate(today.getDate() + i)
      const dayString = day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })

      ;["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].forEach((time) => {
        const [hour, minute] = time.split(":")
        const slotDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), parseInt(hour), parseInt(minute))
        slots.push({
          value: slotDate.toISOString(), // esse aqui é o Valor enviado para a API
          label: `${dayString} - ${time}`, // Texto exibido para o usuário logado...
        })
      })
    }
    return slots
  }

  const fakeAvailableSlots = generateFakeSlots()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // 1. Buscar dados do usuário logado
        const userResponse = await fetch("/api/me")
        if (!userResponse.ok) {
          throw new Error("Sessão inválida. Por favor, faça login novamente.")
        }
        const userData = await userResponse.json()
        setUser(userData.user)

        // 2. Buscar consultas e médicos em paralelo
        const [appointmentsRes, doctorsRes] = await Promise.all([fetch("/api/appointments"), fetch("/api/doctors")])

        if (!appointmentsRes.ok) throw new Error("Falha ao buscar consultas")
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData.appointments || [])

        if (!doctorsRes.ok) throw new Error("Falha ao buscar médicos")
        const doctorsData = await doctorsRes.json()
        setDoctors(doctorsData.doctors || [])
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
        // Se algo falhar (ex: sessão expirada), redireciona para o login
        // A mensagem de erro não seria visível pois o usuário é redirecionado imediatamente.
        // Apenas redirecionamos para a página de login.
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const handleScheduleAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setScheduleMessage("")

    const formData = new FormData(e.currentTarget)
    const data = {
      doctor_id: formData.get("doctor_id"),
      appointment_date: formData.get("appointment_date"),
      notes: formData.get("notes"),
    }

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Falha ao agendar consulta.")
      }

      setScheduleMessage("Consulta agendada com sucesso!")
      // Opcional: recarregar a lista de consultas - função que vou ativar depois...
      // fetchData()
    } catch (error: any) {
      console.error("Erro no agendamento:", error)
      setScheduleMessage(error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Agendada"
      case "completed":
        return "Concluída"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Agendamento Médico</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Olá, {user?.full_name}</span>
              <Button onClick={handleLogout} variant="outline">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appointments">Consultas</TabsTrigger>
            <TabsTrigger value="doctors">Médicos</TabsTrigger>
            <TabsTrigger value="schedule">Agendar</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Consultas</CardTitle>
                <CardDescription>Visualize e gerencie suas consultas</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <p className="text-gray-500">Nenhuma consulta encontrada.</p>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => {
                      const date = new Date(appointment.appointment_date)
                      return (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">
                                {date.toLocaleDateString("pt-BR")} às{" "}
                                {date.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </h3>
                              <p className="text-gray-600">
                                Dr. {appointment.doctors?.profiles?.full_name ?? "N/A"} - {appointment.doctors?.specialty ?? "N/A"}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}
                            >
                              {getStatusText(appointment.status)}
                            </span>
                          </div>
                          {appointment.notes && <p className="text-gray-600 text-sm">{appointment.notes}</p>}
                          {appointment.status === "scheduled" && (
                            <div className="mt-3 space-x-2">
                              <Button size="sm" variant="outline">
                                Reagendar
                              </Button>
                              <Button size="sm" variant="destructive">
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors">
            <Card>
              <CardHeader>
                <CardTitle>Médicos Disponíveis</CardTitle>
                <CardDescription>Lista de médicos cadastrados no sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {doctors.length === 0 ? (
                  <p className="text-gray-500">Nenhum médico encontrado.</p>
                ) : (
                  <div className="space-y-4">
                    {doctors.map((doctor) => (
                      <div key={doctor.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{doctor.profiles.full_name}</h3>
                          <p className="text-sm text-gray-600">{doctor.specialty}</p>
                          <p className="text-xs text-gray-500">CRM: {doctor.crm}</p>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          Ver Agenda
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Agendar Nova Consulta</CardTitle>
                <CardDescription>Selecione um médico e horário disponível</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScheduleAppointment} className="space-y-4">
                  <div>
                    <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Médico
                    </label>
                    <Select name="doctor_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um médico..." />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.profiles.full_name} - {doctor.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700">
                      Data e Hora
                    </label>
                    <Select name="appointment_date" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um horário..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fakeAvailableSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notas (Opcional)
                    </label>
                    <Input id="notes" name="notes" type="text" placeholder="Motivo da consulta..." />
                  </div>
                  <Button type="submit">Agendar</Button>
                  {scheduleMessage && <p className="mt-2 text-sm text-gray-600">{scheduleMessage}</p>}
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
