import { useState } from 'react';

function StaffForm({ onAddStaff }) {
  const [formData, setFormData] = useState({
    name: '',
    arrivalDate: '',
    departureDate: '',
    isLiveIn: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.arrivalDate || !formData.departureDate) {
      alert('Please fill in all fields');
      return;
    }

    // Check if departure date is after arrival date
    if (new Date(formData.departureDate) <= new Date(formData.arrivalDate)) {
      alert('Departure date must be after arrival date');
      return;
    }

    onAddStaff(formData);
    
    // Reset form
    setFormData({
      name: '',
      arrivalDate: '',
      departureDate: '',
      isLiveIn: true
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Staff Member</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            Staff Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter staff member name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="arrivalDate" className="block text-gray-700 text-sm font-bold mb-2">
              Arrival Date
            </label>
            <input
              type="date"
              id="arrivalDate"
              name="arrivalDate"
              value={formData.arrivalDate}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div>
            <label htmlFor="departureDate" className="block text-gray-700 text-sm font-bold mb-2">
              Departure Date
            </label>
            <input
              type="date"
              id="departureDate"
              name="departureDate"
              value={formData.departureDate}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isLiveIn"
              name="isLiveIn"
              checked={formData.isLiveIn}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="isLiveIn" className="ml-2 block text-sm text-gray-700">
              Live-in staff member
            </label>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Live-in staff receive all meals (breakfast, lunch, dinner). Live-out staff only receive lunch.
          </p>
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
        >
          Add Staff Member
        </button>
      </form>
    </div>
  );
}

export default StaffForm; 