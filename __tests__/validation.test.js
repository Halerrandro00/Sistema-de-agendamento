const { validators } = require("../lib/validation")

describe("Validation Functions", () => {
  describe("email validation", () => {
    it("should validate correct email", () => {
      const result = validators.email("test@example.com")
      expect(result).toBeNull()
    })

    it("should reject invalid email format", () => {
      const result = validators.email("invalid-email")
      expect(result).not.toBeNull()
      expect(result.field).toBe("email")
      expect(result.message).toBe("Email inválido")
    })

    it("should reject empty email", () => {
      const result = validators.email("")
      expect(result).not.toBeNull()
      expect(result.field).toBe("email")
      expect(result.message).toBe("Email é obrigatório")
    })
  })

  describe("password validation", () => {
    it("should validate correct password", () => {
      const result = validators.password("password123")
      expect(result).toBeNull()
    })

    it("should reject short password", () => {
      const result = validators.password("123")
      expect(result).not.toBeNull()
      expect(result.field).toBe("password")
      expect(result.message).toBe("Senha deve ter pelo menos 6 caracteres")
    })

    it("should reject empty password", () => {
      const result = validators.password("")
      expect(result).not.toBeNull()
      expect(result.field).toBe("password")
      expect(result.message).toBe("Senha é obrigatória")
    })
  })

  describe("CRM validation", () => {
    it("should validate correct CRM format", () => {
      const result = validators.crm("123456/SP")
      expect(result).toBeNull()
    })

    it("should reject invalid CRM format", () => {
      const result = validators.crm("123456")
      expect(result).not.toBeNull()
      expect(result.field).toBe("crm")
      expect(result.message).toBe("CRM deve estar no formato 123456/SP")
    })

    it("should reject empty CRM", () => {
      const result = validators.crm("")
      expect(result).not.toBeNull()
      expect(result.field).toBe("crm")
      expect(result.message).toBe("CRM é obrigatório")
    })
  })

  describe("phone validation", () => {
    it("should validate correct phone format", () => {
      const result = validators.phone("(11) 99999-9999")
      expect(result).toBeNull()
    })

    it("should reject invalid phone format", () => {
      const result = validators.phone("11999999999")
      expect(result).not.toBeNull()
      expect(result.field).toBe("phone")
      expect(result.message).toBe("Telefone deve estar no formato (11) 99999-9999")
    })

    it("should allow empty phone (optional field)", () => {
      const result = validators.phone("")
      expect(result).toBeNull()
    })
  })

  describe("appointment validation", () => {
    it("should validate correct appointment data", () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const appointmentData = {
        doctor_id: "doctor1",
        patient_id: "patient1",
        appointment_date: futureDate.toISOString(),
      }

      const errors = validators.validateAppointment(appointmentData)
      expect(errors).toHaveLength(0)
    })

    it("should reject appointment with missing required fields", () => {
      const appointmentData = {}
      const errors = validators.validateAppointment(appointmentData)

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some((err) => err.field === "doctor_id")).toBe(true)
      expect(errors.some((err) => err.field === "patient_id")).toBe(true)
      expect(errors.some((err) => err.field === "appointment_date")).toBe(true)
    })

    it("should reject appointment with past date", () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const appointmentData = {
        doctor_id: "doctor1",
        patient_id: "patient1",
        appointment_date: pastDate.toISOString(),
      }

      const errors = validators.validateAppointment(appointmentData)
      expect(errors.some((err) => err.field === "appointment_date")).toBe(true)
    })
  })
})
