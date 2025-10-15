'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasPermission } from '@/lib/admin-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreVertical,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  ExternalLink,
  User,
  Heart,
  Calendar,
  Star,
  Edit,
  Flag,
} from 'lucide-react';
import { UserRole } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

interface Recipe {
  id: string;
  title: string;
  slug: string;
  contributor: string;
  course: string | null;
  cuisine: string | null;
  difficulty: string | null;
  imageUrl: string;
  summary: string;
  prepTime: number | null;
  servings: number | null;
  userId: string;
  isFeatured?: boolean;
  featuredAt?: string | null;
  isReported?: boolean;
  reportCount?: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
  };
  _count: {
    favorites: number;
    plans: number;
    plannedMeals: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function RecipeManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    totalCount: 0,
    totalPages: 0,
  });
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [cuisineFilter, setCuisineFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [reportedFilter, setReportedFilter] = useState<string>('all'); // all, reported, not-reported

  useEffect(() => {
    if (!loading && (!user || !user.role || !hasPermission(user.role, 'VIEW_ALL_RECIPES'))) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role && hasPermission(user.role, 'VIEW_ALL_RECIPES')) {
      fetchRecipes();
    }
  }, [user, pagination.page, search, courseFilter, cuisineFilter, difficultyFilter, reportedFilter]);

  const fetchRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (courseFilter !== 'all') params.append('course', courseFilter);
      if (cuisineFilter !== 'all') params.append('cuisine', cuisineFilter);
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
      if (reportedFilter !== 'all') params.append('reported', reportedFilter);

      const response = await fetch(`/api/admin/recipes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
        setPagination(data.pagination);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch recipes',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch recipes',
        variant: 'destructive',
      });
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleDeleteRecipe = async (recipeId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Recipe deleted successfully',
        });
        fetchRecipes();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete recipe',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete recipe',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (recipeId: string, currentStatus: boolean, title: string) => {
    try {
      const response = await fetch(`/api/admin/recipes/${recipeId}/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: !currentStatus 
            ? `"${title}" is now featured` 
            : `"${title}" is no longer featured`,
        });
        fetchRecipes();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update recipe',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update recipe',
        variant: 'destructive',
      });
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    if (!difficulty) return 'bg-gray-100 text-gray-800';
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !user) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user.role || !hasPermission(user.role, 'VIEW_ALL_RECIPES')) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-3xl font-bold'>Recipe Management</h1>
            <p className='text-muted-foreground'>
              View, edit, and moderate all recipes
            </p>
          </div>
          <Button onClick={fetchRecipes} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search by title, contributor, or summary...'
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className='w-full md:w-[160px]'>
                  <SelectValue placeholder='Course' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Courses</SelectItem>
                  <SelectItem value='Appetizer'>Appetizer</SelectItem>
                  <SelectItem value='Main'>Main</SelectItem>
                  <SelectItem value='Dessert'>Dessert</SelectItem>
                  <SelectItem value='Side'>Side</SelectItem>
                  <SelectItem value='Breakfast'>Breakfast</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                <SelectTrigger className='w-full md:w-[160px]'>
                  <SelectValue placeholder='Cuisine' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Cuisines</SelectItem>
                  <SelectItem value='Italian'>Italian</SelectItem>
                  <SelectItem value='American'>American</SelectItem>
                  <SelectItem value='Mexican'>Mexican</SelectItem>
                  <SelectItem value='Asian'>Asian</SelectItem>
                  <SelectItem value='Other'>Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className='w-full md:w-[160px]'>
                  <SelectValue placeholder='Difficulty' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Levels</SelectItem>
                  <SelectItem value='Easy'>Easy</SelectItem>
                  <SelectItem value='Medium'>Medium</SelectItem>
                  <SelectItem value='Hard'>Hard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={reportedFilter} onValueChange={setReportedFilter}>
                <SelectTrigger className='w-full md:w-[160px]'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Recipes</SelectItem>
                  <SelectItem value='reported'>⚠️ Reported</SelectItem>
                  <SelectItem value='not-reported'>✓ Not Reported</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {loadingRecipes ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin' />
              </div>
            ) : recipes.length === 0 ? (
              <div className='text-center py-12'>
                <p className='text-muted-foreground'>No recipes found</p>
              </div>
            ) : (
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {recipes.map((recipe) => (
                    <Card key={recipe.id} className='overflow-hidden'>
                      <div className='relative h-48'>
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          fill
                          className='object-cover'
                        />
                        {recipe.difficulty && (
                          <Badge
                            className={`absolute top-2 right-2 ${getDifficultyColor(recipe.difficulty)}`}
                          >
                            {recipe.difficulty}
                          </Badge>
                        )}
                      </div>
                      <CardHeader className='pb-3'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-1 min-w-0'>
                            <CardTitle className='text-lg truncate'>
                              {recipe.title}
                            </CardTitle>
                            <CardDescription className='text-sm'>
                              by {recipe.contributor}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                <MoreVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/recipes/${recipe.slug}`} target='_blank'>
                                  <ExternalLink className='h-4 w-4 mr-2' />
                                  View Recipe
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${recipe.userId}`}>
                                  <User className='h-4 w-4 mr-2' />
                                  View Author
                                </Link>
                              </DropdownMenuItem>
                              {hasPermission(user.role!, 'EDIT_ANY_RECIPE') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/recipes/${recipe.slug}/edit`}>
                                      <Edit className='h-4 w-4 mr-2' />
                                      Edit Recipe
                                    </Link>
                                  </DropdownMenuItem>
                                </>
                              )}
                              {hasPermission(user.role!, 'FEATURE_RECIPES') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleToggleFeatured(recipe.id, recipe.isFeatured || false, recipe.title)}
                                  >
                                    <Star className={`h-4 w-4 mr-2 ${recipe.isFeatured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                    {recipe.isFeatured ? 'Unfeature' : 'Feature'}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {hasPermission(user.role!, 'DELETE_ANY_RECIPE') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteRecipe(recipe.id, recipe.title)}
                                    className='text-destructive'
                                  >
                                    <Trash2 className='h-4 w-4 mr-2' />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <p className='text-sm text-muted-foreground line-clamp-2'>
                          {recipe.summary}
                        </p>
                        <div className='flex flex-wrap gap-2'>
                          {recipe.isFeatured && (
                            <Badge className='bg-yellow-100 text-yellow-800'>
                              <Star className='h-3 w-3 mr-1 fill-yellow-600' />
                              Featured
                            </Badge>
                          )}
                          {recipe.isReported && (
                            <Badge className='bg-red-100 text-red-800'>
                              <Flag className='h-3 w-3 mr-1' />
                              Reported {recipe.reportCount ? `(${recipe.reportCount})` : ''}
                            </Badge>
                          )}
                          {recipe.course && (
                            <Badge variant='outline'>{recipe.course}</Badge>
                          )}
                          {recipe.cuisine && (
                            <Badge variant='outline'>{recipe.cuisine}</Badge>
                          )}
                        </div>
                        <div className='flex items-center justify-between text-sm text-muted-foreground pt-2 border-t'>
                          <div className='flex items-center gap-3'>
                            <div className='flex items-center gap-1'>
                              <Heart className='h-4 w-4' />
                              {recipe._count.favorites}
                            </div>
                            <div className='flex items-center gap-1'>
                              <Calendar className='h-4 w-4' />
                              {recipe._count.plannedMeals}
                            </div>
                          </div>
                          <div className='text-xs'>
                            {new Date(recipe.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className='flex items-center justify-between mt-6'>
                  <div className='text-sm text-muted-foreground'>
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalCount
                    )}{' '}
                    of {pagination.totalCount} recipes
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page - 1 })
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className='h-4 w-4' />
                      Previous
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page + 1 })
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                      <ChevronRight className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
