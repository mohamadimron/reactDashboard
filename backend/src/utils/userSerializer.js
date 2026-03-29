const sanitizeUser = (user) => {
  if (!user) return null;

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin ?? null,
    lastActivity: user.lastActivity ?? null
  };

  if (user.role) {
    safeUser.role = typeof user.role === 'string' ? user.role : user.role.name;
  }

  if (user.status) {
    safeUser.status = typeof user.status === 'string' ? user.status : user.status.name;
  }

  if (user.permissions) {
    safeUser.permissions = user.permissions;
  } else if (user.role && typeof user.role === 'object') {
    safeUser.permissions = {
      canViewUsers: Boolean(user.role.canViewUsers),
      canCreateUsers: Boolean(user.role.canCreateUsers),
      canEditUsers: Boolean(user.role.canEditUsers),
      canDeleteUsers: Boolean(user.role.canDeleteUsers),
      canViewLogs: Boolean(user.role.canViewLogs),
      canManageSettings: Boolean(user.role.canManageSettings),
      canViewMessages: Boolean(user.role.canViewMessages),
      canDeleteMessages: Boolean(user.role.canDeleteMessages)
    };
  }

  return safeUser;
};

const sanitizeUsers = (users = []) => users.map(sanitizeUser);

module.exports = { sanitizeUser, sanitizeUsers };
