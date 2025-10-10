-- Migration: Add Favorite Recipes Feature
-- Date: October 9, 2025
-- Description: Adds FavoriteRecipe table to track user's favorite recipes

-- Create FavoriteRecipe table
CREATE TABLE "FavoriteRecipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteRecipe_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint to prevent duplicate favorites
CREATE UNIQUE INDEX "FavoriteRecipe_userId_recipeId_key" ON "FavoriteRecipe"("userId", "recipeId");

-- Create indexes for performance
CREATE INDEX "FavoriteRecipe_userId_idx" ON "FavoriteRecipe"("userId");
CREATE INDEX "FavoriteRecipe_recipeId_idx" ON "FavoriteRecipe"("recipeId");

-- Add foreign key constraints
ALTER TABLE "FavoriteRecipe" ADD CONSTRAINT "FavoriteRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteRecipe" ADD CONSTRAINT "FavoriteRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
