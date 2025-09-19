import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// Function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

async function main() {
  console.log('Seeding database...');

  // Create a test user
  const hashedPassword = await hash('password123', 12);

  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      avatarUrl: 'https://i.pravatar.cc/150?u=test@example.com',
    },
  });

  console.log('Created user:', user.email);

  // Create some sample recipes
  const recipes = [
    {
      title: "Grandma's Classic Lasagna",
      slug: generateSlug("Grandma's Classic Lasagna"),
      contributor: 'Grandma Maria',
      ingredients:
        '1 lb ground beef\n1/2 cup chopped onion\n2 cloves garlic, minced\n1 (28 ounce) can crushed tomatoes\n2 (6.5 ounce) cans tomato sauce\n1/2 cup water\n2 teaspoons sugar\n1 1/2 teaspoons dried basil leaves\n1/2 teaspoon salt\n1/4 teaspoon black pepper\n12 lasagna noodles\n16 ounces ricotta cheese\n1 egg\n3/4 cup grated Parmesan cheese\n1 pound mozzarella cheese, sliced',
      instructions:
        '1. In a large skillet, cook ground beef, onion, and garlic over medium heat until browned. Drain fat. Stir in crushed tomatoes, tomato sauce, water, sugar, basil, salt, and pepper. Bring to a boil, reduce heat, and simmer for 30 minutes.\n2. Cook lasagna noodles according to package directions. Drain.\n3. In a small bowl, combine ricotta cheese, egg, and 1/4 cup Parmesan cheese. Mix well.\n4. Preheat oven to 375°F (190°C). To assemble, spread 1 cup of meat sauce in the bottom of a 9x13 inch baking dish. Layer with 4 noodles, half of the ricotta mixture, and 1/3 of the mozzarella slices. Repeat layers. Top with remaining 4 noodles, meat sauce, mozzarella, and Parmesan cheese.\n5. Bake for 30-40 minutes, or until bubbly. Let stand for 10 minutes before serving.',
      imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: 'lasagna pasta',
      tags: JSON.stringify(['dinner', 'italian', 'comfort', 'bake', 'hearty']),
      summary:
        'A heartwarming, classic lasagna recipe passed down through generations, featuring rich meat sauce, creamy ricotta, and layers of melted mozzarella. Perfect for family gatherings.',
      story:
        "This lasagna recipe has been in our family for over 70 years, brought over from the old country by my great-grandmother. Every Sunday, the whole family would gather at her house, and the smell of this lasagna baking would fill every room. It's more than just a meal; it's a tradition that brings us all together.",
      prepTime: 90,
      servings: 8,
      course: 'Main',
      cuisine: 'Italian',
      difficulty: 'Medium',
      originName: 'Sicily, Italy',
      originLat: 37.5079,
      originLng: 14.0934,
      userId: user.id,
    },
    {
      title: 'Fluffy Buttermilk Pancakes',
      slug: generateSlug('Fluffy Buttermilk Pancakes'),
      contributor: 'Uncle Bob',
      ingredients:
        '2 cups all-purpose flour\n2 teaspoons baking powder\n1 teaspoon baking soda\n1/2 teaspoon salt\n3 tablespoons sugar\n2 large eggs, lightly beaten\n3 cups buttermilk\n4 tablespoons unsalted butter, melted',
      instructions:
        '1. In a large bowl, whisk together flour, baking powder, baking soda, salt, and sugar.\n2. In a separate bowl, whisk together eggs and buttermilk. Pour the wet ingredients into the dry ingredients and whisk until just combined (do not overmix).\n3. Stir in the melted butter.\n4. Heat a lightly oiled griddle or frying pan over medium-high heat. Pour or scoop the batter onto the griddle, using approximately 1/4 cup for each pancake. Cook until bubbles appear on the surface and the edges are dry, about 2-3 minutes. Flip and cook until browned on the other side. Serve immediately with syrup and your favorite toppings.',
      imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: 'pancakes breakfast',
      tags: JSON.stringify(['breakfast', 'american', 'quick', 'weeknight']),
      summary:
        'A foolproof recipe for incredibly fluffy and tender buttermilk pancakes. Simple to make and always a crowd-pleaser for a weekend breakfast or brunch.',
      story:
        "Uncle Bob was famous for his Saturday morning pancakes. He'd always make funny shapes for the kids and would never, ever share his 'secret ingredient' (which we all knew was a little extra butter).",
      prepTime: 20,
      servings: 4,
      course: 'Breakfast',
      cuisine: 'American',
      difficulty: 'Easy',
      originName: 'New England, USA',
      originLat: 43.2081,
      originLng: -71.5376,
      userId: user.id,
    },
    {
      title: 'Summer Greek Salad',
      slug: generateSlug('Summer Greek Salad'),
      contributor: 'Aunt Sophia',
      ingredients:
        '4 large tomatoes, cut into chunks\n1 large cucumber, peeled and sliced\n1/2 red onion, thinly sliced\n1/2 cup Kalamata olives\n4 oz feta cheese, crumbled\n3 tablespoons olive oil\n2 tablespoons red wine vinegar\n1 teaspoon dried oregano\n1/2 teaspoon salt\n1/4 teaspoon black pepper\nFresh basil leaves for garnish',
      instructions:
        '1. In a large bowl, combine tomatoes, cucumber, red onion, and olives.\n2. In a small bowl, whisk together olive oil, red wine vinegar, oregano, salt, and pepper.\n3. Pour dressing over salad and toss gently.\n4. Top with crumbled feta cheese and fresh basil leaves.\n5. Let stand for 10 minutes to allow flavors to meld. Serve chilled.',
      imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: 'greek salad mediterranean',
      tags: JSON.stringify(['salad', 'no-cook', 'fresh', 'light', 'summer', 'chilled']),
      summary:
        'A refreshing Mediterranean salad perfect for hot summer days. No cooking required - just fresh vegetables, tangy feta, and a simple olive oil dressing.',
      story:
        'Every summer when the tomatoes were perfectly ripe, Aunt Sophia would make this salad for our family picnics. She insisted the secret was using the ripest tomatoes and letting the salad sit so all the flavors could come together.',
      prepTime: 15,
      servings: 6,
      course: 'Side',
      cuisine: 'Greek',
      difficulty: 'Easy',
      originName: 'Santorini, Greece',
      originLat: 36.3932,
      originLng: 25.4615,
      userId: user.id,
    },
    {
      title: 'Cozy Chicken Noodle Soup',
      slug: generateSlug('Cozy Chicken Noodle Soup'),
      contributor: 'Mom',
      ingredients:
        '1 whole chicken (3-4 lbs)\n12 cups water\n2 bay leaves\n1 large onion, diced\n3 carrots, sliced\n3 celery stalks, sliced\n2 cloves garlic, minced\n8 oz wide egg noodles\n2 tablespoons olive oil\n1 teaspoon dried thyme\n1/2 teaspoon dried parsley\nSalt and pepper to taste\nFresh parsley for garnish',
      instructions:
        '1. In a large pot, place chicken, water, and bay leaves. Bring to a boil, then reduce heat and simmer for 1 hour.\n2. Remove chicken and let cool. Strain broth and return to pot.\n3. Shred chicken meat, discarding skin and bones.\n4. Heat olive oil in the same pot. Sauté onion, carrots, and celery until tender, about 5 minutes.\n5. Add garlic and cook 1 minute more.\n6. Return broth to pot with vegetables. Add thyme, parsley, salt, and pepper. Bring to a boil.\n7. Add noodles and cook according to package directions.\n8. Stir in shredded chicken and heat through. Garnish with fresh parsley.',
      imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: 'chicken soup comfort food',
      tags: JSON.stringify(['soup', 'comfort', 'warm', 'hearty', 'one-pot', 'stovetop']),
      summary:
        'A soul-warming chicken noodle soup that cures everything from cold days to cold hearts. Made from scratch with tender chicken and fresh vegetables.',
      story:
        "This is the soup that made everything better. Scraped knee? Chicken soup. Bad day at school? Chicken soup. Rainy afternoon? You guessed it - chicken soup. Mom's cure-all recipe that never failed.",
      prepTime: 120,
      servings: 8,
      course: 'Main',
      cuisine: 'American',
      difficulty: 'Medium',
      originName: 'Midwest, USA',
      originLat: 41.8781,
      originLng: -87.6298,
      userId: user.id,
    },
    {
      title: 'Grilled Honey Garlic Chicken',
      slug: generateSlug('Grilled Honey Garlic Chicken'),
      contributor: 'Dad',
      ingredients:
        '4 boneless, skinless chicken breasts\n1/4 cup honey\n3 tablespoons soy sauce\n3 cloves garlic, minced\n2 tablespoons olive oil\n1 tablespoon rice vinegar\n1 teaspoon fresh ginger, grated\n1/2 teaspoon red pepper flakes\n1/4 teaspoon black pepper\n2 green onions, sliced\nSesame seeds for garnish',
      instructions:
        '1. In a bowl, whisk together honey, soy sauce, garlic, olive oil, rice vinegar, ginger, red pepper flakes, and black pepper.\n2. Place chicken in a resealable bag and pour half the marinade over it. Marinate for at least 30 minutes, preferably 2-4 hours.\n3. Preheat grill to medium-high heat.\n4. Remove chicken from marinade and grill for 6-7 minutes per side, or until internal temperature reaches 165°F.\n5. Brush with remaining marinade during the last few minutes of cooking.\n6. Let rest for 5 minutes, then slice and garnish with green onions and sesame seeds.',
      imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: 'grilled chicken bbq',
      tags: JSON.stringify(['grill', 'summer', 'light', 'bbq', 'quick']),
      summary:
        'Perfectly grilled chicken with a sweet and savory glaze. Great for summer barbecues and golden hour grilling sessions.',
      story:
        "Dad's go-to recipe for backyard barbecues. He'd always say 'the secret is the golden hour' - that perfect time before sunset when the grill is hot and the company is good.",
      prepTime: 45,
      servings: 4,
      course: 'Main',
      cuisine: 'Asian',
      difficulty: 'Easy',
      originName: 'California, USA',
      originLat: 34.0522,
      originLng: -118.2437,
      userId: user.id,
    },
    {
      title: 'Sheet Pan Roasted Vegetables',
      slug: generateSlug('Sheet Pan Roasted Vegetables'),
      contributor: 'Chef Sarah',
      ingredients:
        '2 bell peppers, sliced\n1 zucchini, sliced\n1 red onion, cut into wedges\n1 eggplant, cubed\n2 cups cherry tomatoes\n3 tablespoons olive oil\n2 cloves garlic, minced\n1 teaspoon dried herbs (rosemary, thyme, or oregano)\n1/2 teaspoon salt\n1/4 teaspoon black pepper\nFresh herbs for garnish',
      instructions:
        '1. Preheat oven to 425°F (220°C).\n2. In a large bowl, combine all vegetables.\n3. In a small bowl, whisk together olive oil, garlic, dried herbs, salt, and pepper.\n4. Pour over vegetables and toss to coat evenly.\n5. Spread vegetables in a single layer on a large sheet pan.\n6. Roast for 25-30 minutes, stirring once halfway through, until vegetables are tender and lightly caramelized.\n7. Garnish with fresh herbs and serve immediately.',
      imageUrl: 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: 'roasted vegetables sheet pan',
      tags: JSON.stringify(['sheet-pan', 'indoor', 'vegetarian', 'seasonal', 'air-fryer']),
      summary:
        'Colorful roasted vegetables that are perfect when outdoor grilling isn\'t an option. Easy cleanup and maximum flavor with minimal effort.',
      story:
        'Chef Sarah developed this recipe for those windy or smoky days when outdoor cooking just wasn\'t feasible. "When nature says stay inside," she\'d say, "the sheet pan says dinner\'s ready."',
      prepTime: 35,
      servings: 6,
      course: 'Side',
      cuisine: 'Mediterranean',
      difficulty: 'Easy',
      originName: 'California, USA',
      originLat: 37.7749,
      originLng: -122.4194,
      userId: user.id,
    },
  ];

  for (const recipe of recipes) {
    const createdRecipe = await prisma.recipe.create({
      data: recipe,
    });
    console.log('Created recipe:', createdRecipe.title);
  }

  console.log('Database seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
