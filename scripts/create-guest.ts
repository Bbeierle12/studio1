import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Creating Guest Account...\n');

  // Guest account details
  const guestEmail = 'guest@ourfamilytable.com';
  const guestPassword = 'Guest123!';
  const guestName = 'Guest User';

  console.log(`Email: ${guestEmail}`);
  console.log(`Password: ${guestPassword}`);
  console.log(`Name: ${guestName}\n`);

  // Hash password
  const hashedPassword = await bcrypt.hash(guestPassword, 12);

  // Check if guest already exists
  const existingGuest = await prisma.user.findUnique({
    where: { email: guestEmail },
  });

  if (existingGuest) {
    console.log('📝 Guest user already exists. Updating...\n');
    
    const updatedGuest = await prisma.user.update({
      where: { email: guestEmail },
      data: {
        password: hashedPassword,
        name: guestName,
        role: 'USER',
        isActive: true,
        bio: 'Guest account for testing the meal planning calendar',
      },
    });

    console.log('✅ Guest user updated:');
    console.log(`   ID: ${updatedGuest.id}`);
    console.log(`   Email: ${updatedGuest.email}`);
    console.log(`   Name: ${updatedGuest.name}`);
    console.log(`   Role: ${updatedGuest.role}`);
    console.log(`   Active: ${updatedGuest.isActive}\n`);
  } else {
    console.log('📝 Creating new guest user...\n');
    
    const newGuest = await prisma.user.create({
      data: {
        email: guestEmail,
        password: hashedPassword,
        name: guestName,
        role: 'USER',
        isActive: true,
        bio: 'Guest account for testing the meal planning calendar',
      },
    });

    console.log('✅ Guest user created successfully:');
    console.log(`   ID: ${newGuest.id}`);
    console.log(`   Email: ${newGuest.email}`);
    console.log(`   Name: ${newGuest.name}`);
    console.log(`   Role: ${newGuest.role}`);
    console.log(`   Active: ${newGuest.isActive}\n`);
  }

  // Add some sample recipes for the guest user
  console.log('📚 Creating sample recipes for guest...\n');
  
  const guest = await prisma.user.findUnique({
    where: { email: guestEmail },
  });

  if (guest) {
    // Sample recipe 1
    const recipe1 = await prisma.recipe.upsert({
      where: {
        slug: 'guest-chicken-stir-fry',
      },
      update: {},
      create: {
        title: 'Quick Chicken Stir-Fry',
        slug: 'guest-chicken-stir-fry',
        contributor: 'Guest Kitchen',
        prepTime: 25,
        servings: 4,
        course: 'Dinner',
        cuisine: 'Asian',
        difficulty: 'Easy',
        ingredients: JSON.stringify([
          '1 lb chicken breast, sliced',
          '2 cups mixed vegetables (bell peppers, broccoli, carrots)',
          '3 tbsp soy sauce',
          '2 tbsp vegetable oil',
          '2 cloves garlic, minced',
          '1 tbsp ginger, grated',
          '2 cups cooked rice'
        ]),
        instructions: JSON.stringify([
          'Heat oil in a large wok or skillet over high heat',
          'Add chicken and cook until golden, about 5 minutes',
          'Add garlic and ginger, stir for 30 seconds',
          'Add vegetables and stir-fry for 4-5 minutes',
          'Add soy sauce and toss to coat',
          'Serve hot over rice'
        ]),
        tags: JSON.stringify(['quick', 'healthy', 'asian', 'weeknight']),
        summary: 'A quick and healthy stir-fry perfect for busy weeknights',
        story: 'This classic stir-fry is a family favorite that comes together in under 30 minutes.',
        imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
        imageHint: 'Colorful chicken stir-fry with vegetables in a wok',
        userId: guest.id,
      },
    });

    // Sample recipe 2
    const recipe2 = await prisma.recipe.upsert({
      where: {
        slug: 'guest-breakfast-burrito',
      },
      update: {},
      create: {
        title: 'Hearty Breakfast Burrito',
        slug: 'guest-breakfast-burrito',
        contributor: 'Guest Kitchen',
        prepTime: 15,
        servings: 2,
        course: 'Breakfast',
        cuisine: 'Mexican',
        difficulty: 'Easy',
        ingredients: JSON.stringify([
          '4 large eggs',
          '2 large tortillas',
          '1/2 cup shredded cheese',
          '1/4 cup salsa',
          '2 tbsp butter',
          '1/4 cup black beans, drained',
          '1 avocado, sliced',
          'Salt and pepper to taste'
        ]),
        instructions: JSON.stringify([
          'Scramble eggs in butter until fluffy',
          'Warm tortillas in microwave for 20 seconds',
          'Layer eggs, beans, cheese, and salsa on tortillas',
          'Add avocado slices',
          'Roll up tightly, tucking in the sides',
          'Serve immediately'
        ]),
        tags: JSON.stringify(['breakfast', 'quick', 'protein', 'mexican']),
        summary: 'Start your day with this protein-packed breakfast burrito',
        story: 'A satisfying breakfast that keeps you full until lunch.',
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800',
        imageHint: 'Delicious breakfast burrito filled with eggs and vegetables',
        userId: guest.id,
      },
    });

    // Sample recipe 3
    const recipe3 = await prisma.recipe.upsert({
      where: {
        slug: 'guest-pasta-marinara',
      },
      update: {},
      create: {
        title: 'Classic Pasta Marinara',
        slug: 'guest-pasta-marinara',
        contributor: 'Guest Kitchen',
        prepTime: 30,
        servings: 6,
        course: 'Dinner',
        cuisine: 'Italian',
        difficulty: 'Easy',
        ingredients: JSON.stringify([
          '1 lb spaghetti',
          '28 oz can crushed tomatoes',
          '4 cloves garlic, minced',
          '1/4 cup olive oil',
          '1 tsp dried oregano',
          '1 tsp dried basil',
          'Fresh basil for garnish',
          'Parmesan cheese',
          'Salt and pepper to taste'
        ]),
        instructions: JSON.stringify([
          'Cook pasta according to package directions',
          'Heat olive oil in a large pan over medium heat',
          'Add garlic and cook until fragrant, about 1 minute',
          'Add crushed tomatoes, oregano, and dried basil',
          'Simmer for 20 minutes, stirring occasionally',
          'Season with salt and pepper',
          'Toss pasta with sauce',
          'Garnish with fresh basil and parmesan'
        ]),
        tags: JSON.stringify(['italian', 'vegetarian', 'comfort food', 'classic']),
        summary: 'Simple and delicious homemade marinara sauce over pasta',
        story: 'Nothing beats a classic marinara made from scratch.',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
        imageHint: 'Spaghetti with rich red marinara sauce',
        userId: guest.id,
      },
    });

    // Sample recipe 4
    const recipe4 = await prisma.recipe.upsert({
      where: {
        slug: 'guest-greek-salad',
      },
      update: {},
      create: {
        title: 'Fresh Greek Salad',
        slug: 'guest-greek-salad',
        contributor: 'Guest Kitchen',
        prepTime: 10,
        servings: 4,
        course: 'Lunch',
        cuisine: 'Greek',
        difficulty: 'Easy',
        ingredients: JSON.stringify([
          '3 cups romaine lettuce, chopped',
          '1 cucumber, diced',
          '2 tomatoes, diced',
          '1/2 red onion, sliced',
          '1/2 cup kalamata olives',
          '1/2 cup feta cheese, crumbled',
          '3 tbsp olive oil',
          '2 tbsp red wine vinegar',
          '1 tsp dried oregano',
          'Salt and pepper to taste'
        ]),
        instructions: JSON.stringify([
          'Combine lettuce, cucumber, tomatoes, and onion in a large bowl',
          'Add olives and feta cheese',
          'Whisk together olive oil, vinegar, oregano, salt, and pepper',
          'Pour dressing over salad and toss gently',
          'Serve immediately'
        ]),
        tags: JSON.stringify(['salad', 'healthy', 'vegetarian', 'greek', 'summer']),
        summary: 'Light and refreshing Greek salad perfect for lunch',
        story: 'A Mediterranean classic that\'s healthy and delicious.',
        imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
        imageHint: 'Colorful Greek salad with feta and olives',
        userId: guest.id,
      },
    });

    console.log(`✅ Created ${4} sample recipes for guest user\n`);
  }

  console.log('🎉 Guest account setup complete!\n');
  console.log('═══════════════════════════════════════');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('═══════════════════════════════════════');
  console.log(`   Email:    ${guestEmail}`);
  console.log(`   Password: ${guestPassword}`);
  console.log('═══════════════════════════════════════\n');
  console.log('🚀 You can now log in at: http://localhost:9002/login\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
