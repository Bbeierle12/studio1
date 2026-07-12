import { NextRequest, NextResponse } from 'next/server';
import { importRecipeFromUrl } from '@/lib/recipe-importer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const recipe = await importRecipeFromUrl(url);
    
    return NextResponse.json({ recipe }, { status: 200 });
  } catch (error: any) {
    console.error('Recipe import API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import recipe' },
      { status: 500 }
    );
  }
}
