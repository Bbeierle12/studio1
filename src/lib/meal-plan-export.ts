import { MealPlan, PlannedMeal } from '@/lib/types';
import { format } from 'date-fns';

/**
 * Export meal plan to CSV format
 */
export function exportMealPlanToCSV(mealPlan: MealPlan): string {
  const headers = ['Date', 'Day', 'Meal Type', 'Recipe/Meal', 'Servings', 'Notes', 'Status'];
  const rows = [headers];
  
  // Sort meals by date
  const sortedMeals = [...(mealPlan.meals || [])].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  sortedMeals.forEach((meal) => {
    const date = new Date(meal.date);
    rows.push([
      format(date, 'yyyy-MM-dd'),
      format(date, 'EEEE'),
      meal.mealType,
      meal.recipe?.title || meal.customMealName || 'Not specified',
      meal.servings?.toString() || '',
      meal.notes || '',
      meal.isCompleted ? 'Completed' : 'Planned',
    ]);
  });
  
  // Escape quotes and wrap fields in quotes
  return rows.map(row => 
    row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

/**
 * Export meal plan to PDF using jsPDF
 */
export async function exportMealPlanToPDF(mealPlan: MealPlan): Promise<Blob> {
  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  let yPos = 20;
  const lineHeight = 7;
  const pageHeight = 280;
  const leftMargin = 20;
  const rightMargin = 190;
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(mealPlan.name, leftMargin, yPos);
  yPos += 10;
  
  // Add date range
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const dateRange = `${format(new Date(mealPlan.startDate), 'MMM d, yyyy')} - ${format(new Date(mealPlan.endDate), 'MMM d, yyyy')}`;
  doc.text(dateRange, leftMargin, yPos);
  yPos += 10;
  
  // Add line separator
  doc.setLineWidth(0.5);
  doc.line(leftMargin, yPos, rightMargin, yPos);
  yPos += 10;
  
  // Sort meals by date
  const sortedMeals = [...(mealPlan.meals || [])].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Group meals by date
  const mealsByDate = groupMealsByDate(sortedMeals);
  
  // Add meals grouped by date
  Object.entries(mealsByDate).forEach(([dateStr, meals]) => {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    // Date header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(format(new Date(dateStr), 'EEEE, MMMM d, yyyy'), leftMargin, yPos);
    yPos += lineHeight;
    
    // Meals for this date
    meals.forEach((meal) => {
      // Check if we need a new page
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`  ${meal.mealType}:`, leftMargin, yPos);
      
      doc.setFont('helvetica', 'normal');
      const mealName = meal.recipe?.title || meal.customMealName || 'Not specified';
      doc.text(mealName, leftMargin + 30, yPos);
      yPos += lineHeight;
      
      // Add servings and notes if available
      if (meal.servings) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`    Servings: ${meal.servings}`, leftMargin, yPos);
        yPos += 5;
      }
      
      if (meal.notes) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        const notesLines = doc.splitTextToSize(`    Notes: ${meal.notes}`, rightMargin - leftMargin);
        doc.text(notesLines, leftMargin, yPos);
        yPos += notesLines.length * 5;
      }
      
      // Reset color
      doc.setTextColor(0);
      yPos += 2;
    });
    
    yPos += 5; // Extra space between dates
  });
  
  // Add footer with generation date
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      `Generated on ${format(new Date(), 'MMM d, yyyy')} - Page ${i} of ${totalPages}`,
      leftMargin,
      290
    );
  }
  
  return doc.output('blob');
}

/**
 * Helper function to group meals by date
 */
function groupMealsByDate(meals: PlannedMeal[]): Record<string, PlannedMeal[]> {
  return meals.reduce((acc, meal) => {
    const dateKey = new Date(meal.date).toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(meal);
    return acc;
  }, {} as Record<string, PlannedMeal[]>);
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, filename: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
