"use client"

import type React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [userType, setUserType] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(isLogin ? "Login realizado com sucesso!" : "Cadastro realizado com sucesso!")
        if (isLogin) {
          // Redirecionar para dashboard
          router.push("/dashboard")
        } else {
          setIsLogin(true)
        }
      } else {
        // O backend envia { errors: [...] } para erros de validação
        // ou { error: '...' } para outros erros.
        if (result.errors && Array.isArray(result.errors)) {
          const errorMessages = result.errors.map((err: any) => err.message).join("\n")
          setMessage(errorMessages)
        } else {
          setMessage(result.error || "Erro na operação")
        }
      }
    } catch (error) {
      setMessage("Erro de conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Login" : "Cadastro"} - Sistema Médico
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Entre com suas credenciais" : "Crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="seu@email.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required placeholder="Sua senha" />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input id="full_name" name="full_name" type="text" required placeholder="Seu nome completo" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" type="text" placeholder="(11) 99999-9999" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_type">Tipo de Usuário</Label>
                  <Select name="user_type" value={userType} onValueChange={setUserType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Paciente</SelectItem>
                      <SelectItem value="doctor">Médico</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userType === "doctor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialty">Especialidade</Label>
                      <Input id="specialty" name="specialty" type="text" required placeholder="Ex: Cardiologia" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="crm">CRM</Label>
                      <Input id="crm" name="crm" type="text" required placeholder="123456/SP" />
                    </div>
                  </>
                )}
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
            </Button>

            {isLogin && (
              <Button type="button" variant="outline" className="w-full bg-transparent">
                Entrar com Google
              </Button>
            )}
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded ${
                message.includes("sucesso") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-4 text-center">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:text-blue-800">
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
