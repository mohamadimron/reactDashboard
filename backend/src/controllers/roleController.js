const prisma = require('../utils/db');
const { SYSTEM_SETTING_KEYS, getSystemSetting } = require('../utils/systemSettings');

// Get all roles with their permissions
const getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching roles' });
  }
};

// Create a new role
const createRole = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Role name is required' });

    const exists = await prisma.role.findUnique({ where: { name: name.toUpperCase() } });
    if (exists) return res.status(400).json({ message: 'Role already exists' });

    const role = await prisma.role.create({
      data: { name: name.toUpperCase() }
    });
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating role' });
  }
};

// Delete a role
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await prisma.role.findUnique({ where: { id } });

    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const defaultRegistrationRole = await getSystemSetting(SYSTEM_SETTING_KEYS.DEFAULT_REGISTRATION_ROLE);
    if (defaultRegistrationRole && defaultRegistrationRole === role.name) {
      return res.status(400).json({
        message: 'Cannot delete role that is configured as the default registration role'
      });
    }
    
    // Check if role is in use
    const userCount = await prisma.user.count({ where: { roleId: id } });
    if (userCount > 0) {
      return res.status(400).json({ message: 'Cannot delete role that is assigned to users' });
    }

    await prisma.role.delete({ where: { id } });
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting role' });
  }
};

// Update role permissions (The Core of RBAC)
const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers, 
      canViewLogs, canManageSettings,
      canViewMessages, canDeleteMessages
    } = req.body;

    const role = await prisma.role.update({
      where: { id },
      data: {
        canViewUsers,
        canCreateUsers,
        canEditUsers,
        canDeleteUsers,
        canViewLogs,
        canManageSettings,
        canViewMessages,
        canDeleteMessages
      }
    });

    res.json(role);
  } catch (error) {
    console.error('[RBAC] Update Error:', error);
    res.status(500).json({ message: 'Server Error updating permissions' });
  }
};

module.exports = { getAllRoles, createRole, deleteRole, updateRolePermissions };
