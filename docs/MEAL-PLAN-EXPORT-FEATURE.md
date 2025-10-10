# Meal Plan Export Feature

## Overview
The meal planning section now has a fully functional export feature that allows users to download their meal plans in multiple formats.

## Features

### Export Formats
1. **PDF Document** - Professional, printable format with:
   - Meal plan title and date range
   - Meals organized by date
   - Meal type, recipe name, servings, and notes
   - Page numbers and generation timestamp
   - Clean, formatted layout for printing

2. **CSV Spreadsheet** - Data format compatible with:
   - Microsoft Excel
   - Google Sheets
   - Apple Numbers
   - Any spreadsheet application
   - Easy to import and manipulate

### Usage

1. **Open Meal Planning Calendar**
   - Navigate to the meal planning section
   - Ensure you have an active meal plan

2. **Click Export Button**
   - Located in the top toolbar
   - Only enabled when you have an active meal plan

3. **Choose Format**
   - Select between PDF or CSV
   - PDF: Best for printing and sharing
   - CSV: Best for data analysis and spreadsheets

4. **Download**
   - Click "Export" button
   - File downloads automatically
   - Filename format: `Plan_Name_YYYY-MM-DD.pdf/csv`

## Implementation Details

### Files Created

1. **`src/lib/meal-plan-export.ts`**
   - Core export logic
   - `exportMealPlanToPDF()` - Generates PDF using jsPDF
   - `exportMealPlanToCSV()` - Generates CSV format
   - `downloadPDF()` - Handles PDF file download
   - `downloadCSV()` - Handles CSV file download

2. **`src/components/calendar/export-dialog.tsx`**
   - User interface for export options
   - Format selection with radio buttons
   - Loading states and error handling
   - Toast notifications for success/failure

### Files Modified

1. **`src/components/meal-planning-calendar.tsx`**
   - Added export dialog state management
   - Integrated ExportDialog component
   - Connected Export button to dialog

### Dependencies

- **jsPDF** (`npm install jspdf`) - PDF generation library
- **date-fns** - Date formatting (already installed)

## Technical Features

### PDF Export
- Multi-page support (automatically adds pages when needed)
- Meals grouped by date for better organization
- Formatted headers and sections
- Footer with page numbers and generation date
- Proper text wrapping for long notes
- Professional typography and spacing

### CSV Export
- Standard CSV format with proper escaping
- Headers: Date, Day, Meal Type, Recipe/Meal, Servings, Notes, Status
- Chronologically sorted meals
- Quote-escaped values for data integrity
- Compatible with all major spreadsheet applications

### Error Handling
- Try-catch blocks for graceful error recovery
- User-friendly error messages via toast notifications
- Loading states during export generation
- Disabled state when no active meal plan exists

## Code Quality

✅ **TypeScript** - Fully typed with proper interfaces
✅ **Error Handling** - Comprehensive error catching
✅ **User Feedback** - Loading states and toast notifications
✅ **Accessibility** - Proper labels and keyboard navigation
✅ **Performance** - Dynamic imports to reduce bundle size
✅ **Clean Code** - Well-organized, documented functions

## Future Enhancements (Optional)

- **Email Export** - Send meal plan directly via email
- **Print Preview** - Preview before exporting
- **Custom Date Range** - Export specific date ranges
- **Recipe Details** - Include full recipe instructions in PDF
- **Shopping List Integration** - Include shopping list in export
- **iCal Export** - Calendar format for importing into calendar apps
- **JSON Export** - For backup and migration purposes

## Testing

To test the export feature:

1. Create or select an active meal plan
2. Add some meals to the plan
3. Click the "Export" button
4. Select PDF format and export
5. Verify PDF opens correctly with all meal details
6. Select CSV format and export
7. Open CSV in Excel/Sheets and verify data

## Browser Compatibility

✅ Chrome/Edge (Latest)
✅ Firefox (Latest)
✅ Safari (Latest)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- Export button is only enabled when an active meal plan exists
- PDF generation may take a few seconds for large meal plans
- CSV files can be opened directly in Excel/Sheets
- Exported files use sanitized meal plan names in filenames
- All dates are formatted in a user-friendly manner

## Support

If users encounter issues:
1. Ensure they have an active meal plan with meals
2. Check browser console for any errors
3. Try a different export format
4. Clear browser cache and retry
5. Ensure browser allows file downloads
