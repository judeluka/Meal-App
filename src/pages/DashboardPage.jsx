import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { generateMealGrid } from '../utils/mealCalculator.js';
import { CentreContext } from '../context/CentreContext.jsx';
import WeeklyMealsBarChart from '../components/WeeklyMealsBarChart.jsx';

function DashboardPage() {
  const [groups, setGroups] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mealSummary, setMealSummary] = useState(null);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState([]);
  const { centre } = useContext(CentreContext);

  // Fetch data on component mount or when centre changes
  useEffect(() => {
    fetchData();
  }, [centre]);

  // Generate meal summary when data changes
  useEffect(() => {
    if (groups.length > 0 || staff.length > 0) {
      generateTotalMealSummary();
    }
  }, [groups, staff]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch only data for the selected centre
      const [groupsResponse, staffResponse] = await Promise.all([
        fetch(`http://localhost:3001/groups?centre=${encodeURIComponent(centre)}`),
        fetch(`http://localhost:3001/staff?centre=${encodeURIComponent(centre)}`)
      ]);
      if (groupsResponse.ok && staffResponse.ok) {
        const groupsData = await groupsResponse.json();
        const staffData = await staffResponse.json();
        setGroups(groupsData);
        setStaff(staffData);
      } else {
        throw new Error('API not available');
      }
    } catch (apiError) {
      // Fallback to empty data for other centres
      setGroups([]);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const generateTotalMealSummary = () => {
    // Find the earliest arrival date and latest departure date
    let earliestDate = null;
    let latestDate = null;
    
    // Check groups
    groups.forEach(group => {
      const arrival = new Date(group.arrivalDate);
      const departure = new Date(group.departureDate);
      
      if (!earliestDate || arrival < earliestDate) {
        earliestDate = arrival;
      }
      if (!latestDate || departure > latestDate) {
        latestDate = departure;
      }
    });
    
    // Check staff
    staff.forEach(staffMember => {
      const arrival = new Date(staffMember.arrivalDate);
      const departure = new Date(staffMember.departureDate);
      
      if (!earliestDate || arrival < earliestDate) {
        earliestDate = arrival;
      }
      if (!latestDate || departure > latestDate) {
        latestDate = departure;
      }
    });
    
    if (!earliestDate || !latestDate) {
      setMealSummary({
        totalMeals: 0,
        totalPackedMeals: 0,
        totalBreakfast: 0,
        totalLunch: 0,
        totalDinner: 0,
        totalDietary: { vegetarian: 0, glutenFree: 0, nutAllergy: 0, other: 0 },
        dateRange: null
      });
      setWeeklyBreakdown([]);
      return;
    }

    // Calculate totals across all weeks in the date range
    let totalMeals = 0;
    let totalPackedMeals = 0;
    let totalBreakfast = 0;
    let totalLunch = 0;
    let totalDinner = 0;
    let totalDietary = { vegetarian: 0, glutenFree: 0, nutAllergy: 0, other: 0 };
    const weeklyData = [];

    // Generate meal grids for each week in the range
    const currentDate = new Date(earliestDate);
    // Start from the Monday of the week containing the earliest date
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    currentDate.setDate(currentDate.getDate() + mondayOffset);
    
    while (currentDate <= latestDate) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const gridData = generateMealGrid(groups, staff, currentDate);
      
      // Calculate totals for this week
      let weekMeals = 0;
      let weekPackedMeals = 0;
      let weekBreakfast = 0;
      let weekLunch = 0;
      let weekDinner = 0;
      let weekDietary = { vegetarian: 0, glutenFree: 0, nutAllergy: 0, other: 0 };
      
      // Sum up meals for this week
      Object.values(gridData).forEach(day => {
        if (day.B) {
          weekBreakfast += day.B.total;
          weekMeals += day.B.total;
          totalBreakfast += day.B.total;
          totalMeals += day.B.total;
          weekDietary.vegetarian += day.B.dietary.vegetarian;
          weekDietary.glutenFree += day.B.dietary.glutenFree;
          weekDietary.nutAllergy += day.B.dietary.nutAllergy;
          weekDietary.other += day.B.dietary.other;
          totalDietary.vegetarian += day.B.dietary.vegetarian;
          totalDietary.glutenFree += day.B.dietary.glutenFree;
          totalDietary.nutAllergy += day.B.dietary.nutAllergy;
          totalDietary.other += day.B.dietary.other;
        }
        if (day.L) {
          weekLunch += day.L.total;
          weekMeals += day.L.total;
          totalLunch += day.L.total;
          totalMeals += day.L.total;
          weekDietary.vegetarian += day.L.dietary.vegetarian;
          weekDietary.glutenFree += day.L.dietary.glutenFree;
          weekDietary.nutAllergy += day.L.dietary.nutAllergy;
          weekDietary.other += day.L.dietary.other;
          totalDietary.vegetarian += day.L.dietary.vegetarian;
          totalDietary.glutenFree += day.L.dietary.glutenFree;
          totalDietary.nutAllergy += day.L.dietary.nutAllergy;
          totalDietary.other += day.L.dietary.other;
        }
        if (day.D) {
          weekDinner += day.D.total;
          weekMeals += day.D.total;
          totalDinner += day.D.total;
          totalMeals += day.D.total;
          weekDietary.vegetarian += day.D.dietary.vegetarian;
          weekDietary.glutenFree += day.D.dietary.glutenFree;
          weekDietary.nutAllergy += day.D.dietary.nutAllergy;
          weekDietary.other += day.D.dietary.other;
          totalDietary.vegetarian += day.D.dietary.vegetarian;
          totalDietary.glutenFree += day.D.dietary.glutenFree;
          totalDietary.nutAllergy += day.D.dietary.nutAllergy;
          totalDietary.other += day.D.dietary.other;
        }
        if (day.pB) {
          weekPackedMeals += day.pB.total;
          totalPackedMeals += day.pB.total;
          weekDietary.vegetarian += day.pB.dietary.vegetarian;
          weekDietary.glutenFree += day.pB.dietary.glutenFree;
          weekDietary.nutAllergy += day.pB.dietary.nutAllergy;
          weekDietary.other += day.pB.dietary.other;
          totalDietary.vegetarian += day.pB.dietary.vegetarian;
          totalDietary.glutenFree += day.pB.dietary.glutenFree;
          totalDietary.nutAllergy += day.pB.dietary.nutAllergy;
          totalDietary.other += day.pB.dietary.other;
        }
        if (day.pL) {
          weekPackedMeals += day.pL.total;
          totalPackedMeals += day.pL.total;
          weekDietary.vegetarian += day.pL.dietary.vegetarian;
          weekDietary.glutenFree += day.pL.dietary.glutenFree;
          weekDietary.nutAllergy += day.pL.dietary.nutAllergy;
          weekDietary.other += day.pL.dietary.other;
          totalDietary.vegetarian += day.pL.dietary.vegetarian;
          totalDietary.glutenFree += day.pL.dietary.glutenFree;
          totalDietary.nutAllergy += day.pL.dietary.nutAllergy;
          totalDietary.other += day.pL.dietary.other;
        }
        if (day.pD) {
          weekPackedMeals += day.pD.total;
          totalPackedMeals += day.pD.total;
          weekDietary.vegetarian += day.pD.dietary.vegetarian;
          weekDietary.glutenFree += day.pD.dietary.glutenFree;
          weekDietary.nutAllergy += day.pD.dietary.nutAllergy;
          weekDietary.other += day.pD.dietary.other;
          totalDietary.vegetarian += day.pD.dietary.vegetarian;
          totalDietary.glutenFree += day.pD.dietary.glutenFree;
          totalDietary.nutAllergy += day.pD.dietary.nutAllergy;
          totalDietary.other += day.pD.dietary.other;
        }
      });
      
      // Add week data to breakdown
      weeklyData.push({
        weekStart,
        weekEnd,
        totalMeals: weekMeals,
        totalPackedMeals: weekPackedMeals,
        breakfast: weekBreakfast,
        lunch: weekLunch,
        dinner: weekDinner,
        dietary: weekDietary
      });
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }

    setMealSummary({
      totalMeals,
      totalPackedMeals,
      totalBreakfast,
      totalLunch,
      totalDinner,
      totalDietary,
      dateRange: {
        start: earliestDate,
        end: latestDate
      }
    });
    
    setWeeklyBreakdown(weeklyData);
  };

  const getTotalPeople = () => {
    return groups.reduce((sum, group) => sum + (group.pax || 0), 0) + staff.length;
  };

  const getActiveGroups = () => {
    const today = new Date();
    return groups.filter(group => {
      const arrival = new Date(group.arrivalDate);
      const departure = new Date(group.departureDate);
      return arrival <= today && departure >= today;
    });
  };

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
        Camp Food Order Dashboard
      </h1>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      ) : (
        <>
          {/* Quick Actions - Moved to Top */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link to="/groups" className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Groups</h3>
              <p className="text-gray-600 text-sm">Add, edit, and view all camp groups</p>
              <div className="mt-4 text-blue-600 font-medium">View Groups →</div>
            </Link>

            <Link to="/staff" className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Staff</h3>
              <p className="text-gray-600 text-sm">Add, edit, and view all staff members</p>
              <div className="mt-4 text-blue-600 font-medium">View Staff →</div>
            </Link>

            <Link to="/settings" className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Data</h3>
              <p className="text-gray-600 text-sm">Bulk import groups from CSV files</p>
              <div className="mt-4 text-blue-600 font-medium">Import CSV →</div>
            </Link>
          </div>

          {/* Total Meal Summary - Moved to Top */}
          {mealSummary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Total Meal Summary</h2>
                {mealSummary.dateRange ? (
                  <p className="text-sm text-gray-600 mb-4">
                    Complete duration: {mealSummary.dateRange.start.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} - {mealSummary.dateRange.end.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">No active bookings</p>
                )}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Regular Meals</span>
                    <span className="font-semibold text-lg">{formatNumber(mealSummary.totalMeals)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Total Packed Meals</span>
                    <span className="font-semibold text-lg">{formatNumber(mealSummary.totalPackedMeals)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Breakfasts</span>
                    <span className="font-medium">{formatNumber(mealSummary.totalBreakfast)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Lunches</span>
                    <span className="font-medium">{formatNumber(mealSummary.totalLunch)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Dinners</span>
                    <span className="font-medium">{formatNumber(mealSummary.totalDinner)}</span>
                  </div>
                </div>
                <Link 
                  to="/meal-grid" 
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  View Full Meal Grid
                </Link>
              </div>

              <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Dietary Requirements Summary</h2>
                <p className="text-sm text-gray-600 mb-4">Total across all meals</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Vegetarian</span>
                    <span className="font-semibold text-lg">{formatNumber(mealSummary.totalDietary.vegetarian)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Gluten-Free</span>
                    <span className="font-semibold text-lg">{formatNumber(mealSummary.totalDietary.glutenFree)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Nut Allergy</span>
                    <span className="font-semibold text-lg">{formatNumber(mealSummary.totalDietary.nutAllergy)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Other Requirements</span>
                    <span className="font-semibold text-lg">{formatNumber(mealSummary.totalDietary.other)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-600 shadow-lg rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-blue-100 text-sm font-medium">Total Groups</p>
                  <p className="text-3xl font-bold">{formatNumber(groups.length)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-600 shadow-lg rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-green-100 text-sm font-medium">Active Groups</p>
                  <p className="text-3xl font-bold">{formatNumber(getActiveGroups().length)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-600 shadow-lg rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-purple-100 text-sm font-medium">Staff Members</p>
                  <p className="text-3xl font-bold">{formatNumber(staff.length)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-600 shadow-lg rounded-lg p-6 text-white">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-orange-100 text-sm font-medium">Total People</p>
                  <p className="text-3xl font-bold">{formatNumber(getTotalPeople())}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Week by Week Breakdown */}
          {weeklyBreakdown.length > 0 && (
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Week by Week Summary</h2>
              <WeeklyMealsBarChart weeklyBreakdown={weeklyBreakdown} />
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Regular Meals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Packed Meals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Breakfast
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lunch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dinner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dietary
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyBreakdown.map((week, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">
                              {week.weekStart.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })} - {week.weekEnd.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {week.weekStart.getFullYear()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatNumber(week.totalMeals)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatNumber(week.totalPackedMeals)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatNumber(week.breakfast)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatNumber(week.lunch)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatNumber(week.dinner)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="text-xs space-y-1">
                            {week.dietary.vegetarian > 0 && (
                              <div>V: {formatNumber(week.dietary.vegetarian)}</div>
                            )}
                            {week.dietary.glutenFree > 0 && (
                              <div>GF: {formatNumber(week.dietary.glutenFree)}</div>
                            )}
                            {week.dietary.nutAllergy > 0 && (
                              <div>NA: {formatNumber(week.dietary.nutAllergy)}</div>
                            )}
                            {week.dietary.other > 0 && (
                              <div>Other: {formatNumber(week.dietary.other)}</div>
                            )}
                            {week.dietary.vegetarian === 0 && 
                             week.dietary.glutenFree === 0 && 
                             week.dietary.nutAllergy === 0 && 
                             week.dietary.other === 0 && (
                              <div className="text-gray-400">None</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardPage; 