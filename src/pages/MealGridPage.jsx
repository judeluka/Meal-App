import { useState, useEffect, useContext } from 'react';
import { generateMealGrid } from '../utils/mealCalculator.js';
import MealGridTable from '../components/MealGridTable.jsx';
import { CentreContext } from '../context/CentreContext.jsx';

function MealGridPage() {
  const [groups, setGroups] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [gridData, setGridData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMealTimes, setCurrentMealTimes] = useState({
    breakfast: '09:00',
    lunch: '13:00', 
    dinner: '18:00'
  });
  const { centre } = useContext(CentreContext);

  // Load current meal times from localStorage
  useEffect(() => {
    const loadMealTimes = () => {
      try {
        const savedMealTimes = localStorage.getItem('mealTimes');
        if (savedMealTimes) {
          const parsedTimes = JSON.parse(savedMealTimes);
          setCurrentMealTimes(parsedTimes);
        }
      } catch (error) {
        console.error('Error loading meal times:', error);
      }
    };
    
    loadMealTimes();
  }, []);

  // Initialize with current date
  useEffect(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    setSelectedDate(todayString);
    
    // Load initial data
    fetchData();
  }, [centre]);

  // Auto-generate grid when data or selected date changes
  useEffect(() => {
    if (groups.length > 0 && staff.length >= 0 && selectedDate) {
      handleGenerateGrid();
    }
  }, [groups, staff, selectedDate]);

  // Listen for meal time updates from Settings page
  useEffect(() => {
    const handleMealTimesUpdated = (event) => {
      console.log('Meal times updated:', event.detail);
      // Update local state with new meal times
      setCurrentMealTimes(event.detail);
      // Regenerate grid with new meal times
      if (groups.length > 0 && staff.length >= 0 && selectedDate) {
        handleGenerateGrid();
      }
    };

    // Add event listener
    window.addEventListener('mealTimesUpdated', handleMealTimesUpdated);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener('mealTimesUpdated', handleMealTimesUpdated);
    };
  }, [groups, staff, selectedDate]);

  // Fetch groups and staff data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to fetch from API first, fallback to mock data
      let groupsData = [];
      let staffData = [];
      
      try {
        const [groupsResponse, staffResponse] = await Promise.all([
          fetch(`http://localhost:3001/groups?centre=${encodeURIComponent(centre)}`),
          fetch(`http://localhost:3001/staff?centre=${encodeURIComponent(centre)}`)
        ]);
        
        if (groupsResponse.ok && staffResponse.ok) {
          groupsData = await groupsResponse.json();
          staffData = await staffResponse.json();
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        // Fallback to mock data
        groupsData = [
          {
            id: "1",
            agency: "Sample Agency",
            name: "Scout Troop Alpha",
            pax: 25,
            arrivalDate: "2025-07-15",
            arrivalTime: "14:00",
            departureDate: "2025-07-20",
            departureTime: "10:00",
            dietary: { vegetarian: 4, glutenFree: 1, nutAllergy: 2, other: 0 }
          },
          {
            id: "2",
            agency: "Sample Agency",
            name: "Adventure Camp Beta",
            pax: 18,
            arrivalDate: "2025-07-22",
            arrivalTime: "16:30",
            departureDate: "2025-07-27",
            departureTime: "11:00",
            dietary: { vegetarian: 2, glutenFree: 0, nutAllergy: 0, other: 1 }
          }
        ];
        
        staffData = [
          {
            id: "1",
            name: "John Smith",
            arrivalDate: "2025-07-10",
            departureDate: "2025-07-30",
            isLiveIn: true
          },
          {
            id: "2",
            name: "Sarah Johnson",
            arrivalDate: "2025-07-12",
            departureDate: "2025-07-28",
            isLiveIn: false
          },
          {
            id: "3",
            name: "Mike Chen",
            arrivalDate: "2025-07-14",
            departureDate: "2025-08-05",
            isLiveIn: true
          }
        ];
      }
      
      setGroups(groupsData);
      setStaff(staffData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get the Monday of the week containing the selected date
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get the Sunday of the week containing the selected date
  const getWeekEnd = (date) => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 7);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 7);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  // Navigate to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handleGenerateGrid = () => {
    if (!selectedDate) {
      setError('Please select a date first.');
      return;
    }

    try {
      setError('');
      const startDate = new Date(selectedDate);
      const result = generateMealGrid(groups, staff, startDate);
      setGridData(result);
    } catch (err) {
      setError('Failed to generate meal grid. Please try again.');
      console.error('Error generating grid:', err);
    }
  };

  const handleRefreshData = () => {
    setGridData(null);
    fetchData();
  };

  // Get current week range for display
  const weekStart = selectedDate ? getWeekStart(new Date(selectedDate)) : null;
  const weekEnd = selectedDate ? getWeekEnd(new Date(selectedDate)) : null;

  // Helper function to format time for display
  const formatTimeForDisplay = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
        Meal Grid Calculator
      </h1>
      
      {/* Refresh Data Button - Simplified */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleRefreshData}
          disabled={loading}
          className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Current Meal Times Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <h3 className="font-medium text-purple-900">Current Meal Times</h3>
          </div>
          <div className="flex space-x-6 text-sm">
            <div className="text-center">
              <div className="text-yellow-700 font-medium">Breakfast</div>
              <div className="text-yellow-800 font-bold">{formatTimeForDisplay(currentMealTimes.breakfast)}</div>
            </div>
            <div className="text-center">
              <div className="text-green-700 font-medium">Lunch</div>
              <div className="text-green-800 font-bold">{formatTimeForDisplay(currentMealTimes.lunch)}</div>
            </div>
            <div className="text-center">
              <div className="text-blue-700 font-medium">Dinner</div>
              <div className="text-blue-800 font-bold">{formatTimeForDisplay(currentMealTimes.dinner)}</div>
            </div>
          </div>
        </div>
        <p className="text-purple-700 text-xs mt-2">
          These times determine meal eligibility. Configure them in Settings → Meal Time Configuration.
        </p>
      </div>

      {/* Loading State */}
      {loading && !gridData && (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading meal grid...</div>
        </div>
      )}

      {/* Meal Grid Table with Integrated Navigation */}
      {gridData && (
        <MealGridTable 
          gridData={gridData}
          weekStart={weekStart}
          weekEnd={weekEnd}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          onCurrentWeek={goToCurrentWeek}
          loading={loading}
          groupsCount={groups.length}
          staffCount={staff.length}
        />
      )}
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works:</h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• <strong>Meal Times:</strong> Currently set to Breakfast {formatTimeForDisplay(currentMealTimes.breakfast)}, Lunch {formatTimeForDisplay(currentMealTimes.lunch)}, Dinner {formatTimeForDisplay(currentMealTimes.dinner)} (configurable in Settings)</li>
          <li>• <strong>Arrival Day:</strong> Meals provided only if arriving before meal time</li>
          <li>• <strong>Departure Day:</strong> Regular meals if leaving after meal time, packed meals if leaving before</li>
          <li>• <strong>Full Days:</strong> All three meals provided</li>
          <li>• <strong>Staff:</strong> Live-in staff get all meals, live-out staff get lunch only</li>
          <li>• <strong>Default Times:</strong> Staff arrival 8:00 AM, departure 5:00 PM (unless specified)</li>
          <li>• <strong>Weekend Packed Lunches:</strong> All groups and staff get packed lunches on Saturdays and Sundays</li>
          <li>• <strong>Auto-Update:</strong> Grid automatically updates when meal times are changed in Settings</li>
        </ul>
      </div>
    </div>
  );
}

export default MealGridPage; 