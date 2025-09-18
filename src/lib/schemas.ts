import { z } from 'zod';

export const recipeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  contributor: z.string().min(1, 'Please select a contributor.'),
  prepTime: z.coerce.number().int().positive('Preparation time must be a positive number.').optional(),
  servings: z.coerce.number().int().positive('Servings must be a positive number.').optional(),
  course: z.enum(['Appetizer', 'Main', 'Dessert', 'Side', 'Breakfast']).optional(),
  cuisine: z.enum(['Italian', 'American', 'Mexican', 'Asian', 'Other']).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  ingredients: z.string().min(10, 'Ingredients list is too short.'),
  instructions: z.string().min(20, 'Instructions are too short.'),
  tags: z.string().min(1, 'Please add at least one tag.'),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const generatedRecipeSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters.'),
    photoDataUri: z.string().refine(
        (data) => data.startsWith('data:image/'),
        'Invalid image format. Must be a data URI.'
    ),
})
