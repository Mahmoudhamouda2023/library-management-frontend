export function hasRole(user, role) {
  return user?.roles?.includes(role);
}

export function hasPermission(user, permission) {
  return user?.permissions?.includes(permission);
}
