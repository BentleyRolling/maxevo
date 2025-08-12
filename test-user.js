import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    await prisma.user.create({
      data: {
        id: 'demo-user',
        email: 'demo@test.com',
        plan: 'FREE'
      }
    });
    console.log('Created demo-user');
  } catch (e) {
    if (e.code === 'P2002') {
      console.log('demo-user already exists');
    } else {
      console.error('Error:', e.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();