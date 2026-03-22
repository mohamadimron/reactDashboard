const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: 'user-react-dashboard',
  host: '192.168.0.105',
  database: 'react-dashboard',
  password: 'NoComent@x9x9',
  port: 5432,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('Seeding Roles and Statuses...');

  // 1. Seed Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { 
      name: 'ADMIN', 
      canViewUsers: true, 
      canCreateUsers: true, 
      canEditUsers: true, 
      canDeleteUsers: true, 
      canViewLogs: true, 
      canManageSettings: true 
    },
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { 
      name: 'USER',
      canViewUsers: false,
      canCreateUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canViewLogs: false,
      canManageSettings: false
    },
  });
  const operatorRole = await prisma.role.upsert({
    where: { name: 'OPERATOR' },
    update: {},
    create: { 
      name: 'OPERATOR',
      canViewUsers: true,
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: false,
      canViewLogs: false,
      canManageSettings: false
    },
  });

  // 2. Seed Statuses
  const activeStatus = await prisma.status.upsert({
    where: { name: 'ACTIVE' },
    update: {},
    create: { name: 'ACTIVE' },
  });
  const notActiveStatus = await prisma.status.upsert({
    where: { name: 'NOT_ACTIVE' },
    update: {},
    create: { name: 'NOT_ACTIVE' },
  });
  const suspendStatus = await prisma.status.upsert({
    where: { name: 'SUSPEND' },
    update: {},
    create: { name: 'SUSPEND' },
  });

  // 3. Create Master Admin
  const hashedPassword = await bcrypt.hash('admin1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mail.com' },
    update: {
      password: hashedPassword,
      roleId: adminRole.id,
      statusId: activeStatus.id
    },
    create: {
      name: 'Master Admin',
      email: 'admin@mail.com',
      password: hashedPassword,
      roleId: adminRole.id,
      statusId: activeStatus.id,
    },
  });

  console.log('Seeding completed successfully.');
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
