import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function MealGridTable({ 
  gridData, 
  weekStart, 
  weekEnd, 
  onPreviousWeek, 
  onNextWeek, 
  onCurrentWeek, 
  loading,
  groupsCount,
  staffCount 
}) {
  if (!gridData) {
    return null;
  }

  // Convert gridData object to array and sort by date
  const sortedDays = Object.entries(gridData)
    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
    .map(([date, data]) => ({ date, ...data }));

  // Configuration for regular meal rows
  const mealRowConfig = [
    { type: 'B', label: 'Breakfast', isTotal: true },
    { type: 'B', dietKey: 'vegetarian', label: '└ Vegetarian' },
    { type: 'B', dietKey: 'glutenFree', label: '└ Gluten-Free' },
    { type: 'B', dietKey: 'nutAllergy', label: '└ Nut Allergy' },
    { type: 'B', dietKey: 'other', label: '└ Other' },
    { type: 'L', label: 'Lunch', isTotal: true },
    { type: 'L', dietKey: 'vegetarian', label: '└ Vegetarian' },
    { type: 'L', dietKey: 'glutenFree', label: '└ Gluten-Free' },
    { type: 'L', dietKey: 'nutAllergy', label: '└ Nut Allergy' },
    { type: 'L', dietKey: 'other', label: '└ Other' },
    { type: 'D', label: 'Dinner', isTotal: true },
    { type: 'D', dietKey: 'vegetarian', label: '└ Vegetarian' },
    { type: 'D', dietKey: 'glutenFree', label: '└ Gluten-Free' },
    { type: 'D', dietKey: 'nutAllergy', label: '└ Nut Allergy' },
    { type: 'D', dietKey: 'other', label: '└ Other' }
  ];

  // Configuration for packed meal rows
  const packedMealRowConfig = [
    { type: 'pB', label: 'Packed Breakfast', isTotal: true },
    { type: 'pB', dietKey: 'vegetarian', label: '└ Vegetarian' },
    { type: 'pB', dietKey: 'glutenFree', label: '└ Gluten-Free' },
    { type: 'pB', dietKey: 'nutAllergy', label: '└ Nut Allergy' },
    { type: 'pB', dietKey: 'other', label: '└ Other' },
    { type: 'pL', label: 'Packed Lunch', isTotal: true },
    { type: 'pL', dietKey: 'vegetarian', label: '└ Vegetarian' },
    { type: 'pL', dietKey: 'glutenFree', label: '└ Gluten-Free' },
    { type: 'pL', dietKey: 'nutAllergy', label: '└ Nut Allergy' },
    { type: 'pL', dietKey: 'other', label: '└ Other' },
    { type: 'pD', label: 'Packed Dinner', isTotal: true },
    { type: 'pD', dietKey: 'vegetarian', label: '└ Vegetarian' },
    { type: 'pD', dietKey: 'glutenFree', label: '└ Gluten-Free' },
    { type: 'pD', dietKey: 'nutAllergy', label: '└ Nut Allergy' },
    { type: 'pD', dietKey: 'other', label: '└ Other' }
  ];

  // Helper function to get cell value
  const getCellValue = (day, row) => {
    if (row.isTotal) {
      return day[row.type]?.total || 0;
    } else {
      return day[row.type]?.dietary?.[row.dietKey] || 0;
    }
  };

  // Helper function to convert labels for PDF (replace └ with safe characters)
  const getPDFSafeLabel = (label) => {
    return label.replace('└ ', '  • '); // Replace └ with bullet point and proper spacing
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Simple test function to verify PDF libraries work
  const testPDF = () => {
    console.log('Testing PDF libraries...');
    try {
      const testDoc = new jsPDF();
      testDoc.text('Hello World', 20, 20);
      
      // Test autoTable function
      console.log('autoTable function available:', typeof testDoc.autoTable);
      console.log('autoTable imported:', typeof autoTable);
      
      testDoc.save('test.pdf');
      console.log('Simple PDF test successful');
    } catch (error) {
      console.error('PDF library test failed:', error);
      alert('PDF libraries not working: ' + error.message);
    }
  };

  // PDF Export Function
  const exportToPDF = () => {
    console.log('Export PDF button clicked'); // Debug log
    console.log('Available jsPDF:', typeof jsPDF); // Debug log
    console.log('Available autoTable:', typeof autoTable); // Debug log
    console.log('gridData:', gridData); // Debug log
    console.log('sortedDays:', sortedDays); // Debug log
    
    try {
      const doc = new jsPDF('landscape', 'pt', 'a4');
      console.log('jsPDF instance created'); // Debug log
      console.log('autoTable method available:', typeof doc.autoTable); // Debug log
      
      // Set up document properties
      doc.setProperties({
        title: 'Weekly Meal Grid',
        subject: 'Meal Planning Grid',
        author: 'Meal Grid Calculator',
        creator: 'Meal Grid Calculator'
      });

      // Calculate weekly totals first (needed for sub-header)
      const weeklyTotals = {
        regularBreakfast: 0,
        regularLunch: 0,
        regularDinner: 0,
        packedBreakfast: 0,
        packedLunch: 0,
        packedDinner: 0
      };

      // Sum up all totals across the week
      sortedDays.forEach(day => {
        weeklyTotals.regularBreakfast += day.B?.total || 0;
        weeklyTotals.regularLunch += day.L?.total || 0;
        weeklyTotals.regularDinner += day.D?.total || 0;
        weeklyTotals.packedBreakfast += day.pB?.total || 0;
        weeklyTotals.packedLunch += day.pL?.total || 0;
        weeklyTotals.packedDinner += day.pD?.total || 0;
      });

      // Calculate grand totals
      const totalRegularMeals = weeklyTotals.regularBreakfast + weeklyTotals.regularLunch + weeklyTotals.regularDinner;
      const totalPackedMeals = weeklyTotals.packedBreakfast + weeklyTotals.packedLunch + weeklyTotals.packedDinner;
      const grandTotal = totalRegularMeals + totalPackedMeals;

      // Add centered week range header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const weekRange = weekStart && weekEnd ? 
        `Week of ${formatDate(weekStart)} - ${formatDate(weekEnd)}` : 
        'Current Week';
      
      // Center the week range text
      const headerPageWidth = doc.internal.pageSize.width;
      const weekRangeWidth = doc.getTextWidth(weekRange);
      const weekRangeX = (headerPageWidth - weekRangeWidth) / 2;
      doc.text(weekRange, weekRangeX, 35);

      // Add compact weekly totals sub-header
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const totalsText = `Reg: B${weeklyTotals.regularBreakfast} L${weeklyTotals.regularLunch} D${weeklyTotals.regularDinner} (${totalRegularMeals}) | Pkg: B${weeklyTotals.packedBreakfast} L${weeklyTotals.packedLunch} D${weeklyTotals.packedDinner} (${totalPackedMeals}) | Total: ${grandTotal}`;
      const totalsWidth = doc.getTextWidth(totalsText);
      const totalsX = (headerPageWidth - totalsWidth) / 2;
      doc.text(totalsText, totalsX, 48);

      console.log('PDF header added'); // Debug log

      // Prepare table data
      const tableColumns = [
        'Meal Type',
        ...sortedDays.map(day => {
          const dayName = day.dayName;
          const dateStr = new Date(day.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          return `${dayName}\n${dateStr}`;
        })
      ];

      // Combine regular and packed meal rows for the table
      const allRows = [...mealRowConfig, ...packedMealRowConfig];
      const tableRows = allRows.map(row => [
        getPDFSafeLabel(row.label), // Use PDF-safe labels
        ...sortedDays.map(day => {
          const value = getCellValue(day, row);
          return value === 0 ? '' : value.toString(); // Show blank instead of 0
        })
      ]);

      console.log('Table data prepared, rows:', tableRows.length); // Debug log

      // Generate the table using the imported autoTable function
      autoTable(doc, {
        startY: 60,
        head: [tableColumns],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          textColor: [0, 0, 0], // Black text
          lineColor: [128, 128, 128],
          lineWidth: 0.3,
          halign: 'center', // Center align all text
          valign: 'middle'
        },
        headStyles: {
          fillColor: [59, 130, 246], // Blue header background
          textColor: [255, 255, 255], // White header text
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center', // Center align header text
          valign: 'middle'
        },
        columnStyles: {
          0: { 
            cellWidth: 100, 
            fontStyle: 'bold', 
            halign: 'left', // Left align meal type labels
            textColor: [0, 0, 0], // Ensure black text for meal types
            fontSize: 7
          }
        },
        didParseCell: function(data) {
          // Ensure all text is black
          data.cell.styles.textColor = [0, 0, 0];
          
          // Style total rows (regular meals)
          if (data.row.index < mealRowConfig.length) {
            const rowConfig = mealRowConfig[data.row.index];
            if (rowConfig.isTotal) {
              data.cell.styles.fillColor = [229, 231, 235]; // Gray background for totals
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [0, 0, 0]; // Ensure black text
            }
          } else {
            // Style packed meal rows
            const packedRowIndex = data.row.index - mealRowConfig.length;
            const rowConfig = packedMealRowConfig[packedRowIndex];
            if (rowConfig.isTotal) {
              data.cell.styles.fillColor = [254, 240, 138]; // Yellow background for packed totals
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.textColor = [0, 0, 0]; // Ensure black text
            } else {
              data.cell.styles.fillColor = [254, 252, 232]; // Light yellow for packed dietary
              data.cell.styles.textColor = [0, 0, 0]; // Ensure black text
            }
          }
          
          // Center align all data cells except the first column (meal types)
          if (data.column.index > 0) {
            data.cell.styles.halign = 'center';
          }
        },
        margin: { top: 60, right: 30, bottom: 30, left: 30 },
        tableWidth: 'auto'
      });

      console.log('AutoTable generated'); // Debug log

      // Always place signature section right after the table on the first page
      const tableEndY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 400;
      const signatureY = tableEndY + 20; // Small gap after table
      
      // Add signature section - compact to fit after table
      
      // Create compact signature boxes side by side - properly centered
      const signaturePageWidth = doc.internal.pageSize.width;
      const sigBoxWidth = 250; // Slightly smaller for better balance
      const sigBoxHeight = 45; // Reduced height without print name
      const totalBoxesWidth = sigBoxWidth * 2;
      const spaceBetweenBoxes = 40; // Gap between the two boxes
      const totalWidth = totalBoxesWidth + spaceBetweenBoxes;
      
      // Center the entire signature section
      const startX = (signaturePageWidth - totalWidth) / 2;
      const leftBoxX = startX;
      const rightBoxX = startX + sigBoxWidth + spaceBetweenBoxes;
      
      // Set border styling
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      
      // Left signature box (Kitchen Manager)
      doc.rect(leftBoxX, signatureY, sigBoxWidth, sigBoxHeight);
      
      // Right signature box (Operations Manager)
      doc.rect(rightBoxX, signatureY, sigBoxWidth, sigBoxHeight);
      
      // Kitchen Manager section - compact
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text('KITCHEN MANAGER', leftBoxX + 8, signatureY + 12);
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      
      // Single line with signature and date
      doc.text('Signature:', leftBoxX + 8, signatureY + 25);
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(leftBoxX + 40, signatureY + 23, leftBoxX + 140, signatureY + 23);
      
      doc.text('Date:', leftBoxX + 150, signatureY + 25);
      doc.line(leftBoxX + 165, signatureY + 23, leftBoxX + sigBoxWidth - 8, signatureY + 23);
      
      // Operations Manager section - compact
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text('OPERATIONS MANAGER', rightBoxX + 8, signatureY + 12);
      
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      
      // Single line with signature and date
      doc.text('Signature:', rightBoxX + 8, signatureY + 25);
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(rightBoxX + 40, signatureY + 23, rightBoxX + 140, signatureY + 23);
      
      doc.text('Date:', rightBoxX + 150, signatureY + 25);
      doc.line(rightBoxX + 165, signatureY + 23, rightBoxX + sigBoxWidth - 8, signatureY + 23);
      
      // Add compact approval notes section
      const notesY = signatureY + 55;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text('APPROVAL NOTES:', 40, notesY);
      
      // Very compact notes box
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.rect(40, notesY + 8, doc.internal.pageSize.width - 80, 25);

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${i} of ${pageCount} | Camp Food Order Management System`,
          40,
          doc.internal.pageSize.height - 20
        );
      }

      console.log('PDF content complete, attempting to save'); // Debug log

      // Save the PDF
      const fileName = `meal-grid-${weekStart ? formatDate(weekStart) : 'current'}.pdf`;
      doc.save(fileName);
      
      console.log('PDF saved successfully:', fileName); // Debug log
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + error.message);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden mt-6">
      {/* Enhanced Blue Header with Navigation */}
      <div className="px-6 py-4 bg-blue-600">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Weekly Meal Grid</h2>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Export PDF Button */}
            <button
              onClick={exportToPDF}
              className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-md transition-colors font-medium text-sm flex items-center space-x-2"
              title="Export to PDF"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Export PDF</span>
            </button>

            {/* Groups and Staff Stats */}
            <div className="text-right text-sm text-blue-100 mr-4">
              <div>Groups: {groupsCount}</div>
              <div>Staff: {staffCount}</div>
            </div>
            
            {/* Navigation Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onPreviousWeek}
                disabled={loading}
                className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous Week"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center">
                <div className="text-sm font-medium text-blue-100">
                  {weekStart && weekEnd ? (
                    `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
                  ) : (
                    'Select a week'
                  )}
                </div>
                <button
                  onClick={onCurrentWeek}
                  className="text-xs text-blue-200 hover:text-white mt-1 underline"
                >
                  Go to current week
                </button>
              </div>
              
              <button
                onClick={onNextWeek}
                disabled={loading}
                className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next Week"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                Meal Type
              </th>
              {sortedDays.map((day) => (
                <th key={day.date} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                  <div className="flex flex-col">
                    <span>{day.dayName}</span>
                    <span className="text-gray-400 normal-case text-xs mt-1">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Regular Meals */}
            {mealRowConfig.map((row, index) => (
              <tr key={`meal-${index}`} className={`${
                row.isTotal 
                  ? 'bg-gray-200 font-bold' 
                  : 'bg-white'
              }`}>
                <td className={`px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r ${
                  row.isTotal 
                    ? 'font-bold' 
                    : 'pl-6 text-gray-600'
                }`}>
                  {row.label}
                </td>
                {sortedDays.map((day) => (
                  <td key={day.date} className="px-4 py-2 whitespace-nowrap text-sm text-center border-r">
                    {getCellValue(day, row) || ''}
                  </td>
                ))}
              </tr>
            ))}
            
            {/* Packed Meals */}
            {packedMealRowConfig.map((row, index) => (
              <tr key={`packed-${index}`} className={`${
                row.isTotal 
                  ? 'bg-yellow-200 font-bold' 
                  : 'bg-yellow-50'
              }`}>
                <td className={`px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r ${
                  row.isTotal 
                    ? 'font-bold' 
                    : 'pl-6 text-gray-600'
                }`}>
                  {row.label}
                </td>
                {sortedDays.map((day) => (
                  <td key={day.date} className="px-4 py-2 whitespace-nowrap text-sm text-center border-r">
                    {getCellValue(day, row) || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Week starting: {sortedDays[0]?.date ? new Date(sortedDays[0].date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }) : ''}</span>
          <span className="flex items-center">
            <span className="inline-block w-4 h-4 bg-yellow-200 border border-yellow-300 rounded mr-2"></span>
            Packed meals highlighted
          </span>
        </div>
      </div>
    </div>
  );
}

export default MealGridTable;