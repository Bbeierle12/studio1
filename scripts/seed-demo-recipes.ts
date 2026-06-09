/**
 * Seed a handful of demo recipes (owned by owner@demo.local) so the Recipe Hub
 * grid renders for local UI verification. LOCAL DEV ONLY. Idempotent by slug.
 *
 * Run: npx tsx scripts/seed-demo-recipes.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RECIPES = [
  { title: 'Sunday Pot Roast', summary: 'Slow-braised beef with root vegetables.', prepTime: 180, difficulty: 'Easy', course: 'Main', cuisine: 'American', tags: ['Comfort', 'Beef'] },
  { title: 'Garden Harvest Salad', summary: 'Crisp greens with a bright vinaigrette.', prepTime: 15, difficulty: 'Easy', course: 'Side', cuisine: 'American', tags: ['Vegetarian', 'Fresh'] },
  { title: 'Buttermilk Pancakes', summary: 'Fluffy stacks for a slow weekend morning.', prepTime: 25, difficulty: 'Easy', course: 'Breakfast', cuisine: 'American', tags: ['Breakfast'] },
  { title: 'Margherita Pizza', summary: 'Blistered crust, basil, fresh mozzarella.', prepTime: 45, difficulty: 'Medium', course: 'Main', cuisine: 'Italian', tags: ['Italian'] },
  { title: 'Chicken Tikka Masala', summary: 'Creamy, spiced tomato curry over rice.', prepTime: 60, difficulty: 'Medium', course: 'Main', cuisine: 'Asian', tags: ['Curry', 'Spicy'] },
  { title: 'Oatmeal Cookies', summary: 'Chewy, lightly spiced, family favorite.', prepTime: 30, difficulty: 'Easy', course: 'Dessert', cuisine: 'American', tags: ['Dessert'] },
];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function main() {
  const owner = await prisma.user.findUnique({ where: { email: 'owner@demo.local' } });
  if (!owner) {
    console.log('❌ owner@demo.local not found — run seed-demo-household.ts first.');
    return;
  }
  console.log('\n🍳 Seeding demo recipes for owner@demo.local\n');
  for (const r of RECIPES) {
    const slug = slugify(r.title);
    const data = {
      title: r.title,
      slug,
      contributor: 'Demo Owner',
      summary: r.summary,
      imageUrl: '',
      imageHint: r.title.toLowerCase(),
      ingredients: '2 lbs beef chuck roast\n4 carrots, chopped\n3 potatoes, quartered\n1 yellow onion\n2 cups beef stock\n2 sprigs rosemary',
      instructions: 'Sear the roast on all sides in a hot Dutch oven.\nAdd the vegetables, stock, and rosemary.\nCover and braise at 325°F for 3 hours.\nRest 15 minutes, then serve.',
      tags: JSON.stringify(r.tags),
      prepTime: r.prepTime,
      servings: 4,
      difficulty: r.difficulty,
      course: r.course,
      cuisine: r.cuisine,
      userId: owner.id,
    };
    await prisma.recipe.upsert({ where: { slug }, update: data, create: data });
    console.log(`  ✅ ${r.title}`);
  }
  const count = await prisma.recipe.count();
  console.log(`\nTotal recipes now: ${count}\n`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
