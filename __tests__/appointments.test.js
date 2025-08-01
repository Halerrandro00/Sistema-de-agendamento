const { createMocks } = require("node-mocks-http")
const { GET, POST } = require("../app/api/appointments/route")
const jest = require("jest")

// Mock do Supabase
jest.mock("@/lib/supabase", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            order: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    })),
  })),
}))

describe("Appointments API", () => {
  describe("GET /api/appointments", () => {
    it("should return appointments for authenticated user", async () => {
      const { createServerClient } = require("@/lib/supabase")
      const mockSupabase = createServerClient()

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "1" } },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_type: "patient" },
            }),
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: "1",
                  appointment_date: "2024-01-15T10:00:00Z",
                  status: "scheduled",
                  doctor: { profiles: { full_name: "Dr. João" } },
                },
              ],
            }),
          }),
        }),
      })

      const { req, res } = createMocks({
        method: "GET",
      })

      await GET(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.appointments).toBeDefined()
      expect(Array.isArray(data.appointments)).toBe(true)
    })

    it("should reject unauthenticated requests", async () => {
      const { createServerClient } = require("@/lib/supabase")
      const mockSupabase = createServerClient()

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const { req, res } = createMocks({
        method: "GET",
      })

      await GET(req, res)

      expect(res._getStatusCode()).toBe(401)
    })
  })

  describe("POST /api/appointments", () => {
    it("should create appointment with valid data", async () => {
      const { createServerClient } = require("@/lib/supabase")
      const mockSupabase = createServerClient()

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "1" } },
      })

      const mockFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_type: "patient", id: "patient1" },
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "appointment1" },
            }),
          }),
        }),
      }

      mockSupabase.from.mockReturnValue(mockFrom)

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      const { req, res } = createMocks({
        method: "POST",
        body: {
          doctor_id: "doctor1",
          patient_id: "patient1",
          appointment_date: futureDate.toISOString(),
          notes: "Consulta de rotina",
        },
      })

      await POST(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe("Consulta agendada com sucesso")
    })

    it("should reject appointment with past date", async () => {
      const { createServerClient } = require("@/lib/supabase")
      const mockSupabase = createServerClient()

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "1" } },
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_type: "patient" },
            }),
          }),
        }),
      })

      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const { req, res } = createMocks({
        method: "POST",
        body: {
          doctor_id: "doctor1",
          patient_id: "patient1",
          appointment_date: pastDate.toISOString(),
        },
      })

      await POST(req, res)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.errors).toBeDefined()
    })
  })
})
