const prisma = require('./src/utils/db');
const bcrypt = require('bcryptjs');

const firstNames = ['Budi', 'Siti', 'Agus', 'Lani', 'Eko', 'Dewi', 'Rian', 'Maya', 'Dedi', 'Rina', 'Joko', 'Sari', 'Andi', 'Yanti', 'Heri', 'Ani', 'Rudi', 'Wati', 'Tono', 'Ina', 'Bambang', 'Siska', 'Fajar', 'Indah', 'Guntur', 'Putri', 'Hendra', 'Kartika', 'Surya', 'Mega', 'Asep', 'Eneng', 'Cecep', 'Fitri', 'Dadang', 'Kokom', 'Ujang', 'Iis', 'Maman', 'Tuti'];
const lastNames = ['Santoso', 'Wijaya', 'Saputra', 'Lestari', 'Hidayat', 'Kusuma', 'Pratama', 'Putri', 'Ramadhan', 'Gunawan', 'Sutrisno', 'Purnomo', 'Setiawan', 'Mulyani', 'Budiman', 'Hardianto', 'Simanjuntak', 'Siregar', 'Nasution', 'Pasaribu', 'Wahyudi', 'Kurniawan', 'Suhendra', 'Zulkarnaen', 'Syarifuddin'];

async function seed() {
  console.log('Starting to seed 500 realistic users to PostgreSQL...');
  
  const password = await bcrypt.hash('password123', 10);
  const users = [];

  for (let i = 1; i <= 500; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName} ${i}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const role = Math.random() > 0.95 ? 'ADMIN' : 'USER';

    users.push({
      name,
      email,
      password,
      role,
      lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.floor(Math.random() * 1000000000)) : null,
    });
  }

  try {
    // Use createMany for high performance in PostgreSQL
    const result = await prisma.user.createMany({
      data: users,
    });
    console.log(`Successfully seeded ${result.count} users.`);
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
