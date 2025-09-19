'use server';

import { PrismaClient } from '@prisma/client'
import type { Recipe, User } from './types';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Convert Prisma user to our User type
const mapPrismaUser = (prismaUser: any): User => ({
  id: prismaUser.id,
  name: prismaUser.name || prismaUser.email.split('@')[0],
  avatarUrl: prismaUser.avatarUrl || `https://i.pravatar.cc/150?u=${prismaUser.email}`
})

// Convert Prisma recipe to our Recipe type
const mapPrismaRecipe = (prismaRecipe: any): Recipe => ({
  id: prismaRecipe.id,
  title: prismaRecipe.title,
  contributor: prismaRecipe.contributor,
  ingredients: prismaRecipe.ingredients,
  instructions: prismaRecipe.instructions,
  imageUrl: prismaRecipe.imageUrl,
  imageHint: prismaRecipe.imageHint,
  tags: JSON.parse(prismaRecipe.tags),
  summary: prismaRecipe.summary,
  story: prismaRecipe.story,
  userId: prismaRecipe.userId,
  prepTime: prismaRecipe.prepTime,
  servings: prismaRecipe.servings,
  course: prismaRecipe.course as any,
  cuisine: prismaRecipe.cuisine as any,
  difficulty: prismaRecipe.difficulty as any,
})

export const getUsers = async (): Promise<User[]> => {
  const users = await prisma.user.findMany()
  return users.map(mapPrismaUser)
}

export const getRecipes = async (
  { query, tag }: { query?: string; tag?: string } = {}
): Promise<Recipe[]> => {
  const where: any = {}
  
  if (query) {
    const lowerCaseQuery = query.toLowerCase()
    where.OR = [
      { title: { contains: lowerCaseQuery, mode: 'insensitive' } },
      { ingredients: { contains: lowerCaseQuery, mode: 'insensitive' } },
      { summary: { contains: lowerCaseQuery, mode: 'insensitive' } }
    ]
  }
  
  const recipes = await prisma.recipe.findMany({
    where,
    include: { user: true },
    orderBy: { title: 'asc' }
  })
  
  let filteredRecipes = recipes.map(mapPrismaRecipe)
  
  if (tag) {
    filteredRecipes = filteredRecipes.filter(recipe => 
      recipe.tags.includes(tag.toLowerCase())
    )
  }
  
  return filteredRecipes
}

export const getRecipeById = async (id: string): Promise<Recipe | undefined> => {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { user: true }
  })
  
  if (!recipe) return undefined
  return mapPrismaRecipe(recipe)
}

export const getTags = async (): Promise<string[]> => {
  const recipes = await prisma.recipe.findMany({
    select: { tags: true }
  })
  
  const allTags = new Set<string>()
  recipes.forEach(recipe => {
    const tags = JSON.parse(recipe.tags)
    tags.forEach((tag: string) => allTags.add(tag))
  })
  
  return Array.from(allTags).sort()
}

export const addRecipe = async (recipe: Omit<Recipe, 'id'>): Promise<Recipe> => {
  const newRecipe = await prisma.recipe.create({
    data: {
      title: recipe.title,
      contributor: recipe.contributor,
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      course: recipe.course,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tags: JSON.stringify(recipe.tags),
      summary: recipe.summary,
      story: recipe.story,
      imageUrl: recipe.imageUrl || 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: recipe.imageHint || '',
      userId: recipe.userId!
    },
    include: { user: true }
  })
  
  return mapPrismaRecipe(newRecipe)
}

export const updateRecipe = async (recipe: Recipe): Promise<Recipe> => {
  const updatedRecipe = await prisma.recipe.update({
    where: { id: recipe.id },
    data: {
      title: recipe.title,
      contributor: recipe.contributor,
      prepTime: recipe.prepTime,
      servings: recipe.servings,
      course: recipe.course,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tags: JSON.stringify(recipe.tags),
      summary: recipe.summary,
      story: recipe.story,
      imageUrl: recipe.imageUrl || 'https://placehold.co/600x400/FFFFFF/FFFFFF',
      imageHint: recipe.imageHint || '',
    },
    include: { user: true }
  })
  
  return mapPrismaRecipe(updatedRecipe)
}

export const deleteRecipe = async (id: string): Promise<void> => {
  await prisma.recipe.delete({
    where: { id }
  })
}
