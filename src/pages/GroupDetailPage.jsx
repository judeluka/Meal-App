import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    arrivals: [],
    departures: []
  });
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [dietaryForm, setDietaryForm] = useState({ vegetarian: 0, glutenFree: 0, nutAllergy: 0, other: 0 });
  const [dietaryError, setDietaryError] = useState('');

  // Fetch group data from API
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await fetch(`http://localhost:3001/groups/${groupId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch group data');
        }
        const data = await response.json();
        setGroup(data);
        
        // Initialize edit form data
        setEditFormData({
          agency: data.agency || '',
          name: data.name || '',
          pax: data.pax || '',
          arrivalDate: data.arrivalDate || '',
          arrivalTime: data.arrivalTime || '',
          departureDate: data.departureDate || '',
          departureTime: data.departureTime || ''
        });

        // Initialize schedule data
        setScheduleData({
          arrivals: data.arrivalSchedule || [{ date: data.arrivalDate, time: data.arrivalTime, pax: data.pax }],
          departures: data.departureSchedule || [{ date: data.departureDate, time: data.departureTime, pax: data.pax }]
        });

        if (data.dietary) {
          setDietaryForm({
            vegetarian: data.dietary.vegetarian || 0,
            glutenFree: data.dietary.glutenFree || 0,
            nutAllergy: data.dietary.nutAllergy || 0,
            other: data.dietary.other || 0,
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  // Format time for display
  const formatTime = (time) => {
    if (!time) return 'Time not specified';
    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Handle form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle schedule input changes
  const handleScheduleChange = (type, index, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Add new arrival/departure slot
  const addScheduleSlot = (type) => {
    const newSlot = {
      date: type === 'arrivals' ? group.arrivalDate : group.departureDate,
      time: '',
      pax: 1
    };
    setScheduleData(prev => ({
      ...prev,
      [type]: [...prev[type], newSlot]
    }));
  };

  // Remove arrival/departure slot
  const removeScheduleSlot = (type, index) => {
    if (scheduleData[type].length > 1) {
      setScheduleData(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
    }
  };

  // Save schedule data
  const handleSaveSchedule = async () => {
    // Validate that total pax matches
    const totalArrivalPax = scheduleData.arrivals.reduce((sum, arrival) => sum + parseInt(arrival.pax || 0), 0);
    const totalDeparturePax = scheduleData.departures.reduce((sum, departure) => sum + parseInt(departure.pax || 0), 0);
    
    if (totalArrivalPax !== group.pax || totalDeparturePax !== group.pax) {
      alert(`Total participants in schedule must equal group size (${group.pax}). Current: Arrivals ${totalArrivalPax}, Departures ${totalDeparturePax}`);
      return;
    }

    setSaving(true);
    try {
      const updatedGroup = {
        ...group,
        arrivalSchedule: scheduleData.arrivals,
        departureSchedule: scheduleData.departures
      };

      const response = await fetch(`http://localhost:3001/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedGroup),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }
      
      const savedGroup = await response.json();
      setGroup(savedGroup);
      setShowScheduleModal(false);
    } catch (err) {
      alert('Failed to update schedule: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle save edited group
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!editFormData.name || !editFormData.pax || !editFormData.arrivalDate || 
        !editFormData.arrivalTime || !editFormData.departureDate || !editFormData.departureTime) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const updatedGroup = {
        ...group,
        ...editFormData,
        pax: parseInt(editFormData.pax, 10)
      };

      const response = await fetch(`http://localhost:3001/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedGroup),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update group');
      }
      
      const savedGroup = await response.json();
      setGroup(savedGroup);
      setShowEditForm(false);
      
      // Update schedule data to reflect new basic info
      setScheduleData({
        arrivals: savedGroup.arrivalSchedule || [{ date: savedGroup.arrivalDate, time: savedGroup.arrivalTime, pax: savedGroup.pax }],
        departures: savedGroup.departureSchedule || [{ date: savedGroup.departureDate, time: savedGroup.departureTime, pax: savedGroup.pax }]
      });
    } catch (err) {
      alert('Failed to update group: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    // Reset form data to original values
    setEditFormData({
      agency: group.agency || '',
      name: group.name || '',
      pax: group.pax || '',
      arrivalDate: group.arrivalDate || '',
      arrivalTime: group.arrivalTime || '',
      departureDate: group.departureDate || '',
      departureTime: group.departureTime || ''
    });
    setShowEditForm(false);
  };

  // Handle delete group
  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:3001/groups/${groupId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete group');
      }
      
      // Navigate back to groups page after successful deletion
      navigate('/groups');
    } catch (err) {
      alert('Failed to delete group: ' + err.message);
      setDeleting(false);
    }
  };

  // Handle edit group
  const handleEditGroup = () => {
    setShowEditForm(true);
  };

  // Handle plan meals
  const handlePlanMeals = () => {
    // Navigate to meal grid for the week of this group's arrival
    const arrivalDate = new Date(group.arrivalDate);
    const formattedDate = arrivalDate.toISOString().split('T')[0];
    navigate(`/meal-grid?date=${formattedDate}`);
  };

  const handleDietaryInputChange = (e) => {
    const { name, value } = e.target;
    const intValue = Math.max(0, Math.min(parseInt(value) || 0, group.pax));
    setDietaryForm(prev => ({ ...prev, [name]: intValue }));
  };

  const handleSaveDietary = async (e) => {
    e.preventDefault();
    const total =
      (parseInt(dietaryForm.vegetarian) || 0) +
      (parseInt(dietaryForm.glutenFree) || 0) +
      (parseInt(dietaryForm.nutAllergy) || 0) +
      (parseInt(dietaryForm.other) || 0);
    if (total > group.pax) {
      setDietaryError(`Total dietary requirements (${total}) cannot exceed number of people (${group.pax})`);
      return;
    }
    setDietaryError('');
    setSaving(true);
    try {
      const updatedGroup = { ...group, dietary: { ...dietaryForm } };
      const response = await fetch(`http://localhost:3001/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGroup),
      });
      if (!response.ok) throw new Error('Failed to update dietary requirements');
      const savedGroup = await response.json();
      setGroup(savedGroup);
      setShowDietaryModal(false);
    } catch (err) {
      setDietaryError('Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <div className="text-lg text-gray-600">Loading group details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <div className="text-lg text-red-600">Error: {error}</div>
          <p className="mt-2 text-gray-600">Please make sure the JSON server is running on port 3001.</p>
          <Link 
            to="/groups" 
            className="mt-4 inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <div className="text-lg text-red-600">Group not found</div>
          <Link 
            to="/groups" 
            className="mt-4 inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Groups
          </Link>
        </div>
      </div>
    );
  }

  // Calculate duration of stay
  const arrivalDate = new Date(group.arrivalDate);
  const departureDate = new Date(group.departureDate);
  const durationMs = departureDate - arrivalDate;
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with group name and back button */}
      <div className="mb-8">
        <Link 
          to="/groups" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Groups
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 text-center">{group.name}</h1>
        <p className="text-center text-gray-600 mt-2">{durationDays} Week{durationDays !== 1 ? 's' : ''}</p>
      </div>

      {/* Schedule Management Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Manage Arrival & Departure Schedule</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Arrivals Section */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Arrival Schedule</h4>
                  {scheduleData.arrivals.map((arrival, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={arrival.date}
                            onChange={(e) => handleScheduleChange('arrivals', index, 'date', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                          <input
                            type="time"
                            value={arrival.time}
                            onChange={(e) => handleScheduleChange('arrivals', index, 'time', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">People</label>
                          <input
                            type="number"
                            min="1"
                            value={arrival.pax}
                            onChange={(e) => handleScheduleChange('arrivals', index, 'pax', parseInt(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {scheduleData.arrivals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduleSlot('arrivals', index)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addScheduleSlot('arrivals')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Arrival Time
                  </button>
                  <div className="mt-2 text-xs text-gray-600">
                    Total: {scheduleData.arrivals.reduce((sum, a) => sum + parseInt(a.pax || 0), 0)} people
                  </div>
                </div>

                {/* Departures Section */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Departure Schedule</h4>
                  {scheduleData.departures.map((departure, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={departure.date}
                            onChange={(e) => handleScheduleChange('departures', index, 'date', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                          <input
                            type="time"
                            value={departure.time}
                            onChange={(e) => handleScheduleChange('departures', index, 'time', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">People</label>
                          <input
                            type="number"
                            min="1"
                            value={departure.pax}
                            onChange={(e) => handleScheduleChange('departures', index, 'pax', parseInt(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {scheduleData.departures.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduleSlot('departures', index)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addScheduleSlot('departures')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Departure Time
                  </button>
                  <div className="mt-2 text-xs text-gray-600">
                    Total: {scheduleData.departures.reduce((sum, d) => sum + parseInt(d.pax || 0), 0)} people
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Group</h3>
              <form onSubmit={handleSaveEdit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="edit-agency" className="block text-gray-700 text-sm font-bold mb-2">
                      Agency
                    </label>
                    <input
                      type="text"
                      id="edit-agency"
                      name="agency"
                      value={editFormData.agency}
                      onChange={handleEditInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Enter agency name (optional)"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-name" className="block text-gray-700 text-sm font-bold mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Enter group name"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="edit-pax" className="block text-gray-700 text-sm font-bold mb-2">
                    Number of People *
                  </label>
                  <input
                    type="number"
                    id="edit-pax"
                    name="pax"
                    value={editFormData.pax}
                    onChange={handleEditInputChange}
                    min="1"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter number of people"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="edit-arrivalDate" className="block text-gray-700 text-sm font-bold mb-2">
                      Arrival Date *
                    </label>
                    <input
                      type="date"
                      id="edit-arrivalDate"
                      name="arrivalDate"
                      value={editFormData.arrivalDate}
                      onChange={handleEditInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-arrivalTime" className="block text-gray-700 text-sm font-bold mb-2">
                      Arrival Time *
                    </label>
                    <input
                      type="time"
                      id="edit-arrivalTime"
                      name="arrivalTime"
                      value={editFormData.arrivalTime}
                      onChange={handleEditInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="edit-departureDate" className="block text-gray-700 text-sm font-bold mb-2">
                      Departure Date *
                    </label>
                    <input
                      type="date"
                      id="edit-departureDate"
                      name="departureDate"
                      value={editFormData.departureDate}
                      onChange={handleEditInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-departureTime" className="block text-gray-700 text-sm font-bold mb-2">
                      Departure Time *
                    </label>
                    <input
                      type="time"
                      id="edit-departureTime"
                      name="departureTime"
                      value={editFormData.departureTime}
                      onChange={handleEditInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Group details cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Information Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-blue-600">
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {group.agency && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Agency:</span>
                  <span className="text-lg text-gray-900">{group.agency}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Number of People:</span>
                <span className="text-lg font-bold text-blue-600">{group.pax}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Duration:</span>
                <span className="text-lg text-gray-900">{durationDays} day{durationDays !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-green-600 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Schedule</h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="text-green-100 hover:text-white text-sm underline"
            >
              Manage Times
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <span className="font-medium text-gray-700 block">Arrivals:</span>
                {group.arrivalSchedule ? (
                  <div className="space-y-1">
                    {group.arrivalSchedule.map((arrival, index) => (
                      <div key={index} className="text-sm text-gray-900">
                        <span className="font-medium">{arrival.pax} people</span> on{' '}
                        <span className="font-semibold">
                          {new Date(arrival.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>{' '}
                        at {formatTime(arrival.time)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-lg text-gray-900">
                    <div className="font-semibold">
                      {new Date(group.arrivalDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      at {formatTime(group.arrivalTime)}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <span className="font-medium text-gray-700 block">Departures:</span>
                {group.departureSchedule ? (
                  <div className="space-y-1">
                    {group.departureSchedule.map((departure, index) => (
                      <div key={index} className="text-sm text-gray-900">
                        <span className="font-medium">{departure.pax} people</span> on{' '}
                        <span className="font-semibold">
                          {new Date(departure.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>{' '}
                        at {formatTime(departure.time)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-lg text-gray-900">
                    <div className="font-semibold">
                      {new Date(group.departureDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      at {formatTime(group.departureTime)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dietary Requirements Card */}
      {group.dietary && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-orange-600 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Dietary Requirements</h2>
            <button
              onClick={() => setShowDietaryModal(true)}
              className="text-orange-100 hover:text-white text-sm underline ml-4"
            >
              Edit
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{group.dietary.vegetarian || 0}</div>
                <div className="text-sm text-gray-600">Vegetarian</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{group.dietary.glutenFree || 0}</div>
                <div className="text-sm text-gray-600">Gluten Free</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{group.dietary.nutAllergy || 0}</div>
                <div className="text-sm text-gray-600">Nut Allergy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{group.dietary.other || 0}</div>
                <div className="text-sm text-gray-600">Other</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dietary Edit Modal */}
      {showDietaryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit Dietary Requirements</h3>
              <form onSubmit={handleSaveDietary}>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Vegetarian</label>
                    <input
                      type="number"
                      name="vegetarian"
                      min="0"
                      max={group.pax}
                      value={dietaryForm.vegetarian}
                      onChange={handleDietaryInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Gluten Free</label>
                    <input
                      type="number"
                      name="glutenFree"
                      min="0"
                      max={group.pax}
                      value={dietaryForm.glutenFree}
                      onChange={handleDietaryInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Nut Allergy</label>
                    <input
                      type="number"
                      name="nutAllergy"
                      min="0"
                      max={group.pax}
                      value={dietaryForm.nutAllergy}
                      onChange={handleDietaryInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Other</label>
                    <input
                      type="number"
                      name="other"
                      min="0"
                      max={group.pax}
                      value={dietaryForm.other}
                      onChange={handleDietaryInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
                {dietaryError && <div className="text-red-600 text-sm mb-2">{dietaryError}</div>}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDietaryModal(false)}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-orange-500 text-white text-base font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-center space-x-4 mb-8">
        <button 
          onClick={handleEditGroup}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors"
        >
          Edit Group
        </button>
        <button 
          onClick={handlePlanMeals}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors"
        >
          Plan Meals
        </button>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors"
        >
          Delete Group
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Group</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{group.name}"? This action cannot be undone and will remove all associated meal planning data.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDeleteGroup}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetailPage; 