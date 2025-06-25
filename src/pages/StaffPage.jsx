import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import StaffForm from '../components/StaffForm.jsx';
import { CentreContext } from '../context/CentreContext.jsx';

function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const { centre } = useContext(CentreContext);

  // Fetch staff data from API when centre changes
  useEffect(() => {
    fetchStaff();
  }, [centre]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`http://localhost:3001/staff?centre=${encodeURIComponent(centre)}`);
      if (response.ok) {
        const staffData = await response.json();
        setStaff(staffData);
      } else {
        throw new Error('API not available');
      }
    } catch (apiError) {
      // Fallback to mock data if API is not available
      console.log('API not available, using mock data');
      setStaff([]); // No mock data for other centres
      setError('Using offline data - API not available');
    } finally {
      setLoading(false);
    }
  };

  // Add new staff member
  const addStaff = async (newStaff) => {
    try {
      // Always include the centre field
      const response = await fetch('http://localhost:3001/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newStaff,
          centre,
          isLiveIn: newStaff.isLiveIn !== false // Default to true if not specified
        }),
      });

      if (response.ok) {
        const savedStaff = await response.json();
        setStaff(prevStaff => [...prevStaff, savedStaff]);
        setError(''); // Clear any previous errors
        setShowAddForm(false); // Hide the form after successful addition
      } else {
        throw new Error('API save failed');
      }
    } catch (apiError) {
      // Fallback to local state if API is not available
      console.log('API not available for saving, adding to local state');
      const staffWithId = {
        ...newStaff,
        id: crypto.randomUUID(),
        centre,
        isLiveIn: newStaff.isLiveIn !== false
      };
      setStaff(prevStaff => [...prevStaff, staffWithId]);
      setError('Staff member added locally - API not available');
      setShowAddForm(false); // Hide the form after successful addition
    }
  };

  // Function to refresh staff from API
  const refreshStaff = () => {
    fetchStaff();
    setSelectedStaff(new Set()); // Clear selections on refresh
  };

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sorted staff
  const getSortedStaff = () => {
    if (!sortConfig.key) return staff;

    return [...staff].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types
      if (sortConfig.key === 'arrivalDate' || sortConfig.key === 'departureDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortConfig.key === 'isLiveIn') {
        aValue = aValue ? 'Live-in' : 'Live-out';
        bValue = bValue ? 'Live-in' : 'Live-out';
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
      setSelectedStaff(new Set(staff.map(member => member.id)));
    } else {
      setSelectedStaff(new Set());
    }
  };

  const handleSelectStaff = (staffId, checked) => {
    const newSelected = new Set(selectedStaff);
    if (checked) {
      newSelected.add(staffId);
    } else {
      newSelected.delete(staffId);
    }
    setSelectedStaff(newSelected);
  };

  // Delete selected staff
  const deleteSelectedStaff = async () => {
    if (selectedStaff.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedStaff.size} staff member(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // Try to delete from API first
      const deletePromises = Array.from(selectedStaff).map(staffId =>
        fetch(`http://localhost:3001/staff/${staffId}`, { method: 'DELETE' })
      );

      const responses = await Promise.all(deletePromises);
      const allSuccessful = responses.every(response => response.ok);

      if (allSuccessful) {
        // Remove from local state
        setStaff(prevStaff => 
          prevStaff.filter(member => !selectedStaff.has(member.id))
        );
        setSelectedStaff(new Set());
        setError('');
      } else {
        throw new Error('Some deletions failed');
      }
    } catch (apiError) {
      // Fallback to local deletion if API is not available
      console.log('API not available for deletion, removing from local state');
      setStaff(prevStaff => 
        prevStaff.filter(member => !selectedStaff.has(member.id))
      );
      setSelectedStaff(new Set());
      setError('Staff members deleted locally - API not available');
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

  const sortedStaff = getSortedStaff();
  const allSelected = staff.length > 0 && selectedStaff.size === staff.length;
  const someSelected = selectedStaff.size > 0 && selectedStaff.size < staff.length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">Loading staff data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
        Staff Management
      </h1>
      
      {error && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          {error}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          {showAddForm ? 'Cancel' : '+ Add New Staff Member'}
        </button>
        
        {selectedStaff.size > 0 && (
          <button
            onClick={deleteSelectedStaff}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Delete Selected ({selectedStaff.size})
          </button>
        )}
      </div>
      
      {showAddForm && (
        <div className="mb-6 bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Staff Member</h3>
          <StaffForm onAddStaff={addStaff} />
        </div>
      )}

      {/* Staff Table - Full Width */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-blue-600 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Current Staff Members</h2>
          <button
            onClick={refreshStaff}
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
                  Name
                  <SortIndicator column="name" />
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('isLiveIn')}
                >
                  Accommodation
                  <SortIndicator column="isLiveIn" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Loading staff...
                  </td>
                </tr>
              ) : sortedStaff.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No staff members found
                  </td>
                </tr>
              ) : (
                sortedStaff.map((member, index) => (
                  <tr key={member.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStaff.has(member.id)}
                        onChange={(e) => handleSelectStaff(member.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link 
                        to={`/staff/${member.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {member.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.arrivalDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.departureDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.isLiveIn 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.isLiveIn ? 'Live-in' : 'Live-out'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StaffPage; 