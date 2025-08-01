const { hasPermission, requirePermission } = require("../lib/permissions")

describe("Permission System", () => {
  describe("hasPermission", () => {
    it("should allow admin to manage users", () => {
      expect(hasPermission("admin", "users", "create")).toBe(true)
      expect(hasPermission("admin", "users", "read")).toBe(true)
      expect(hasPermission("admin", "users", "update")).toBe(true)
      expect(hasPermission("admin", "users", "delete")).toBe(true)
    })

    it("should allow doctor to read appointments", () => {
      expect(hasPermission("doctor", "appointments", "read")).toBe(true)
      expect(hasPermission("doctor", "appointments", "update")).toBe(true)
    })

    it("should not allow doctor to delete appointments", () => {
      expect(hasPermission("doctor", "appointments", "delete")).toBe(false)
    })

    it("should allow patient to create appointments", () => {
      expect(hasPermission("patient", "appointments", "create")).toBe(true)
      expect(hasPermission("patient", "appointments", "read")).toBe(true)
    })

    it("should not allow patient to manage users", () => {
      expect(hasPermission("patient", "users", "create")).toBe(false)
      expect(hasPermission("patient", "users", "delete")).toBe(false)
    })
  })

  describe("requirePermission", () => {
    it("should not throw error for valid permission", () => {
      expect(() => {
        requirePermission("admin", "users", "create")
      }).not.toThrow()
    })

    it("should throw error for invalid permission", () => {
      expect(() => {
        requirePermission("patient", "users", "delete")
      }).toThrow("Acesso negado: permissão insuficiente")
    })
  })
})
