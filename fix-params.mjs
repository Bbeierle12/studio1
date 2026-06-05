import fs from 'fs';

const filesToFix = [
  'src/app/api/admin/features/[id]/route.ts',
  'src/app/api/admin/recipes/[id]/feature/route.ts',
  'src/app/api/admin/recipes/[id]/route.ts',
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/meal-plans/[id]/meals/route.ts',
  'src/app/api/meal-plans/[id]/route.ts',
  'src/app/api/meal-templates/[id]/route.ts',
  'src/app/api/recipes/[id]/favorite/route.ts',
  'src/app/api/recipes/[id]/nutrition/route.ts',
  'src/app/recipes/[id]/edit/page.tsx',
  'src/app/recipes/[id]/page.tsx'
];

for (const file of filesToFix) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix: { params }: { params: { id: string } } -> { params }: { params: Promise<{ id: string }> }
    content = content.replace(/\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{\s*id\s*:\s*string\s*\}\s*\}/g, '{ params }: { params: Promise<{ id: string }> }');
    
    // Fix RouteContext
    content = content.replace(/\{\s*params\s*\}\s*:\s*RouteContext/g, '{ params }: { params: Promise<{ id: string }> }');
    
    // Fix page props
    content = content.replace(/params\s*:\s*\{\s*id\s*:\s*string\s*\}/g, 'params: Promise<{ id: string }>');

    // Fix `const { id } = params;` -> `const { id } = await params;`
    content = content.replace(/const\s+\{\s*id\s*\}\s*=\s*params\s*;/g, 'const { id } = await params;');

    // Fix `const id = params.id;` -> `const { id } = await params;`
    content = content.replace(/const\s+id\s*=\s*params\.id\s*;/g, 'const { id } = await params;');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  } else {
    console.log('Not found:', file);
  }
}
