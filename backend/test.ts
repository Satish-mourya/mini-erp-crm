import { prisma } from './src/lib/prisma';
prisma.user.findUnique({where: {email: 'admin@erp.com'}}).then(r => {console.log('Success:', r); prisma.$disconnect()}).catch(e => {console.error('Error:', e); process.exit(1)});
