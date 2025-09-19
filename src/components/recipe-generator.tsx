'use client';

import { useState, useRef, useTransition } from 'react';
import { generateRecipeAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

export function RecipeGenerator() {
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!previewUrl || !title) {
      // Basic client-side validation
      // More robust error handling is on the server
      return;
    }
    const formData = new FormData(event.currentTarget);
    formData.set('photoDataUri', previewUrl);

    startTransition(() => {
      generateRecipeAction(formData);
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-2'>
        <Label htmlFor='title'>What is this dish called?</Label>
        <Input
          id='title'
          name='title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder='e.g., Spicy Tomato Pasta'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='photo'>Upload a Photo</Label>
        {previewUrl ? (
          <div className='relative group'>
            <Image
              src={previewUrl}
              alt='Dish preview'
              width={600}
              height={400}
              className='rounded-md object-cover aspect-video w-full'
            />
            <Button
              variant='destructive'
              size='icon'
              className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'
              onClick={handleRemoveImage}
              type='button'
            >
              <X className='h-4 w-4' />
              <span className='sr-only'>Remove image</span>
            </Button>
          </div>
        ) : (
          <div
            className='flex items-center justify-center w-full'
            onClick={() => fileInputRef.current?.click()}
          >
            <div className='flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent'>
              <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                <UploadCloud className='w-8 h-8 mb-4 text-muted-foreground' />
                <p className='mb-2 text-sm text-muted-foreground'>
                  <span className='font-semibold'>Click to upload</span> or drag
                  and drop
                </p>
                <p className='text-xs text-muted-foreground'>
                  PNG, JPG, or WEBP
                </p>
              </div>
              <Input
                id='photo'
                name='photo'
                type='file'
                className='hidden'
                ref={fileInputRef}
                onChange={handleFileChange}
                accept='image/png, image/jpeg, image/webp'
                required
              />
            </div>
          </div>
        )}
      </div>

      <Button
        type='submit'
        className='w-full'
        disabled={isPending || !previewUrl || !title}
      >
        {isPending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Generating...
          </>
        ) : (
          'Generate Recipe'
        )}
      </Button>
    </form>
  );
}
