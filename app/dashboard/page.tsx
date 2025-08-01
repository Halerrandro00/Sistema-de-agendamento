"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface User {
  id: string
  full_name: string
  email: string
  user_type: "admin" | "doctor" | "patient"
}

interface Appointment {
  id: string
  appointment_date: string
  status: string
  doctor: {
    profiles: { full_name: string }
    specialty: string
  }
  patient: {
    profiles: { full_name: string }
  }
  notes?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleMessage, setScheduleMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      try {
        // 1. Buscar dados do usuário logado
        const userResponse = await fetch("/api/me")
        if (!userResponse.ok) throw new Error("Falha ao buscar dados do usuário")
        const userData = await userResponse.json()
        setUser(userData.user)

        // 2. Buscar consultas
        const response = await fetch("/api/appointments")
        if (!response.ok) throw new Error("Falha ao buscar consultas")
        const data = await response.json()
        setAppointments(data.appointments || [])
      } catch (error) {
        console.error("Erro ao carregar consultas:", error)
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
      // Opcional: recarregar a lista de consultas
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
                                Dr. {appointment.doctor.profiles.full_name} - {appointment.doctor.specialty}
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
                <p className="text-gray-500">Lista de médicos será carregada aqui.</p>
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
                    <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700">
                      ID do Médico
                    </label>
                    <Input id="doctor_id" name="doctor_id" type="text" required placeholder="Insira o ID do médico" />
                    <p className="text-xs text-gray-500 mt-1">
                      (Em uma aplicação real, isso seria um seletor com a lista de médicos)
                    </p>
                  </div>
                  <div>
                    <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700">
                      Data e Hora
                    </label>
                    <Input id="appointment_date" name="appointment_date" type="datetime-local" required />
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
