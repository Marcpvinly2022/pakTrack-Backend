import {prisma} from './src/config/database.js'

async function main() {
  const category = await prisma.serviceCategory.create({
    data: {
      id: '7b9e03s6-d934-4867-897b-40b90fa63f03',
      tenantId: '8056626f-0b46-425f-bab6-81b2970154d5',
      serviceName: 'US Visa',
      baseCostNaira: 260000.00,
      isActive: true,
    },
  });
  console.log('Successfully created Service Category ID:', category.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
