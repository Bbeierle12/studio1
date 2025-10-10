'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecipeFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeFilterSidebar({ isOpen, onClose }: RecipeFilterSidebarProps) {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [maxPrepTime, setMaxPrepTime] = useState<number>(120);

  const cuisines = [
    'Italian',
    'Chinese',
    'Mexican',
    'French',
    'Japanese',
    'Indian',
    'Thai',
    'American',
    'Mediterranean',
    'Korean',
    'Greek',
    'Vietnamese',
  ];

  const difficulties = ['Easy', 'Medium', 'Hard'];
  const courses = ['Appetizer', 'Main', 'Side', 'Dessert', 'Beverage', 'Snack'];

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleDifficultyToggle = (difficulty: string) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const handleCourseToggle = (course: string) => {
    setSelectedCourses(prev =>
      prev.includes(course)
        ? prev.filter(c => c !== course)
        : [...prev, course]
    );
  };

  const handleReset = () => {
    setSelectedCuisines([]);
    setSelectedDifficulties([]);
    setSelectedCourses([]);
    setMaxPrepTime(120);
  };

  const activeFilterCount = 
    selectedCuisines.length + 
    selectedDifficulties.length + 
    selectedCourses.length +
    (maxPrepTime < 120 ? 1 : 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 bottom-0 w-80 bg-background border-r shadow-lg z-50 transform transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Recipe Filters</h3>
              {activeFilterCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Prep Time */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Max Prep Time
                  {maxPrepTime < 120 && (
                    <Badge variant="secondary" className="ml-2">
                      {maxPrepTime} min
                    </Badge>
                  )}
                </Label>
                <Slider
                  value={[maxPrepTime]}
                  onValueChange={(value) => setMaxPrepTime(value[0])}
                  min={5}
                  max={120}
                  step={5}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 min</span>
                  <span>2+ hours</span>
                </div>
              </div>

              <Separator />

              {/* Difficulty */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Difficulty
                  {selectedDifficulties.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedDifficulties.length}
                    </Badge>
                  )}
                </Label>
                <div className="space-y-2">
                  {difficulties.map((difficulty) => (
                    <div key={difficulty} className="flex items-center space-x-2">
                      <Checkbox
                        id={`difficulty-${difficulty}`}
                        checked={selectedDifficulties.includes(difficulty)}
                        onCheckedChange={() => handleDifficultyToggle(difficulty)}
                      />
                      <Label
                        htmlFor={`difficulty-${difficulty}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {difficulty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Course */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Course Type
                  {selectedCourses.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedCourses.length}
                    </Badge>
                  )}
                </Label>
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div key={course} className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${course}`}
                        checked={selectedCourses.includes(course)}
                        onCheckedChange={() => handleCourseToggle(course)}
                      />
                      <Label
                        htmlFor={`course-${course}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {course}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Cuisine */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">
                  Cuisine
                  {selectedCuisines.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedCuisines.length}
                    </Badge>
                  )}
                </Label>
                <div className="space-y-2">
                  {cuisines.map((cuisine) => (
                    <div key={cuisine} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cuisine-${cuisine}`}
                        checked={selectedCuisines.includes(cuisine)}
                        onCheckedChange={() => handleCuisineToggle(cuisine)}
                      />
                      <Label
                        htmlFor={`cuisine-${cuisine}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {cuisine}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleReset}
              disabled={activeFilterCount === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
