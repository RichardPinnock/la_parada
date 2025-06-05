import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedPaymentMethods() {
  const methods = ['efectivo', 'transferencia'];

  for (const name of methods) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const paymentMethods = await prisma.paymentMethod.findMany();
  const paymentMethodIds = paymentMethods.map((method) => method.id);
  console.log(`Métodos de pago insertados: ${methods.join(', ')}`);
  console.log(`Métodos de pago ids --->>> ${paymentMethodIds.join(', ')}`);
}

async function seedStockLocation() {
  const location = await prisma.stockLocation.upsert({
    where: { name: 'Almacén Principal' },
    update: {},
    create: { name: 'Almacén Principal' },
  });

  console.log(`Ubicación creada: ${location.name}`);
  console.log(`Ubicación id --->>> ${location.id}`);
  
  return location;
}

async function seedInitialStock(locationId: string) {
  const productos = await prisma.product.findMany();

  for (const producto of productos) {
    const exists = await prisma.warehouseStock.findFirst({
      where: {
        productId: producto.id,
        locationId,
      },
    });

    if (!exists) {
      await prisma.warehouseStock.create({
        data: {
          productId: producto.id,
          locationId,
          quantity: 100,
        },
      });
      console.log(`Stock inicial para producto: ${producto.name}`);
    }
  }
  const ids_productos = productos.map((producto) => producto.id);
  console.log(`Productos ids --->>> ${ids_productos.join(', ')}`);
  return ids_productos;
}

async function seedInitialShift(userId: string, locationId: string, ids_products: number[]) {
  const shift = await prisma.shift.create({
    data: {
      userId,
      startTime: new Date(),
      startAmount: 0,
      stockLocationId: locationId,
    },
  });
  for (const productId of ids_products) {
    await prisma.shiftStockSnapshot.create({
      data: {
        shiftId: shift.id,
        productId,
        locationId,
        quantity: 100,
        type: 'START',
      },
    });
  }

  console.log(`Turno creado: id turno ->>> ${shift.id}`);
  console.log(`Usuario id --->>> ${userId}`);
}

async function userStockLocation(userId: string, locationId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const stockLocation = await prisma.stockLocation.findUnique({
    where: { id: locationId },
  });
  console.log('stockLocation ===>>>', stockLocation);
  

  if (!stockLocation) {
    throw new Error('Ubicación no encontrada');
  }

  await prisma.userStockLocation.create({
    data: {
      userId,
      stockLocationId: locationId,
    },
  });

  console.log(`Ubicación asignada al usuario: ${user.name} en ${stockLocation.name}`);
  
}

async function main() {
  // Create 5 users with hashed passwords
  // const users = await Promise.all([
  //   prisma.user.create({
  //     data: {
  //       email: 'alice@example.com',
  //       name: 'Alice',
  //       password: await bcrypt.hash('password123', 10),
  //     },
  //   }),
  //   prisma.user.create({
  //     data: {
  //       email: 'bob@example.com',
  //       name: 'Bob',
  //       password: await bcrypt.hash('password123', 10),
  //     },
  //   }),
  //   prisma.user.create({
  //     data: {
  //       email: 'charlie@example.com',
  //       name: 'Charlie',
  //       password: await bcrypt.hash('password123', 10),
  //     },
  //   }),
  //   prisma.user.create({
  //     data: {
  //       email: 'diana@example.com',
  //       name: 'Diana',
  //       password: await bcrypt.hash('password123', 10),
  //     },
  //   }),
  //   prisma.user.create({
  //     data: {
  //       email: 'edward@example.com',
  //       name: 'Edward',
  //       password: await bcrypt.hash('password123', 10),
  //     },
  //   }),
  // ]);

  const userAdmin = await prisma.user.upsert({
    where: { email: 'superAdmin@gmail.com' },
    update: {},
    create: {
      email: 'superAdmin@gmail.com',
      name: 'Adrian Aguirre',
      password: await bcrypt.hash('superAdmin', 10),
      role: 'admin', // Asignar rol de administrador
      isActive: true, // Asegurarse de que el usuario esté activo
    },
  })
  


  await seedPaymentMethods();
  const location = await seedStockLocation();
  // const ids_products = await seedInitialStock(location.id);
  
  // await seedInitialShift(userAdmin.id, location.id, ids_products);
  await userStockLocation(userAdmin.id, location.id);

  // const userIdMapping = {
  //   alice: users[0].id,
  //   bob: users[1].id,
  //   charlie: users[2].id,
  //   diana: users[3].id,
  //   edward: users[4].id,
  // };

  // Create 15 posts distributed among users
  // await prisma.post.createMany({
  //   data: [
  //     // Alice's posts
  //     { 
  //       title: 'Getting Started with TypeScript and Prisma', 
  //       content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce id erat a lorem tincidunt ultricies. Vivamus porta bibendum nulla vel accumsan.', 
  //       published: true, 
  //       authorId: userIdMapping.alice 
  //     },
  //     { 
  //       title: 'How ORMs Simplify Complex Queries', 
  //       content: 'Duis sagittis urna ut sapien tristique convallis. Aenean vel ligula felis. Phasellus bibendum sem at elit dictum volutpat.', 
  //       published: false, 
  //       authorId: userIdMapping.alice 
  //     },

  //     // Bob's posts
  //     { 
  //       title: 'Mastering Prisma: Efficient Database Migrations', 
  //       content: 'Ut ullamcorper nec erat id auctor. Nullam nec ligula in ex feugiat tincidunt. Cras accumsan vehicula tortor ut eleifend.', 
  //       published: true, 
  //       authorId: userIdMapping.bob 
  //     },
  //     { 
  //       title: 'Best Practices for Type Safety in ORMs', 
  //       content: 'Aliquam erat volutpat. Suspendisse potenti. Maecenas fringilla elit vel eros laoreet, et tempor sapien vulputate.', 
  //       published: true, 
  //       authorId: userIdMapping.bob 
  //     },
  //     { 
  //       title: 'TypeScript Utility Types for Database Models', 
  //       content: 'Donec ac magna facilisis, vestibulum ligula at, elementum nisl. Morbi volutpat eget velit eu egestas.', 
  //       published: false, 
  //       authorId: userIdMapping.bob 
  //     },

  //     // Charlie's posts (no posts for Charlie)

  //     // Diana's posts
  //     { 
  //       title: 'Exploring Database Indexes and Their Performance Impact', 
  //       content: 'Vivamus ac velit tincidunt, sollicitudin erat quis, fringilla enim. Aenean posuere est a risus placerat suscipit.', 
  //       published: true, 
  //       authorId: userIdMapping.diana 
  //     },
  //     { 
  //       title: 'Choosing the Right Database for Your TypeScript Project', 
  //       content: 'Sed vel suscipit lorem. Duis et arcu consequat, sagittis justo quis, pellentesque risus. Curabitur sed consequat est.', 
  //       published: false, 
  //       authorId: userIdMapping.diana 
  //     },
  //     { 
  //       title: 'Designing Scalable Schemas with Prisma', 
  //       content: 'Phasellus ut erat nec elit ultricies egestas. Vestibulum rhoncus urna eget magna varius pharetra.', 
  //       published: true, 
  //       authorId: userIdMapping.diana 
  //     },
  //     { 
  //       title: 'Handling Relations Between Models in ORMs', 
  //       content: 'Integer luctus ac augue at tristique. Curabitur varius nisl vitae mi fringilla, vel tincidunt nunc dictum.', 
  //       published: false, 
  //       authorId: userIdMapping.diana 
  //     },

  //     // Edward's posts
  //     { 
  //       title: 'Why TypeORM Still Has Its Place in 2025', 
  //       content: 'Morbi non arcu nec velit cursus feugiat sit amet sit amet mi. Etiam porttitor ligula id sem molestie, in tempor arcu bibendum.', 
  //       published: true, 
  //       authorId: userIdMapping.edward 
  //     },
  //     { 
  //       title: 'NoSQL vs SQL: The Definitive Guide for Developers', 
  //       content: 'Suspendisse a ligula sit amet risus ullamcorper tincidunt. Curabitur tincidunt, sapien id fringilla auctor, risus libero gravida odio, nec volutpat libero orci nec lorem.', 
  //       published: true, 
  //       authorId: userIdMapping.edward 
  //     },
  //     { 
  //       title: 'Optimizing Queries with Prisma\'s Select and Include', 
  //       content: 'Proin vel diam vel nisi facilisis malesuada. Sed vitae diam nec magna mollis commodo a vitae nunc.', 
  //       published: false, 
  //       authorId: userIdMapping.edward 
  //     },
  //     { 
  //       title: 'PostgreSQL Optimizations Every Developer Should Know', 
  //       content: 'Nullam mollis quam sit amet lacus interdum, at suscipit libero pellentesque. Suspendisse in mi vitae magna finibus pretium.', 
  //       published: true, 
  //       authorId: userIdMapping.edward 
  //     },
  //     { 
  //       title: 'Scaling Applications with Partitioned Tables in PostgreSQL', 
  //       content: 'Cras vitae tortor in mauris tristique elementum non id ipsum. Nunc vitae pulvinar purus.', 
  //       published: true, 
  //       authorId: userIdMapping.edward 
  //     },
  //   ],
  // });

  console.log('Seeding completed.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
