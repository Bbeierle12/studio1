'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  ShoppingCart,
  BookMarked,
  Sparkles,
  Filter,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface RecipeSidebarProps {
  activeTab: string;
}

export function RecipeSidebar({ activeTab }: RecipeSidebarProps) {
  return (
    <div className="hidden md:block w-64 border-r bg-muted/30 p-4 space-y-6 overflow-auto">
      {/* Quick Actions */}
      <div>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" size="sm" asChild>
            <Link href="/meal-planning">
              <Calendar className="h-4 w-4 mr-2" />
              Meal Planning
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm" asChild>
            <Link href="/shopping-list">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Shopping List
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <BookMarked className="h-4 w-4 mr-2" />
            Collections
          </Button>
        </div>
      </div>

      <Separator />

      {/* Context-Aware Content */}
      {activeTab === 'browse' && (
        <>
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Categories
            </h3>
            <div className="space-y-1.5">
              {['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Drinks'].map((category) => (
                <Button
                  key={category}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-sm mb-3">Cuisines</h3>
            <div className="flex flex-wrap gap-1.5">
              {['Italian', 'Mexican', 'Asian', 'American', 'Indian', 'French'].map((cuisine) => (
                <Badge 
                  key={cuisine} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-secondary text-xs"
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-sm mb-3">Difficulty</h3>
            <div className="space-y-1.5">
              {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                <Button
                  key={difficulty}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                >
                  {difficulty}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'create' && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Tips</h3>
          <Card className="p-3">
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li>• Use high-quality photos for better AI results</li>
              <li>• Be descriptive with ingredients</li>
              <li>• Break instructions into clear steps</li>
              <li>• Add relevant tags for discovery</li>
            </ul>
          </Card>
        </div>
      )}

      {activeTab === 'my-recipes' && (
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Stats
          </h3>
          <Card className="p-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Recipes</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Favorites</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">This Month</span>
                <span className="font-medium">3</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Featured/Popular Recipes */}
      <Separator />
      
      <div>
        <h3 className="font-semibold text-sm mb-3">Popular This Week</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer">
              <div className="w-12 h-12 bg-secondary rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Recipe Name {i}</p>
                <p className="text-xs text-muted-foreground">30 min</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
