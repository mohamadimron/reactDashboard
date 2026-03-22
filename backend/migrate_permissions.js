const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({
  user: 'user-react-dashboard',
  host: '192.168.0.105',
  database: 'react-dashboard',
  password: 'NoComent@x9x9',
  port: 5432,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log('Initializing Default Permissions...');

  // 1. ADMIN: Full Power
  await prisma.role.update({
    where: { name: 'ADMIN' },
    data: {
      canViewUsers: true,
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canViewLogs: true,
      canManageSettings: true
    }
  });

  // 2. OPERATOR: View and Edit but no delete/logs/settings
  await prisma.role.update({
    where: { name: 'OPERATOR' },
    data: {
      canViewUsers: true,
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: false,
      canViewLogs: false,
      canManageSettings: false
    }
  });

  // 3. USER: Minimal access
  await prisma.role.update({
    where: { name: 'USER' },
    data: {
      canViewUsers: false,
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewLogs: false,
      canManageSettings: false
    }
  });

  console.log('Permissions migration completed.');
  await prisma.$disconnect();
}

migrate();
