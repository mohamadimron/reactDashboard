const prisma = require('./src/utils/db');
const bcrypt = require('bcryptjs');

const firstNames = ['Budi', 'Siti', 'Agus', 'Lani', 'Eko', 'Dewi', 'Rian', 'Maya', 'Dedi', 'Rina', 'Joko', 'Sari', 'Andi', 'Yanti', 'Heri', 'Ani', 'Rudi', 'Wati', 'Tono', 'Ina', 'Bambang', 'Siska', 'Fajar', 'Indah', 'Guntur', 'Putri', 'Hendra', 'Kartika', 'Surya', 'Mega', 'Asep', 'Eneng', 'Cecep', 'Fitri', 'Dadang', 'Kokom', 'Ujang', 'Iis', 'Maman', 'Tuti'];
const lastNames = ['Santoso', 'Wijaya', 'Saputra', 'Lestari', 'Hidayat', 'Kusuma', 'Pratama', 'Putri', 'Ramadhan', 'Gunawan', 'Sutrisno', 'Purnomo', 'Setiawan', 'Mulyani', 'Budiman', 'Hardianto', 'Simanjuntak', 'Siregar', 'Nasution', 'Pasaribu', 'Wahyudi', 'Kurniawan', 'Suhendra', 'Zulkarnaen', 'Syarifuddin'];

async function seed() {
  console.log('Fetching dynamic Role and Status IDs from PostgreSQL...');
  
  const dbRoles = await prisma.role.findMany();
  const dbStatuses = await prisma.status.findMany();

  const roleMap = {
    ADMIN: dbRoles.find(r => r.name === 'ADMIN').id,
    USER: dbRoles.find(r => r.name === 'USER').id,
    OPERATOR: dbRoles.find(r => r.name === 'OPERATOR').id,
  };

  const statusMap = {
    ACTIVE: dbStatuses.find(s => s.name === 'ACTIVE').id,
    NOT_ACTIVE: dbStatuses.find(s => s.name === 'NOT_ACTIVE').id,
    SUSPEND: dbStatuses.find(s => s.name === 'SUSPEND').id,
  };

  console.log('Generating 500 realistic users...');
  const password = await bcrypt.hash('password123', 10);
  const users = [];

  for (let i = 1; i <= 500; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    
    // Distribution logic
    const roleRand = Math.random();
    let roleId = roleMap.USER;
    if (roleRand > 0.95) roleId = roleMap.ADMIN;
    else if (roleRand > 0.80) roleId = roleMap.OPERATOR;

    const statusRand = Math.random();
    let statusId = statusMap.ACTIVE;
    if (statusRand > 0.95) statusId = statusMap.SUSPEND;
    else if (statusRand > 0.85) statusId = statusMap.NOT_ACTIVE;

    users.push({
      name,
      email,
      password,
      roleId,
      statusId,
      lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 1000000000)) : null,
    });
  }

  try {
    const result = await prisma.user.createMany({
      data: users,
      skipDuplicates: true
    });
    console.log(`Successfully seeded ${result.count} relational users.`);
  } catch (error) {
    console.error('Seeding Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
