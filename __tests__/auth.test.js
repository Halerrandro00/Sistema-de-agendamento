const request = require("supertest")
const { createMocks } = require("node-mocks-http")
\
const { POST as loginHandler } = require('../app/api/auth/login/route');
\
const { POST as registerHandler } = require('../app/api/auth/register/route');
const jest = require("jest")

// Mock do Supabase
jest.mock("@/lib/supabase", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      admin: {
        createUser: jest.fn(),
      },
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}))

jest.mock("@/lib/auth", () => ({
  authService: {
    signInWithEmail: jest.fn(),
  },
}))

describe("Authentication API", () => {
  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const { authService } = require("@/lib/auth")
      authService.signInWithEmail.mockResolvedValue({
        data: {
          user: { id: "1", email: "test@example.com" },
          session: { access_token: "token123" },
        },
        error: null,
      })

      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
          password: "password123",
        },
      })

      await loginHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.user).toBeDefined()
      expect(data.session).toBeDefined()
    })

    it("should reject invalid email", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "invalid-email",
          password: "password123",
        },
      })

      await loginHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.errors).toBeDefined()
      expect(data.errors[0].field).toBe("email")
    })

    it("should reject short password", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
          password: "123",
        },
      })

      await loginHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.errors).toBeDefined()
      expect(data.errors[0].field).toBe("password")
    })
  })

  describe("POST /api/auth/register", () => {
    it("should register a new patient", async () => {
      const { createServerClient } = require("@/lib/supabase")
      const mockSupabase = createServerClient()

      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: "1" } },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      })

      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "patient@example.com",
          password: "password123",
          full_name: "João Silva",
          user_type: "patient",
          phone: "(11) 99999-9999",
        },
      })

      await registerHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe("Usuário criado com sucesso")
    })

    it("should register a new doctor with CRM validation", async () => {
      const { createServerClient } = require("@/lib/supabase")
      const mockSupabase = createServerClient()

      mockSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: "2" } },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      })

      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "doctor@example.com",
          password: "password123",
          full_name: "Dr. Maria Santos",
          user_type: "doctor",
          phone: "(11) 88888-8888",
          specialty: "Cardiologia",
          crm: "123456/SP",
        },
      })

      await registerHandler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it("should reject doctor registration without CRM", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "doctor@example.com",
          password: "password123",
          full_name: "Dr. Maria Santos",
          user_type: "doctor",
          specialty: "Cardiologia",
          // CRM missing
        },
      })

      await registerHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.errors).toBeDefined()
      expect(data.errors.some((err) => err.field === "crm")).toBe(true)
    })
  })
})
