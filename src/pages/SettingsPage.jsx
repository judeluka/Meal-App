import { useState, useEffect, useContext } from 'react';
import Papa from 'papaparse';
import { CentreContext } from '../context/CentreContext.jsx';

function SettingsPage() {
  // Groups import state
  const [csvFile, setCsvFile] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMethod, setImportMethod] = useState('file'); // 'file' or 'paste'

  // Staff import state
  const [staffCsvFile, setStaffCsvFile] = useState(null);
  const [staffCsvText, setStaffCsvText] = useState('');
  const [staffStatusMessage, setStaffStatusMessage] = useState('');
  const [isImportingStaff, setIsImportingStaff] = useState(false);
  const [staffImportMethod, setStaffImportMethod] = useState('file'); // 'file' or 'paste'

  // Meal time configuration state
  const [mealTimes, setMealTimes] = useState({
    breakfast: '09:00',
    lunch: '13:00',
    dinner: '18:00'
  });
  const [mealTimeMessage, setMealTimeMessage] = useState('');
  const [isSavingMealTimes, setIsSavingMealTimes] = useState(false);

  const { centre } = useContext(CentreContext);

  // Load meal times from localStorage on component mount
  useEffect(() => {
    const savedMealTimes = localStorage.getItem('mealTimes');
    if (savedMealTimes) {
      try {
        const parsedTimes = JSON.parse(savedMealTimes);
        setMealTimes(parsedTimes);
      } catch (error) {
        console.error('Error parsing saved meal times:', error);
      }
    }
  }, []);

  // Helper function to convert DD/MM/YYYY to YYYY-MM-DD
  const convertDateFormat = (dateString) => {
    if (!dateString) return '';
    
    // Remove any extra whitespace
    const cleanDate = dateString.trim();
    
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return cleanDate;
    }
    
    // Check if it's in DD/MM/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDate)) {
      const [day, month, year] = cleanDate.split('/');
      // Pad day and month with leading zeros if needed
      const paddedDay = day.padStart(2, '0');
      const paddedMonth = month.padStart(2, '0');
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
    
    // Return empty string if format is not recognized
    return '';
  };

  // Helper function to find column value with flexible matching
  const getColumnValue = (row, possibleNames) => {
    for (const name of possibleNames) {
      // Try exact match first
      if (row[name] !== undefined) return row[name];
      
      // Try case-insensitive match
      const keys = Object.keys(row);
      const matchingKey = keys.find(key => key.toLowerCase() === name.toLowerCase());
      if (matchingKey && row[matchingKey] !== undefined) return row[matchingKey];
    }
    return '';
  };

  // Meal time configuration handlers
  const handleMealTimeChange = (mealType, time) => {
    setMealTimes(prev => ({
      ...prev,
      [mealType]: time
    }));
    setMealTimeMessage(''); // Clear any previous message
  };

  const saveMealTimes = async () => {
    setIsSavingMealTimes(true);
    setMealTimeMessage('');

    try {
      // Validate times are in correct format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      if (!timeRegex.test(mealTimes.breakfast) || 
          !timeRegex.test(mealTimes.lunch) || 
          !timeRegex.test(mealTimes.dinner)) {
        throw new Error('Please enter valid times in HH:MM format');
      }

      // Validate logical order (breakfast < lunch < dinner)
      const breakfastMinutes = timeToMinutes(mealTimes.breakfast);
      const lunchMinutes = timeToMinutes(mealTimes.lunch);
      const dinnerMinutes = timeToMinutes(mealTimes.dinner);

      if (breakfastMinutes >= lunchMinutes || lunchMinutes >= dinnerMinutes) {
        throw new Error('Meal times must be in order: Breakfast < Lunch < Dinner');
      }

      // Save to localStorage
      localStorage.setItem('mealTimes', JSON.stringify(mealTimes));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('mealTimesUpdated', { 
        detail: mealTimes 
      }));

      setMealTimeMessage('Meal times saved successfully! Changes will apply to new meal calculations.');
    } catch (error) {
      setMealTimeMessage(`Error: ${error.message}`);
    } finally {
      setIsSavingMealTimes(false);
    }
  };

  const resetMealTimes = () => {
    const defaultTimes = {
      breakfast: '09:00',
      lunch: '13:00',
      dinner: '18:00'
    };
    setMealTimes(defaultTimes);
    setMealTimeMessage('');
  };

  // Helper function to convert time string to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to format time for display
  const formatTimeForDisplay = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Groups import handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setCsvFile(file);
    setStatusMessage('');
  };

  const handleTextChange = (e) => {
    setCsvText(e.target.value);
    setStatusMessage('');
  };

  // Staff import handlers
  const handleStaffFileChange = (e) => {
    const file = e.target.files[0];
    setStaffCsvFile(file);
    setStaffStatusMessage('');
  };

  const handleStaffTextChange = (e) => {
    setStaffCsvText(e.target.value);
    setStaffStatusMessage('');
  };

  const handleImport = async () => {
    // Validate input based on method
    if (importMethod === 'file' && !csvFile) {
      setStatusMessage('Please select a CSV file first.');
      return;
    }

    if (importMethod === 'paste' && !csvText.trim()) {
      setStatusMessage('Please paste CSV data first.');
      return;
    }

    setIsImporting(true);
    setStatusMessage('Processing data...');

    // Configure Papa Parse based on import method
    const parseConfig = {
      header: true,
      skipEmptyLines: true,
      delimiter: '', // Auto-detect delimiter (comma, tab, etc.)
      complete: async (results) => {
        try {
          console.log('Parsed results:', results.data); // Debug log
          
          // Set centre for each group
          const newGroups = results.data.map(row => ({ ...row, centre }));

          // Transform CSV data to group objects with flexible column matching
          const transformedGroups = newGroups.map(row => {
            const agency = getColumnValue(row, ['agency', 'Agency']);
            const name = getColumnValue(row, ['group name', 'Group Name', 'name', 'Name']);
            const arrivalDate = getColumnValue(row, ['arrival date', 'Arrival Date', 'arrival_date']);
            const departureDate = getColumnValue(row, ['departure date', 'Departure Date', 'departure_date']);
            const pax = getColumnValue(row, ['total px', 'Total Px', 'total_px', 'pax', 'Pax']);

            return {
              agency: agency || '',
              name: name || '',
              arrivalDate: convertDateFormat(arrivalDate) || '',
              departureDate: convertDateFormat(departureDate) || '',
              pax: parseInt(pax, 10) || 0,
              arrivalTime: '',
              departureTime: '',
              dietary: { vegetarian: 0, glutenFree: 0, nutAllergy: 0, other: 0 }
            };
          });

          console.log('Transformed groups:', transformedGroups); // Debug log

          // Validate the transformed data
          const validGroups = transformedGroups.filter(group => 
            group.name && group.arrivalDate && group.departureDate && group.pax > 0
          );

          console.log('Valid groups:', validGroups); // Debug log

          if (validGroups.length === 0) {
            // Provide more detailed error information
            const sampleRow = results.data[0];
            const availableColumns = Object.keys(sampleRow || {}).join(', ');
            setStatusMessage(`No valid groups found in the CSV data. 
            
Available columns detected: ${availableColumns}

Please ensure your data has columns for:
- Group name (found: ${getColumnValue(sampleRow, ['group name', 'Group Name', 'name', 'Name']) ? 'Yes' : 'No'})
- Arrival date (found: ${getColumnValue(sampleRow, ['arrival date', 'Arrival Date', 'arrival_date']) ? 'Yes' : 'No'})
- Departure date (found: ${getColumnValue(sampleRow, ['departure date', 'Departure Date', 'departure_date']) ? 'Yes' : 'No'})
- Total people (found: ${getColumnValue(sampleRow, ['total px', 'Total Px', 'total_px', 'pax', 'Pax']) ? 'Yes' : 'No'})
- centre: The centre/university for this group (e.g., DCU, UCD, ATU)

And ensure dates are in DD/MM/YYYY or YYYY-MM-DD format.`);
            setIsImporting(false);
            return;
          }

          if (validGroups.length < transformedGroups.length) {
            setStatusMessage(`Warning: ${transformedGroups.length - validGroups.length} rows were skipped due to missing required data or invalid date format.`);
          }

          setStatusMessage(`Uploading ${validGroups.length} groups to the database...`);

          // Create POST requests for each group
          const uploadPromises = validGroups.map(group =>
            fetch('http://localhost:3001/groups', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(group),
            })
          );

          // Execute all uploads
          const responses = await Promise.all(uploadPromises);
          
          // Check if all uploads were successful
          const failedUploads = responses.filter(response => !response.ok);
          
          if (failedUploads.length > 0) {
            setStatusMessage(`Warning: ${failedUploads.length} groups failed to upload. ${validGroups.length - failedUploads.length} groups were successfully imported.`);
          } else {
            setStatusMessage(`Successfully imported ${validGroups.length} groups! You may need to refresh other pages to see the updates.`);
          }

          // Clear the inputs
          if (importMethod === 'file') {
            setCsvFile(null);
            document.getElementById('csv-file-input').value = '';
          } else {
            setCsvText('');
          }

        } catch (error) {
          console.error('Import error:', error);
          setStatusMessage(`Error during import: ${error.message}. Please try again or check your internet connection.`);
        } finally {
          setIsImporting(false);
        }
      },
      error: (err) => {
        setStatusMessage(`Error parsing CSV: ${err.message}`);
        setIsImporting(false);
      }
    };

    // Parse based on method
    if (importMethod === 'file') {
      Papa.parse(csvFile, parseConfig);
    } else {
      Papa.parse(csvText, parseConfig);
    }
  };

  const handleStaffImport = async () => {
    // Validate input based on method
    if (staffImportMethod === 'file' && !staffCsvFile) {
      setStaffStatusMessage('Please select a CSV file first.');
      return;
    }

    if (staffImportMethod === 'paste' && !staffCsvText.trim()) {
      setStaffStatusMessage('Please paste CSV data first.');
      return;
    }

    setIsImportingStaff(true);
    setStaffStatusMessage('Processing staff data...');

    // Configure Papa Parse for staff import
    const parseConfig = {
      header: true,
      skipEmptyLines: true,
      delimiter: '', // Auto-detect delimiter (comma, tab, etc.)
      complete: async (results) => {
        try {
          console.log('Parsed staff results:', results.data); // Debug log
          
          // Set centre for each staff member
          const newStaff = results.data.map(row => ({ ...row, centre }));

          // Transform CSV data to staff objects with flexible column matching
          const transformedStaff = newStaff.map(row => {
            const firstName = getColumnValue(row, ['first name', 'First Name', 'firstname', 'FirstName']);
            const surname = getColumnValue(row, ['surname', 'Surname', 'last name', 'Last Name', 'lastname', 'LastName']);
            const arrivalDate = getColumnValue(row, ['arrival date', 'Arrival Date', 'arrival_date']);
            const departureDate = getColumnValue(row, ['departure date', 'Departure Date', 'departure_date']);
            const liveInValue = getColumnValue(row, ['live in?', 'Live in?', 'Live In?', 'live_in', 'livein', 'Live In', 'live in']);

            // Combine first name and surname to create full name
            const fullName = `${firstName} ${surname}`.trim();

            // Parse live-in status - default to true if not specified or unclear
            let isLiveIn = true;
            if (liveInValue) {
              const liveInStr = String(liveInValue).toLowerCase().trim();
              isLiveIn = liveInStr === 'yes' || liveInStr === 'y' || liveInStr === 'true' || liveInStr === '1';
            }

            return {
              name: fullName,
              arrivalDate: convertDateFormat(arrivalDate) || '',
              departureDate: convertDateFormat(departureDate) || '',
              isLiveIn: isLiveIn
            };
          });

          console.log('Transformed staff:', transformedStaff); // Debug log

          // Validate the transformed data
          const validStaff = transformedStaff.filter(staff => 
            staff.name && staff.arrivalDate && staff.departureDate
          );

          console.log('Valid staff:', validStaff); // Debug log

          if (validStaff.length === 0) {
            // Provide more detailed error information
            const sampleRow = results.data[0];
            const availableColumns = Object.keys(sampleRow || {}).join(', ');
            setStaffStatusMessage(`No valid staff found in the CSV data. 
            
Available columns detected: ${availableColumns}

Please ensure your data has columns for:
- First Name (found: ${getColumnValue(sampleRow, ['first name', 'First Name', 'firstname', 'FirstName']) ? 'Yes' : 'No'})
- Surname (found: ${getColumnValue(sampleRow, ['surname', 'Surname', 'last name', 'Last Name', 'lastname', 'LastName']) ? 'Yes' : 'No'})
- Arrival Date (found: ${getColumnValue(sampleRow, ['arrival date', 'Arrival Date', 'arrival_date']) ? 'Yes' : 'No'})
- Departure Date (found: ${getColumnValue(sampleRow, ['departure date', 'Departure Date', 'departure_date']) ? 'Yes' : 'No'})
- Live in? (found: ${getColumnValue(sampleRow, ['live in?', 'Live in?', 'Live In?', 'live_in', 'livein', 'Live In', 'live in']) ? 'Yes' : 'No'} - Optional, defaults to Yes)
- centre: The centre/university for this group (e.g., DCU, UCD, ATU)

And ensure dates are in DD/MM/YYYY or YYYY-MM-DD format.`);
            setIsImportingStaff(false);
            return;
          }

          if (validStaff.length < transformedStaff.length) {
            setStaffStatusMessage(`Warning: ${transformedStaff.length - validStaff.length} rows were skipped due to missing required data or invalid date format.`);
          }

          setStaffStatusMessage(`Uploading ${validStaff.length} staff members to the database...`);

          // Create POST requests for each staff member
          const uploadPromises = validStaff.map(staff =>
            fetch('http://localhost:3001/staff', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(staff),
            })
          );

          // Execute all uploads
          const responses = await Promise.all(uploadPromises);
          
          // Check if all uploads were successful
          const failedUploads = responses.filter(response => !response.ok);
          
          if (failedUploads.length > 0) {
            setStaffStatusMessage(`Warning: ${failedUploads.length} staff members failed to upload. ${validStaff.length - failedUploads.length} staff members were successfully imported.`);
          } else {
            setStaffStatusMessage(`Successfully imported ${validStaff.length} staff members! You may need to refresh other pages to see the updates.`);
          }

          // Clear the inputs
          if (staffImportMethod === 'file') {
            setStaffCsvFile(null);
            document.getElementById('staff-csv-file-input').value = '';
          } else {
            setStaffCsvText('');
          }

        } catch (error) {
          console.error('Staff import error:', error);
          setStaffStatusMessage(`Error during import: ${error.message}. Please try again or check your internet connection.`);
        } finally {
          setIsImportingStaff(false);
        }
      },
      error: (err) => {
        setStaffStatusMessage(`Error parsing CSV: ${err.message}`);
        setIsImportingStaff(false);
      }
    };

    // Parse based on method
    if (staffImportMethod === 'file') {
      Papa.parse(staffCsvFile, parseConfig);
    } else {
      Papa.parse(staffCsvText, parseConfig);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">Settings</h1>
      
      {/* Groups CSV Import Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Groups from CSV</h2>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            Upload a CSV file or paste CSV data. The system will automatically detect comma, tab, or other separators.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">Flexible Format Support:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>Column names:</strong> Case-insensitive matching for agency, group name, arrival date, departure date, total px</li>
              <li>• <strong>Separators:</strong> Supports comma, tab, or other delimiters (auto-detected)</li>
              <li>• <strong>Dates:</strong> DD/MM/YYYY format (e.g., 15/07/2025) or YYYY-MM-DD format</li>
              <li>• <strong>Required:</strong> Group name, arrival date, departure date, total people count</li>
              <li>• <strong>Optional:</strong> Agency field</li>
              <li>• <strong>centre:</strong> The centre/university for this group (e.g., DCU, UCD, ATU)</li>
            </ul>
          </div>
        </div>

        {/* Method Selection Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setImportMethod('file')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  importMethod === 'file'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setImportMethod('paste')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  importMethod === 'paste'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Paste Data
              </button>
            </nav>
          </div>
        </div>

        <div className="space-y-4">
          {/* File Upload Method */}
          {importMethod === 'file' && (
            <div>
              <label htmlFor="csv-file-input" className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          )}

          {/* Paste Data Method */}
          {importMethod === 'paste' && (
            <div>
              <label htmlFor="csv-text-input" className="block text-sm font-medium text-gray-700 mb-2">
                Paste CSV Data (Tab or Comma Separated)
              </label>
              <textarea
                id="csv-text-input"
                value={csvText}
                onChange={handleTextChange}
                rows={8}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Agency	Group Name	arrival date	departure date	Total Px	centre
Youth Org	Summer Camp	01/08/2025	05/08/2025	32	DCU
Community	Adventure	10/08/2025	15/08/2025	28	UCD"
              />
              <p className="mt-2 text-sm text-gray-500">
                Tip: Copy data directly from Excel or Google Sheets. Both comma and tab separators are supported.
              </p>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={(importMethod === 'file' && !csvFile) || (importMethod === 'paste' && !csvText.trim()) || isImporting}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isImporting ? 'Importing...' : 'Upload and Import'}
          </button>

          {statusMessage && (
            <div className={`p-4 rounded-md whitespace-pre-line ${
              statusMessage.includes('Error') || statusMessage.includes('Warning') 
                ? 'bg-red-100 border border-red-400 text-red-700'
                : statusMessage.includes('Successfully')
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-blue-100 border border-blue-400 text-blue-700'
            }`}>
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {/* Staff CSV Import Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Staff from CSV</h2>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            Upload a CSV file or paste CSV data for staff members. The system will automatically detect comma, tab, or other separators.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-900 mb-2">Staff CSV Format Support:</h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• <strong>Column names:</strong> Case-insensitive matching for First Name, Surname, Arrival Date, Departure Date, Live in?</li>
              <li>• <strong>Separators:</strong> Supports comma, tab, or other delimiters (auto-detected)</li>
              <li>• <strong>Dates:</strong> DD/MM/YYYY format (e.g., 15/07/2025) or YYYY-MM-DD format</li>
              <li>• <strong>Required:</strong> First Name, Surname, Arrival Date, Departure Date</li>
              <li>• <strong>Optional:</strong> Live in? (Yes/No - defaults to Yes if not specified)</li>
              <li>• <strong>Name handling:</strong> First Name and Surname will be combined into a full name</li>
              <li>• <strong>Meal logic:</strong> Live-in staff get all meals, Live-out staff get lunch only</li>
              <li>• <strong>centre:</strong> The centre/university for this group (e.g., DCU, UCD, ATU)</li>
            </ul>
          </div>
        </div>

        {/* Staff Method Selection Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setStaffImportMethod('file')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  staffImportMethod === 'file'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setStaffImportMethod('paste')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  staffImportMethod === 'paste'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Paste Data
              </button>
            </nav>
          </div>
        </div>

        <div className="space-y-4">
          {/* Staff File Upload Method */}
          {staffImportMethod === 'file' && (
            <div>
              <label htmlFor="staff-csv-file-input" className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                id="staff-csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleStaffFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
          )}

          {/* Staff Paste Data Method */}
          {staffImportMethod === 'paste' && (
            <div>
              <label htmlFor="staff-csv-text-input" className="block text-sm font-medium text-gray-700 mb-2">
                Paste Staff CSV Data (Tab or Comma Separated)
              </label>
              <textarea
                id="staff-csv-text-input"
                value={staffCsvText}
                onChange={handleStaffTextChange}
                rows={8}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                placeholder="First Name	Surname	Arrival Date	Departure Date	Live in?	centre
John	Smith	01/07/2025	31/07/2025	Yes	DCU
Sarah	Johnson	05/07/2025	25/07/2025	No	UCD
Mike	Wilson	10/07/2025	20/07/2025	Yes	DCU"
              />
              <p className="mt-2 text-sm text-gray-500">
                Tip: Copy data directly from Excel or Google Sheets. Both comma and tab separators are supported.
              </p>
            </div>
          )}

          <button
            onClick={handleStaffImport}
            disabled={(staffImportMethod === 'file' && !staffCsvFile) || (staffImportMethod === 'paste' && !staffCsvText.trim()) || isImportingStaff}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isImportingStaff ? 'Importing...' : 'Upload and Import Staff'}
          </button>

          {staffStatusMessage && (
            <div className={`p-4 rounded-md whitespace-pre-line ${
              staffStatusMessage.includes('Error') || staffStatusMessage.includes('Warning') 
                ? 'bg-red-100 border border-red-400 text-red-700'
                : staffStatusMessage.includes('Successfully')
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-blue-100 border border-blue-400 text-blue-700'
            }`}>
              {staffStatusMessage}
            </div>
          )}
        </div>
      </div>

      {/* Meal Time Configuration Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Meal Time Configuration</h2>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            Configure the default meal serving times. These times determine when participants need to arrive to receive each meal.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-orange-900 mb-2">How Meal Times Work:</h3>
            <ul className="text-orange-800 text-sm space-y-1">
              <li>• <strong>Arrival before meal time:</strong> Participants get the regular meal</li>
              <li>• <strong>Arrival after meal time:</strong> System automatically provides packed meals</li>
              <li>• <strong>Departure before meal time:</strong> System provides packed meals for early departures</li>
              <li>• <strong>Weekend logic:</strong> Saturday/Sunday lunches are automatically packed for all participants</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Breakfast Time */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <label htmlFor="breakfast-time" className="block text-sm font-medium text-yellow-900 mb-2">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Breakfast Time
              </div>
            </label>
            <input
              type="time"
              id="breakfast-time"
              value={mealTimes.breakfast}
              onChange={(e) => handleMealTimeChange('breakfast', e.target.value)}
              className="block w-full px-3 py-2 border border-yellow-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            />
            <p className="text-xs text-yellow-700 mt-1">
              Currently: {formatTimeForDisplay(mealTimes.breakfast)}
            </p>
          </div>

          {/* Lunch Time */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <label htmlFor="lunch-time" className="block text-sm font-medium text-green-900 mb-2">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Lunch Time
              </div>
            </label>
            <input
              type="time"
              id="lunch-time"
              value={mealTimes.lunch}
              onChange={(e) => handleMealTimeChange('lunch', e.target.value)}
              className="block w-full px-3 py-2 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-green-700 mt-1">
              Currently: {formatTimeForDisplay(mealTimes.lunch)}
            </p>
          </div>

          {/* Dinner Time */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label htmlFor="dinner-time" className="block text-sm font-medium text-blue-900 mb-2">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Dinner Time
              </div>
            </label>
            <input
              type="time"
              id="dinner-time"
              value={mealTimes.dinner}
              onChange={(e) => handleMealTimeChange('dinner', e.target.value)}
              className="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-blue-700 mt-1">
              Currently: {formatTimeForDisplay(mealTimes.dinner)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <button
            onClick={saveMealTimes}
            disabled={isSavingMealTimes}
            className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSavingMealTimes ? 'Saving...' : 'Save Meal Times'}
          </button>
          
          <button
            onClick={resetMealTimes}
            disabled={isSavingMealTimes}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Reset to Default
          </button>
        </div>

        {/* Status Message */}
        {mealTimeMessage && (
          <div className={`p-4 rounded-md ${
            mealTimeMessage.includes('Error') 
              ? 'bg-red-100 border border-red-400 text-red-700'
              : 'bg-green-100 border border-green-400 text-green-700'
          }`}>
            {mealTimeMessage}
          </div>
        )}
      </div>

      {/* Additional Settings Section */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Configuration</h2>
        <p className="text-gray-600">More configuration options can be added here as needed...</p>
      </div>
    </div>
  );
}

export default SettingsPage; 