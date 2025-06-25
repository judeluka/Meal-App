// Helper function to get meal time thresholds from settings
function getMealThresholds() {
  try {
    const savedMealTimes = localStorage.getItem('mealTimes');
    if (savedMealTimes) {
      const parsedTimes = JSON.parse(savedMealTimes);
      return {
        BREAKFAST: parsedTimes.breakfast || '09:00',
        LUNCH: parsedTimes.lunch || '13:00',
        DINNER: parsedTimes.dinner || '18:00'
      };
    }
  } catch (error) {
    console.error('Error loading meal times from settings:', error);
  }
  
  // Default meal time thresholds if no settings found
  return {
    BREAKFAST: '09:00',
    LUNCH: '13:00',
    DINNER: '18:00'
  };
}

// Meal time thresholds (now dynamic)
const MEAL_THRESHOLDS = getMealThresholds();

// Helper function to get the start of the week (Monday)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust for Sunday
  return new Date(d.setDate(diff));
}

// Helper function to format time for comparison
function formatTime(time) {
  if (!time) return '00:00';
  return time.padStart(5, '0'); // ensure HH:MM format
}

// Helper function to compare times
function isTimeAfter(time1, time2) {
  return formatTime(time1) > formatTime(time2);
}

// Helper function to get date string in YYYY-MM-DD format
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to check if a date is a weekend (Saturday or Sunday)
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// Helper function to create meal structure with dietary breakdown
function createMealStructure() {
  return {
    total: 0,
    dietary: {
      vegetarian: 0,
      glutenFree: 0,
      nutAllergy: 0,
      other: 0
    }
  };
}

// Helper function to add meal counts with dietary breakdown
function addMealCounts(mealStructure, totalPax, dietary = {}) {
  mealStructure.total += totalPax;
  mealStructure.dietary.vegetarian += dietary.vegetarian || 0;
  mealStructure.dietary.glutenFree += dietary.glutenFree || 0;
  mealStructure.dietary.nutAllergy += dietary.nutAllergy || 0;
  mealStructure.dietary.other += dietary.other || 0;
}

// Helper function to calculate presence of people on a given day considering multiple arrival/departure times
function calculatePresenceOnDay(arrivals, departures, targetDate, dietary = {}) {
  const targetDateStr = formatDate(targetDate);
  const isWeekendDay = isWeekend(targetDate);
  let presentPeople = 0;
  
  // Track who has arrived and not yet departed
  arrivals.forEach(arrival => {
    const arrivalDateStr = formatDate(new Date(arrival.date));
    
    // Find corresponding departures for these people
    departures.forEach(departure => {
      const departureDateStr = formatDate(new Date(departure.date));
      
      // Check if these people are present on the target date
      if (targetDateStr >= arrivalDateStr && targetDateStr <= departureDateStr) {
        // For simplicity, we'll process arrivals and departures proportionally
        // This is a simplified approach - in a real system you might want more sophisticated tracking
        const proportion = Math.min(arrival.pax, departure.pax) / Math.max(arrival.pax, departure.pax);
        presentPeople += Math.min(arrival.pax, departure.pax);
      }
    });
  });
  
  return { count: presentPeople, dietary };
}

// Helper function to process individual arrival/departure schedule for meals
function processScheduledGroup(arrivals, departures, gridData, dietary = {}) {
  // Get current meal thresholds (in case they've been updated)
  const thresholds = getMealThresholds();
  
  Object.keys(gridData).forEach(dateStr => {
    const currentDate = new Date(dateStr);
    const currentDateStr = formatDate(currentDate);
    const isWeekendDay = isWeekend(currentDate);
    
    // Find all arrivals and departures on this specific date
    const dayArrivals = arrivals.filter(arrival => formatDate(new Date(arrival.date)) === currentDateStr);
    const dayDepartures = departures.filter(departure => formatDate(new Date(departure.date)) === currentDateStr);
    
    // Find people present for the whole day (arrived before and departing after)
    let fullDayCount = 0;
    
    // Create a set to track which people are present (to avoid double counting)
    const presentPeople = new Set();
    
    // For groups with scheduled arrivals/departures, we need to carefully track who's present
    // Find all people who arrived before today and haven't left yet
    arrivals.forEach(arrival => {
      const arrivalDate = formatDate(new Date(arrival.date));
      if (arrivalDate < currentDateStr) {
        // They arrived before today, check if they're still here
        let stillPresent = true;
        departures.forEach(departure => {
          const departureDate = formatDate(new Date(departure.date));
          if (departureDate <= currentDateStr) {
            // Someone left on or before today, reduce the count
            stillPresent = false;
          }
        });
        
        if (stillPresent) {
          // These people are present for the full day
          fullDayCount += arrival.pax;
        }
      }
    });
    
    // Alternative simpler approach: just count total group size if it's between arrival and departure dates
    // This is more reliable for most cases
    const groupArrivalDates = arrivals.map(a => formatDate(new Date(a.date)));
    const groupDepartureDates = departures.map(d => formatDate(new Date(d.date)));
    const earliestArrival = Math.min(...groupArrivalDates.map(d => new Date(d)));
    const latestDeparture = Math.max(...groupDepartureDates.map(d => new Date(d)));
    const currentDateTime = new Date(currentDateStr);
    
    // If we're between the group's overall arrival and departure, count total group size
    if (currentDateTime > earliestArrival && currentDateTime < latestDeparture) {
      // Use the total group pax, but only if no specific arrivals/departures today
      const totalGroupPax = arrivals.reduce((sum, arr) => sum + arr.pax, 0);
      if (dayArrivals.length === 0 && dayDepartures.length === 0) {
        fullDayCount = totalGroupPax;
      } else {
        fullDayCount = 0; // Arrivals/departures today will be handled separately
      }
    }
    
    // Process arrivals on this day
    dayArrivals.forEach(arrival => {
      const arrivalTime = formatTime(arrival.time);
      const pax = arrival.pax;
      
      // Find when these people depart
      let departureTime = '23:59'; // Default late departure
      let isDepartingToday = false;
      
      departures.forEach(departure => {
        const departureDate = formatDate(new Date(departure.date));
        if (departureDate === currentDateStr && departure.pax <= pax) {
          departureTime = formatTime(departure.time);
          isDepartingToday = true;
        } else if (departureDate > currentDateStr) {
          // They depart on a later date, so get all meals today after arrival
          departureTime = '23:59';
        }
      });
      
      // Add meals based on arrival time and departure time using current thresholds
      if (!isTimeAfter(arrivalTime, thresholds.BREAKFAST) && 
          !isTimeAfter(thresholds.BREAKFAST, departureTime)) {
        addMealCounts(gridData[dateStr].B, pax, dietary);
      }
      
      if (!isTimeAfter(arrivalTime, thresholds.LUNCH) && 
          !isTimeAfter(thresholds.LUNCH, departureTime)) {
        if (isWeekendDay) {
          addMealCounts(gridData[dateStr].pL, pax, dietary);
        } else {
          addMealCounts(gridData[dateStr].L, pax, dietary);
        }
      }
      
      if (!isTimeAfter(arrivalTime, thresholds.DINNER) && 
          !isTimeAfter(thresholds.DINNER, departureTime)) {
        addMealCounts(gridData[dateStr].D, pax, dietary);
      }
    });
    
    // Process departures on this day (for people who arrived earlier)
    dayDepartures.forEach(departure => {
      const departureTime = formatTime(departure.time);
      const pax = departure.pax;
      
      // Check if these people arrived before today
      let arrivedEarlier = false;
      arrivals.forEach(arrival => {
        const arrivalDate = formatDate(new Date(arrival.date));
        if (arrivalDate < currentDateStr && arrival.pax >= pax) {
          arrivedEarlier = true;
        }
      });
      
      if (arrivedEarlier) {
        // Provide packed meals if departing before meal times using current thresholds
        if (isTimeAfter(thresholds.BREAKFAST, departureTime)) {
          addMealCounts(gridData[dateStr].pB, pax, dietary);
        }
        if (isTimeAfter(thresholds.LUNCH, departureTime)) {
          addMealCounts(gridData[dateStr].pL, pax, dietary);
        }
        if (isTimeAfter(thresholds.DINNER, departureTime)) {
          addMealCounts(gridData[dateStr].pD, pax, dietary);
        }
      }
    });
    
    // Add meals for people present for full day (but subtract any already counted above)
    if (fullDayCount > 0) {
      // Only add if not already counted in arrivals/departures above
      const alreadyCountedArrivals = dayArrivals.reduce((sum, arr) => sum + arr.pax, 0);
      const remainingFullDay = Math.max(0, fullDayCount - alreadyCountedArrivals);
      
      if (remainingFullDay > 0) {
        addMealCounts(gridData[dateStr].B, remainingFullDay, dietary);
        if (isWeekendDay) {
          addMealCounts(gridData[dateStr].pL, remainingFullDay, dietary);
        } else {
          addMealCounts(gridData[dateStr].L, remainingFullDay, dietary);
        }
        addMealCounts(gridData[dateStr].D, remainingFullDay, dietary);
      }
    }
  });
}

// Main function to generate meal grid
export function generateMealGrid(groups, staff, startDate) {
  // Get current meal thresholds (in case they've been updated)
  const MEAL_THRESHOLDS = getMealThresholds();
  
  // Initialize grid data structure
  const gridData = {};
  const weekStart = getWeekStart(startDate);
  
  // Initialize 7 days of the week
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    const dateStr = formatDate(currentDate);
    
    gridData[dateStr] = {
      date: currentDate,
      dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
      B: createMealStructure(),
      L: createMealStructure(),
      D: createMealStructure(),
      pB: createMealStructure(),
      pL: createMealStructure(),
      pD: createMealStructure()
    };
  }

  // Process groups
  groups.forEach(group => {
    const dietary = group.dietary || {};
    
    // Check if group has new schedule format
    if (group.arrivalSchedule && group.departureSchedule) {
      // Use new schedule format
      processScheduledGroup(group.arrivalSchedule, group.departureSchedule, gridData, dietary);
    } else {
      // Fall back to old format for backward compatibility
      const arrivalDate = new Date(group.arrivalDate);
      const departureDate = new Date(group.departureDate);
      const arrivalTime = formatTime(group.arrivalTime || '00:00');
      const departureTime = formatTime(group.departureTime || '23:59');
      const pax = group.pax || 1;

      // Loop through each day in the week
      Object.keys(gridData).forEach(dateStr => {
        const currentDate = new Date(dateStr);
        const currentDateStr = formatDate(currentDate);
        const arrivalDateStr = formatDate(arrivalDate);
        const departureDateStr = formatDate(departureDate);

        // Check if group is present on this day
        if (currentDateStr >= arrivalDateStr && currentDateStr <= departureDateStr) {
          const isArrivalDay = currentDateStr === arrivalDateStr;
          const isDepartureDay = currentDateStr === departureDateStr;
          const isWeekendDay = isWeekend(currentDate);

          // Determine meal eligibility using current thresholds
          if (isArrivalDay && isDepartureDay) {
            // Same day arrival and departure
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.BREAKFAST) && 
                !isTimeAfter(MEAL_THRESHOLDS.BREAKFAST, departureTime)) {
              addMealCounts(gridData[dateStr].B, pax, dietary);
            }
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.LUNCH) && 
                !isTimeAfter(MEAL_THRESHOLDS.LUNCH, departureTime)) {
              // Weekend packed lunch logic for same-day stays
              if (isWeekendDay) {
                addMealCounts(gridData[dateStr].pL, pax, dietary);
              } else {
                addMealCounts(gridData[dateStr].L, pax, dietary);
              }
            }
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.DINNER) && 
                !isTimeAfter(MEAL_THRESHOLDS.DINNER, departureTime)) {
              addMealCounts(gridData[dateStr].D, pax, dietary);
            }
          } else if (isArrivalDay) {
            // Arrival day
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.BREAKFAST)) {
              addMealCounts(gridData[dateStr].B, pax, dietary);
            }
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.LUNCH)) {
              // Weekend packed lunch logic for arrival day
              if (isWeekendDay) {
                addMealCounts(gridData[dateStr].pL, pax, dietary);
              } else {
                addMealCounts(gridData[dateStr].L, pax, dietary);
              }
            }
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.DINNER)) {
              addMealCounts(gridData[dateStr].D, pax, dietary);
            }
          } else if (isDepartureDay) {
            // Departure day - provide packed meals if leaving before meal times
            if (isTimeAfter(MEAL_THRESHOLDS.BREAKFAST, departureTime)) {
              addMealCounts(gridData[dateStr].pB, pax, dietary);
            } else {
              addMealCounts(gridData[dateStr].B, pax, dietary);
            }
            
            if (isTimeAfter(MEAL_THRESHOLDS.LUNCH, departureTime)) {
              addMealCounts(gridData[dateStr].pL, pax, dietary);
            } else {
              // Weekend packed lunch logic for departure day
              if (isWeekendDay) {
                addMealCounts(gridData[dateStr].pL, pax, dietary);
              } else {
                addMealCounts(gridData[dateStr].L, pax, dietary);
              }
            }
            
            if (isTimeAfter(MEAL_THRESHOLDS.DINNER, departureTime)) {
              addMealCounts(gridData[dateStr].pD, pax, dietary);
            } else {
              addMealCounts(gridData[dateStr].D, pax, dietary);
            }
          } else {
            // Full day - all regular meals, but packed lunch on weekends
            addMealCounts(gridData[dateStr].B, pax, dietary);
            if (isWeekendDay) {
              addMealCounts(gridData[dateStr].pL, pax, dietary);
            } else {
              addMealCounts(gridData[dateStr].L, pax, dietary);
            }
            addMealCounts(gridData[dateStr].D, pax, dietary);
          }
        }
      });
    }
  });

  // Process staff (with live-in/live-out logic)
  staff.forEach(staffMember => {
    const arrivalDate = new Date(staffMember.arrivalDate);
    const departureDate = new Date(staffMember.departureDate);
    const arrivalTime = formatTime(staffMember.arrivalTime || '08:00'); // Default staff arrival
    const departureTime = formatTime(staffMember.departureTime || '17:00'); // Default staff departure
    const staffDietary = {}; // Staff typically don't have special dietary requirements in this system
    const isLiveIn = staffMember.isLiveIn !== false; // Default to true if not specified

    // Loop through each day in the week
    Object.keys(gridData).forEach(dateStr => {
      const currentDate = new Date(dateStr);
      const currentDateStr = formatDate(currentDate);
      const arrivalDateStr = formatDate(arrivalDate);
      const departureDateStr = formatDate(departureDate);

      // Check if staff member is present on this day
      if (currentDateStr >= arrivalDateStr && currentDateStr <= departureDateStr) {
        const isArrivalDay = currentDateStr === arrivalDateStr;
        const isDepartureDay = currentDateStr === departureDateStr;
        const isWeekendDay = isWeekend(currentDate);

        if (isLiveIn) {
          // Live-in staff get all meals (same logic as groups) using current thresholds
          if (isArrivalDay && isDepartureDay) {
            // Same day arrival and departure
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.BREAKFAST) && 
                !isTimeAfter(MEAL_THRESHOLDS.BREAKFAST, departureTime)) {
              addMealCounts(gridData[dateStr].B, 1, staffDietary);
            }
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.LUNCH) && 
                !isTimeAfter(MEAL_THRESHOLDS.LUNCH, departureTime)) {
              // Weekend packed lunch logic for same-day stays
              if (isWeekendDay) {
                addMealCounts(gridData[dateStr].pL, 1, staffDietary);
              } else {
                addMealCounts(gridData[dateStr].L, 1, staffDietary);
              }
            }
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.DINNER) && 
                !isTimeAfter(MEAL_THRESHOLDS.DINNER, departureTime)) {
              addMealCounts(gridData[dateStr].D, 1, staffDietary);
            }
          } else if (isArrivalDay) {
            // Arrival day
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.BREAKFAST)) {
              addMealCounts(gridData[dateStr].B, 1, staffDietary);
            }
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.LUNCH)) {
              // Weekend packed lunch logic for arrival day
              if (isWeekendDay) {
                addMealCounts(gridData[dateStr].pL, 1, staffDietary);
              } else {
                addMealCounts(gridData[dateStr].L, 1, staffDietary);
              }
            }
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.DINNER)) {
              addMealCounts(gridData[dateStr].D, 1, staffDietary);
            }
          } else if (isDepartureDay) {
            // Departure day - provide packed meals if leaving before meal times
            if (isTimeAfter(MEAL_THRESHOLDS.BREAKFAST, departureTime)) {
              addMealCounts(gridData[dateStr].pB, 1, staffDietary);
            } else {
              addMealCounts(gridData[dateStr].B, 1, staffDietary);
            }
            
            if (isTimeAfter(MEAL_THRESHOLDS.LUNCH, departureTime)) {
              addMealCounts(gridData[dateStr].pL, 1, staffDietary);
            } else {
              // Weekend packed lunch logic for departure day
              if (isWeekendDay) {
                addMealCounts(gridData[dateStr].pL, 1, staffDietary);
              } else {
                addMealCounts(gridData[dateStr].L, 1, staffDietary);
              }
            }
            
            if (isTimeAfter(MEAL_THRESHOLDS.DINNER, departureTime)) {
              addMealCounts(gridData[dateStr].pD, 1, staffDietary);
            } else {
              addMealCounts(gridData[dateStr].D, 1, staffDietary);
            }
          } else {
            // Full day - all regular meals, but packed lunch on weekends
            addMealCounts(gridData[dateStr].B, 1, staffDietary);
            if (isWeekendDay) {
              addMealCounts(gridData[dateStr].pL, 1, staffDietary);
            } else {
              addMealCounts(gridData[dateStr].L, 1, staffDietary);
            }
            addMealCounts(gridData[dateStr].D, 1, staffDietary);
          }
        } else {
          // Live-out staff only get lunch (and packed lunch on weekends) using current thresholds
          if (isArrivalDay && isDepartureDay) {
            // Same day arrival and departure - only lunch if within time range
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.LUNCH) && 
                !isTimeAfter(MEAL_THRESHOLDS.LUNCH, departureTime)) {
              // Weekend packed lunch logic for live-out staff
              if (isWeekendDay) {
                addMealCounts(gridData[dateStr].pL, 1, staffDietary);
              } else {
                addMealCounts(gridData[dateStr].L, 1, staffDietary);
              }
            }
          } else if (isArrivalDay) {
            // Arrival day - only lunch if arriving before lunch time
            if (!isTimeAfter(arrivalTime, MEAL_THRESHOLDS.LUNCH)) {
              // Weekend packed lunch logic for live-out staff
              if (isWeekendDay) {
                addMealCounts(gridData[dateStr].pL, 1, staffDietary);
              } else {
                addMealCounts(gridData[dateStr].L, 1, staffDietary);
              }
            }
          } else if (isDepartureDay) {
            // Departure day - lunch or packed lunch
            if (isTimeAfter(MEAL_THRESHOLDS.LUNCH, departureTime)) {
              addMealCounts(gridData[dateStr].pL, 1, staffDietary);
            } else {
              // Weekend packed lunch logic for live-out staff
              if (isWeekendDay) {
                addMealCounts(gridData[dateStr].pL, 1, staffDietary);
              } else {
                addMealCounts(gridData[dateStr].L, 1, staffDietary);
              }
            }
          } else {
            // Full day - only lunch for live-out staff (packed on weekends)
            if (isWeekendDay) {
              addMealCounts(gridData[dateStr].pL, 1, staffDietary);
            } else {
              addMealCounts(gridData[dateStr].L, 1, staffDietary);
            }
          }
        }
      }
    });
  });

  return gridData;
} 