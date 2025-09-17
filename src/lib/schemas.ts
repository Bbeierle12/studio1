import { z } from 'zod';

export const recipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  contributor: z.string().min(1, 'Please select a contributor.'),
  ingredients: z.string().min(10, 'Ingredients list is too short.'),
  instructions: z.string().min(20, 'Instructions are too short.'),
  tags: z.string().min(1, 'Please add at least one tag.'),
});
