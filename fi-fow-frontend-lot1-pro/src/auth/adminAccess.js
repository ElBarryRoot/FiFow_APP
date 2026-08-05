export const ADMIN_ROLES = new Set(['MODERATOR', 'ADMIN', 'SUPER_ADMIN'])

const capabilityRoles = {
  accessAdmin: ADMIN_ROLES,
  moderateContent: ADMIN_ROLES,
  reviewSellerVerification: ADMIN_ROLES,
  viewOperations: ADMIN_ROLES,
  manageUsers: new Set(['ADMIN', 'SUPER_ADMIN']),
  manageFinance: new Set(['ADMIN', 'SUPER_ADMIN']),
  manageCatalogue: new Set(['ADMIN', 'SUPER_ADMIN']),
  manageBoostPlans: new Set(['ADMIN', 'SUPER_ADMIN']),
  manageSettings: new Set(['ADMIN', 'SUPER_ADMIN']),
  manageTeam: new Set(['SUPER_ADMIN']),
}

export function hasAdminRole(user) {
  return Boolean(user?.role && ADMIN_ROLES.has(user.role))
}

export function canAdmin(user, capability) {
  return Boolean(user?.role && capabilityRoles[capability]?.has(user.role))
}
