export type UserType = "admin" | "doctor" | "patient"

export interface Permission {
  resource: string
  action: string
}

const permissions: Record<UserType, Permission[]> = {
  admin: [
    { resource: "users", action: "create" },
    { resource: "users", action: "read" },
    { resource: "users", action: "update" },
    { resource: "users", action: "delete" },
    { resource: "doctors", action: "create" },
    { resource: "doctors", action: "read" },
    { resource: "doctors", action: "update" },
    { resource: "doctors", action: "delete" },
    { resource: "patients", action: "read" },
    { resource: "appointments", action: "read" },
    { resource: "appointments", action: "update" },
    { resource: "appointments", action: "delete" },
  ],
  doctor: [
    { resource: "appointments", action: "read" },
    { resource: "appointments", action: "update" },
    { resource: "patients", action: "read" },
    { resource: "documents", action: "create" },
    { resource: "documents", action: "read" },
  ],
  patient: [
    { resource: "appointments", action: "create" },
    { resource: "appointments", action: "read" },
    { resource: "appointments", action: "update" },
    { resource: "doctors", action: "read" },
    { resource: "documents", action: "read" },
  ],
}

export const hasPermission = (userType: UserType, resource: string, action: string): boolean => {
  const userPermissions = permissions[userType] || []
  return userPermissions.some((p) => p.resource === resource && p.action === action)
}

export const requirePermission = (userType: UserType, resource: string, action: string) => {
  if (!hasPermission(userType, resource, action)) {
    throw new Error("Acesso negado: permissão insuficiente")
  }
}
