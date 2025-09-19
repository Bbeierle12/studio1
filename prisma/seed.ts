import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create a test user
  const hashedPassword = await hash('password123', 12)
  
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      avatarUrl: 'https://i.pravatar.cc/150?u=test@example.com'
    }
  })

  console.log('Created user:', user.email)

  // Create some sample recipes
  const recipes = [
    {
      title: "Grandma's Classic Lasagna",
      contributor: 'Grandma Maria',
      ingredients: '1 lb ground beef\n1/2 cup chopped onion\n2 cloves garlic, minced\n1 (28 ounce) can crushed tomatoes\n2 (6.5 ounce) cans tomato sauce\n1/2 cup water\n2 teaspoons sugar\n1 1/2 teaspoons dried basil leaves\n1/2 teaspoon salt\n1/4 teaspoon black pepper\n12 lasagna noodles\n16 ounces ricotta cheese\n1 egg\n3/4 cup grated Parmesan cheese\n1 pound mozzarella cheese, sliced',
      instructions: '1. In a large skillet, cook ground beef, onion, and garlic over medium heat until browned. Drain fat. Stir in crushed tomatoes, tomato sauce, water, sugar, basil, salt, and pepper. Bring to a boil, reduce heat, and simmer for 30 minutes.\n2. Cook lasagna noodles according to package directions. Drain.\n3. In a small bowl, combine ricotta cheese, egg, and 1/4 cup Parmesan cheese. Mix well.\n4. Preheat oven to 375°F (190°C). To assemble, spread 1 cup of meat sauce in the bottom of a 9x13 inch baking dish. Layer with 4 noodles, half of the ricotta mixture, and 1/3 of the mozzarella slices. Repeat layers. Top with remaining 4 noodles, meat sauce, mozzarella, and Parmesan cheese.\n5. Bake for 30-40 minutes, or until bubbly. Let stand for 10 minutes before serving.',
      imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: 'lasagna pasta',
      tags: JSON.stringify(['dinner', 'italian']),
      summary: 'A heartwarming, classic lasagna recipe passed down through generations, featuring rich meat sauce, creamy ricotta, and layers of melted mozzarella. Perfect for family gatherings.',
      story: "This lasagna recipe has been in our family for over 70 years, brought over from the old country by my great-grandmother. Every Sunday, the whole family would gather at her house, and the smell of this lasagna baking would fill every room. It's more than just a meal; it's a tradition that brings us all together.",
      prepTime: 90,
      servings: 8,
      course: 'Main',
      cuisine: 'Italian',
      difficulty: 'Medium',
      userId: user.id
    },
    {
      title: 'Fluffy Buttermilk Pancakes',
      contributor: 'Uncle Bob',
      ingredients: '2 cups all-purpose flour\n2 teaspoons baking powder\n1 teaspoon baking soda\n1/2 teaspoon salt\n3 tablespoons sugar\n2 large eggs, lightly beaten\n3 cups buttermilk\n4 tablespoons unsalted butter, melted',
      instructions: '1. In a large bowl, whisk together flour, baking powder, baking soda, salt, and sugar.\n2. In a separate bowl, whisk together eggs and buttermilk. Pour the wet ingredients into the dry ingredients and whisk until just combined (do not overmix).\n3. Stir in the melted butter.\n4. Heat a lightly oiled griddle or frying pan over medium-high heat. Pour or scoop the batter onto the griddle, using approximately 1/4 cup for each pancake. Cook until bubbles appear on the surface and the edges are dry, about 2-3 minutes. Flip and cook until browned on the other side. Serve immediately with syrup and your favorite toppings.',
      imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: 'pancakes breakfast',
      tags: JSON.stringify(['breakfast', 'american']),
      summary: 'A foolproof recipe for incredibly fluffy and tender buttermilk pancakes. Simple to make and always a crowd-pleaser for a weekend breakfast or brunch.',
      story: "Uncle Bob was famous for his Saturday morning pancakes. He'd always make funny shapes for the kids and would never, ever share his 'secret ingredient' (which we all knew was a little extra butter).",
      prepTime: 20,
      servings: 4,
      course: 'Breakfast',
      cuisine: 'American',
      difficulty: 'Easy',
      userId: user.id
    }
  ]

  for (const recipe of recipes) {
    const createdRecipe = await prisma.recipe.create({
      data: recipe
    })
    console.log('Created recipe:', createdRecipe.title)
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })