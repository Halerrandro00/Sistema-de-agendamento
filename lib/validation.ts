export interface ValidationError {
  field: string
  message: string
}

export const validators = {
  email: (email: string): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return { field: "email", message: "Email é obrigatório" }
    if (!emailRegex.test(email)) return { field: "email", message: "Email inválido" }
    return null
  },

  password: (password: string): ValidationError | null => {
    if (!password) return { field: "password", message: "Senha é obrigatória" }
    if (password.length < 6) return { field: "password", message: "Senha deve ter pelo menos 6 caracteres" }
    return null
  },

  required: (value: string, fieldName: string): ValidationError | null => {
    if (!value || value.trim() === "") {
      return { field: fieldName, message: `${fieldName} é obrigatório` }
    }
    return null
  },

  phone: (phone: string): ValidationError | null => {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
    if (phone && !phoneRegex.test(phone)) {
      return { field: "phone", message: "Telefone deve estar no formato (11) 99999-9999" }
    }
    return null
  },

  crm: (crm: string): ValidationError | null => {
    const crmRegex = /^\d{4,6}\/[A-Z]{2}$/
    if (!crm) return { field: "crm", message: "CRM é obrigatório" }
    if (!crmRegex.test(crm)) return { field: "crm", message: "CRM deve estar no formato 123456/SP" }
    return null
  },

  validateAppointment: (data: any): ValidationError[] => {
    const errors: ValidationError[] = []

    if (!data.doctor_id) errors.push({ field: "doctor_id", message: "Médico é obrigatório" })
    if (!data.patient_id) errors.push({ field: "patient_id", message: "Paciente é obrigatório" })
    if (!data.appointment_date) errors.push({ field: "appointment_date", message: "Data da consulta é obrigatória" })

    if (data.appointment_date) {
      const appointmentDate = new Date(data.appointment_date)
      const now = new Date()
      if (appointmentDate <= now) {
        errors.push({ field: "appointment_date", message: "Data da consulta deve ser futura" })
      }
    }

    return errors
  },
}
