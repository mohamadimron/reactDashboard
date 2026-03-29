require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const adminId = 'e541055d-1f8d-4105-87dd-7dc520b31ca4';
const otherIds = [
  "004eab3d-5f61-4882-90fc-cf84ce7b20ae", 
  "00d342c0-9560-4b97-8d3d-4985eedbea5c", 
  "01d74843-ff5d-432c-be48-72d845c12af9", 
  "03415a11-b667-44f1-9a0e-86d0d2f33072", 
  "041a3d51-6149-4619-8f5c-b297d8acef45", 
  "041cac7a-d1c8-465b-b4dd-e00ba1ebee33", 
  "04a41b2c-1d2d-49b9-988b-4dec0c897512", 
  "053301fd-3280-4bea-8d4f-ae31ce5e54d0", 
  "0551c6bf-017d-46c4-8e97-ca77192326f8", 
  "066d8fe6-3834-4a79-98b3-20b0c44e646b"
];

const conversations = [
  "Halo Admin, saya ada kendala saat mengunggah foto profil. Mohon bantuannya.",
  "Selamat pagi, apakah sistem maintenance hari ini?",
  "Terima kasih atas bantuannya, sekarang akun saya sudah kembali aktif.",
  "Admin, bagaimana cara mengubah email utama saya ya?",
  "Laporan mingguan sudah saya kirimkan ke email Anda.",
  "Tolong cek akun user Budi, sepertinya dia lupa password.",
  "Apakah ada update fitur baru untuk dashboard minggu ini?",
  "Saya menemukan bug pada bagian filter log, beberapa data tidak muncul.",
  "Password saya kok tidak bisa diganti ya? Muncul error server.",
  "Admin, mohon hapus data dummy yang kemarin saya buat untuk testing.",
  "Kerja bagus Admin! Dashboardnya sangat cepat sekarang.",
  "Bisa tolong jadikan akun saya sebagai Operator?",
  "Kenapa sesi saya sering logout sendiri ya? Padahal belum 1 jam.",
  "Halo, saya baru saja mendaftar. Mohon verifikasi akun saya.",
  "Apakah data log aktivitas bisa di-export ke Excel?",
  "Selamat siang, ada meeting koordinasi jam 2 nanti ya.",
  "Foto profil saya tidak muncul di dashboard, tapi di profile muncul.",
  "Tolong cek alamat IP mencurigakan di log keamanan.",
  "Admin, apakah limit upload gambar bisa ditambah?",
  "Konfirmasi untuk reset database besok pagi jam 8 ya."
];

async function seedMessages() {
  console.log('Seeding 20 realistic messages to admin inbox...');
  
  for (let i = 0; i < 20; i++) {
    const senderId = otherIds[Math.floor(Math.random() * otherIds.length)];
    const content = conversations[i];
    
    await prisma.message.create({
      data: {
        senderId,
        receiverId: adminId,
        content,
        isRead: false,
        createdAt: new Date(Date.now() - (20 - i) * 3600000) // Spread over 20 hours
      }
    });
  }

  console.log('Successfully seeded 20 messages.');
  await prisma.$disconnect();
}

seedMessages();
