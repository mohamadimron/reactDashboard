const prisma = require('./src/utils/db');
const bcrypt = require('bcryptjs');

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@mail.com' },
      include: { role: true, status: true }
    });
    
    if (!user) {
      console.log('User admin@mail.com NOT FOUND');
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Role:', user.role.name);
    console.log('Status:', user.status.name);
    
    const isMatch = await bcrypt.compare('admin1234', user.password);
    console.log('Password Match for admin1234:', isMatch);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
