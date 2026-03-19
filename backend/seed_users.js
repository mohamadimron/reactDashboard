const prisma = require('./src/utils/db');
const bcrypt = require('bcryptjs');

const firstNames = ['Budi', 'Siti', 'Agus', 'Lani', 'Eko', 'Dewi', 'Rian', 'Maya', 'Dedi', 'Rina', 'Joko', 'Sari', 'Andi', 'Yanti', 'Heri', 'Ani', 'rudi', 'Wati', 'Tono', 'Ina'];
const lastNames = ['Santoso', 'Wijaya', 'Saputra', 'Lestari', 'Hidayat', 'Kusuma', 'Pratama', 'Putri', 'Ramadhan', 'Gunawan', 'Sutrisno', 'Purnomo', 'Setiawan', 'Mulyani', 'Budiman'];

async function seed() {
  console.log('Starting to seed 100 users...');
  
  const password = await bcrypt.hash('password123', 10);
  const users = [];

  for (let i = 1; i <= 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName} ${i}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const role = Math.random() > 0.9 ? 'ADMIN' : 'USER'; // 10% Admin, 90% User

    users.push({
      name,
      email,
      password,
      role,
    });
  }

  try {
    // Using a loop for individual creates to ensure hooks/validations (if any) are respected, 
    // although createMany is faster, this is safer for SQLite pathing in this environment.
    for (const userData of users) {
      await prisma.user.create({ data: userData });
    }
    console.log('Successfully seeded 100 users.');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
