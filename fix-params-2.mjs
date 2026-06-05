import fs from 'fs';
import { globSync } from 'glob';

const files = [
  'src/app/api/admin/recipes/[id]/feature/route.ts',
  'src/app/api/admin/recipes/[id]/route.ts',
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/meal-plans/[id]/meals/route.ts',
  'src/app/api/meal-templates/[id]/route.ts',
  'src/app/api/recipes/[id]/favorite/route.ts'
];

for (const file of [...new Set(files)]) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Convert `params.id` to `(await params).id`
    if (content.includes('params.id') && !content.includes('await params')) {
        content = content.replace(/params\.id/g, '(await params).id');
    }
    // Also if there is already an await params somewhere but params.id is used elsewhere
    content = content.replace(/params\.id/g, '(await params).id');
    // It's safe to do this if we haven't destructured it
    
    // Destructuring with rename: `const { id: mealPlanId } = params;`
    content = content.replace(/const\s+\{\s*id\s*:\s*([a-zA-Z0-9_]+)\s*\}\s*=\s*params\s*;/g, 'const { id: $1 } = await params;');

    fs.writeFileSync(file, content, 'utf8');
  }
}
