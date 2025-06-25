import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import GroupForm from '../components/GroupForm.jsx';
import { CentreContext } from '../context/CentreContext.jsx';

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const { centre } = useContext(CentreContext);

  // Fetch groups from API on component mount or when centre changes
  useEffect(() => {
    fetchGroups();
  }, [centre]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch only groups for the selected centre
      const response = await fetch(`http://localhost:3001/groups?centre=${encodeURIComponent(centre)}`);
      if (response.ok) {
        const groupsData = await response.json();
        setGroups(groupsData);
      } else {
        throw new Error('API not available');
      }
    } catch (apiError) {
      // Fallback to mock data if API is not available
      console.log('API not available, using mock data');
      setGroups([]); // No mock data for other centres
      setError('Using offline data - API not available');
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new group
  const addGroup = async (newGroup) => {
    try {
      // Always include the centre field
      const response = await fetch('http://localhost:3001/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newGroup,
          centre,
          agency: newGroup.agency || "",
          dietary: {
            vegetarian: 0,
            glutenFree: 0,
            nutAllergy: 0,
            other: 0,
          }
        }),
      });

      if (response.ok) {
        const savedGroup = await response.json();
        setGroups(prevGroups => [...prevGroups, savedGroup]);
        setError(''); // Clear any previous errors
        setShowAddForm(false); // Hide the form after successful addition
      } else {
        throw new Error('API save failed');
      }
    } catch (apiError) {
      // Fallback to local state if API is not available
      console.log('API not available for saving, adding to local state');
      const groupWithId = {
        ...newGroup,
        id: crypto.randomUUID(),
        centre,
        agency: newGroup.agency || "",
        dietary: {
          vegetarian: 0,
          glutenFree: 0,
          nutAllergy: 0,
          other: 0,
        }
      };
      setGroups(prevGroups => [...prevGroups, groupWithId]);
      setError('Group added locally - API not available');
      setShowAddForm(false); // Hide the form after successful addition
    }
  };

  // Function to refresh groups from API
  const refreshGroups = () => {
    fetchGroups();
    setSelectedGroups(new Set()); // Clear selections on refresh
  };

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sorted groups
  const getSortedGroups = () => {
    if (!sortConfig.key) return groups;

    return [...groups].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types
      if (sortConfig.key === 'pax') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (sortConfig.key === 'arrivalDate' || sortConfig.key === 'departureDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Selection functions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedGroups(new Set(groups.map(group => group.id)));
    } else {
      setSelectedGroups(new Set());
    }
  };

  const handleSelectGroup = (groupId, checked) => {
    const newSelected = new Set(selectedGroups);
    if (checked) {
      newSelected.add(groupId);
    } else {
      newSelected.delete(groupId);
    }
    setSelectedGroups(newSelected);
  };

  // Delete selected groups
  const deleteSelectedGroups = async () => {
    if (selectedGroups.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedGroups.size} group(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // Try to delete from API first
      const deletePromises = Array.from(selectedGroups).map(groupId =>
        fetch(`http://localhost:3001/groups/${groupId}`, { method: 'DELETE' })
      );

      const responses = await Promise.all(deletePromises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        // Remove from local state
        setGroups(prevGroups => 
          prevGroups.filter(group => !selectedGroups.has(group.id))
        );
        setSelectedGroups(new Set());
        setError('');
      } else {
        throw new Error('Some deletions failed');
      }
    } catch (apiError) {
      // Fallback to local deletion if API is not available
      console.log('API not available for deletion, removing from local state');
      setGroups(prevGroups => 
        prevGroups.filter(group => !selectedGroups.has(group.id))
      );
      setSelectedGroups(new Set());
      setError('Groups deleted locally - API not available');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return (
      <span className="ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Helper function to check if group needs time configuration
  const needsTimeConfiguration = (group) => {
    // Check if group has new schedule format
    if (group.arrivalSchedule && group.departureSchedule) {
      // For new format, check if all schedule entries have valid times
      const hasValidArrivalTimes = group.arrivalSchedule.every(arrival => 
        arrival.time && arrival.time !== ''
      );
      const hasValidDepartureTimes = group.departureSchedule.every(departure => 
        departure.time && departure.time !== ''
      );
      
      return !hasValidArrivalTimes || !hasValidDepartureTimes;
    }
    
    // For old format, check if arrival or departure times are missing/empty
    return !group.arrivalTime || !group.departureTime || group.arrivalTime === '' || group.departureTime === '';
  };

  const sortedGroups = getSortedGroups();
  const allSelected = groups.length > 0 && selectedGroups.size === groups.length;
  const someSelected = selectedGroups.size > 0 && selectedGroups.size < groups.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
        Groups Management
      </h1>
      
      {error && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          {error}
        </div>
      )}

      {/* Info Banner about Time Configuration */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-medium text-blue-900">Time Configuration Needed</h3>
            <p className="text-blue-800 text-sm">Groups highlighted in yellow need arrival/departure times configured. Click on the group name to set specific times.</p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          {showAddForm ? 'Cancel' : '+ Add New Group'}
        </button>
        
        {selectedGroups.size > 0 && (
          <button
            onClick={deleteSelectedGroups}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Delete Selected ({selectedGroups.size})
          </button>
        )}
      </div>
      
      {showAddForm && (
        <div className="mb-6 bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Group</h3>
          <GroupForm addGroup={addGroup} />
        </div>
      )}

      {/* Groups Table - Full Width */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-blue-600 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Current Groups</h2>
          <button
            onClick={refreshGroups}
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Group Name
                  <SortIndicator column="name" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('agency')}
                >
                  Agency
                  <SortIndicator column="agency" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pax')}
                >
                  Number of People
                  <SortIndicator column="pax" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('arrivalDate')}
                >
                  Arrival Date
                  <SortIndicator column="arrivalDate" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('departureDate')}
                >
                  Departure Date
                  <SortIndicator column="departureDate" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Loading groups...
                  </td>
                </tr>
              ) : sortedGroups.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No groups found
                  </td>
                </tr>
              ) : (
                sortedGroups.map((group, index) => {
                  const needsTime = needsTimeConfiguration(group);
                  const baseRowClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";
                  const highlightClass = needsTime ? "bg-yellow-100 hover:bg-yellow-200" : "hover:bg-gray-100";
                  const rowClass = needsTime ? "bg-yellow-100 hover:bg-yellow-200" : `${baseRowClass} hover:bg-gray-100`;
                  
                  return (
                    <tr key={group.id} className={rowClass}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(group.id)}
                          onChange={(e) => handleSelectGroup(group.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center">
                          <Link 
                            to={`/group/${group.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {group.name}
                          </Link>
                          {needsTime && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-200 text-yellow-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Time needed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {group.agency || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {group.pax}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {new Date(group.arrivalDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {needsTime && (
                            <div className="text-xs text-yellow-600 font-medium">Time not set</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {new Date(group.departureDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                          {needsTime && (
                            <div className="text-xs text-yellow-600 font-medium">Time not set</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default GroupsPage; 