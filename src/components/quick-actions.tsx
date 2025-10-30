'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Plus,
  CookingPot,
  CalendarPlus,
  ShoppingCart,
  Users,
  BookmarkPlus,
  Mic,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { openVoiceOverlay } from '@/components/voice/quick-open';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function QuickActions() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleNewRecipe = () => {
    router.push('/recipes/new');
    setOpen(false);
  };

  const handleNewMealPlan = () => {
    router.push('/meal-plan');
    setOpen(false);
    toast({
      title: 'Add to Meal Plan',
      description: 'Navigate to a recipe and click "Add to Meal Plan"',
    });
  };

  const handleVoiceCommand = () => {
    setOpen(false);
    openVoiceOverlay({ mode: 'full' });
  };

  const handleInviteFamily = () => {
    router.push('/household?invite=true');
    setOpen(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Plus className="h-5 w-5" />
                <span className="sr-only">Quick Actions</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-sm">Quick Actions</p>
            <p className="text-xs text-muted-foreground">Create and manage</p>
          </TooltipContent>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleNewRecipe} className="cursor-pointer">
              <CookingPot className="mr-2 h-4 w-4" />
              <span>New Recipe</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleNewMealPlan} className="cursor-pointer">
              <CalendarPlus className="mr-2 h-4 w-4" />
              <span>Add to Meal Plan</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleInviteFamily} className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span>Invite Family Member</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleVoiceCommand} className="cursor-pointer">
              <Mic className="mr-2 h-4 w-4" />
              <span>Voice Commands</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
