export function defaultRouteFor(user) {
  const roles = user?.roles || [];

  if (roles.includes('admin')) {
    return '/admin';
  }

  if (roles.includes('librarian')) {
    return '/librarian';
  }

  if (roles.includes('publisher')) {
    return '/publisher';
  }

  // المستخدم العادي لا يمتلك Dashboard؛ ملفه الشخصي هو نقطة الدخول الأساسية.
  if (roles.includes('member')) {
    return '/profile';
  }

  return '/catalog';
}

export function hasDashboardAccess(user) {
  const roles = user?.roles || [];
  return roles.includes('admin') || roles.includes('librarian') || roles.includes('publisher');
}
