export function getRoleDashboardRoute(role?: string): string {
  switch (role) {
    case 'superadmin':
      return '/admin'
    case 'customer':
      return '/portal'
    case 'agent':
      return '/b2b/agent'
    case 'underwriter':
      return '/b2b/underwriting'
    case 'adjuster':
      return '/b2b/claims'
    case 'admin':
      return '/b2b/admin'
    default:
      return '/b2b'
  }
}
