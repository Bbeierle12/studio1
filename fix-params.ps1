# Script to fix Next.js 15 async params in all route files

$files = @(
    "src\app\api\admin\users\[id]\route.ts",
    "src\app\api\recipes\[id]\nutrition\route.ts",
    "src\app\api\recipes\[id]\favorite\route.ts",
    "src\app\api\admin\security\example-protected-route.ts",
    "src\app\api\admin\recipes\[id]\route.ts",
    "src\app\api\admin\recipes\[id]\feature\route.ts",
    "src\app\api\admin\features\[id]\route.ts",
    "src\app\api\meal-templates\[id]\route.ts",
    "src\app\api\meal-plans\[id]\route.ts",
    "src\app\api\meal-plans\[id]\meals\route.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Processing $file..."
        $content = Get-Content $fullPath -Raw
        
        # Replace params type definition
        $content = $content -replace '\{ params \}: \{ params: \{ id: string \} \}', '{ params }: { params: Promise<{ id: string }> }'
        
        # Add await params at the start of each function
        $content = $content -replace '(\basync function (GET|POST|PUT|DELETE|PATCH)\([^)]+\) \{[^\n]*\n)(\s*try \{[^\n]*\n)', '$1$3    const { id } = await params;`n'
        
        # Replace params.id with id
        $content = $content -replace 'params\.id', 'id'
        
        Set-Content $fullPath -Value $content -NoNewline
        Write-Host "Fixed $file"
    }
}

Write-Host "Done!"
