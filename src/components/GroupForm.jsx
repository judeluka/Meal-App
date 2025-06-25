import { useState } from 'react';

function GroupForm({ addGroup }) {
  const [formData, setFormData] = useState({
    agency: '',
    name: '',
    pax: '',
    arrivalDate: '',
    arrivalTime: '',
    departureDate: '',
    departureTime: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.pax || !formData.arrivalDate || !formData.arrivalTime || !formData.departureDate || !formData.departureTime) {
      alert('Please fill in all required fields');
      return;
    }

    // Convert pax to number
    const groupData = {
      ...formData,
      pax: parseInt(formData.pax, 10)
    };

    addGroup(groupData);
    
    // Reset form
    setFormData({
      agency: '',
      name: '',
      pax: '',
      arrivalDate: '',
      arrivalTime: '',
      departureDate: '',
      departureTime: ''
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Group</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="agency" className="block text-gray-700 text-sm font-bold mb-2">
            Agency
          </label>
          <input
            type="text"
            id="agency"
            name="agency"
            value={formData.agency}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter agency name (optional)"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
            Group Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter group name"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="pax" className="block text-gray-700 text-sm font-bold mb-2">
            Number of People *
          </label>
          <input
            type="number"
            id="pax"
            name="pax"
            value={formData.pax}
            onChange={handleChange}
            min="1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter number of people"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="arrivalDate" className="block text-gray-700 text-sm font-bold mb-2">
              Arrival Date *
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
            <label htmlFor="arrivalTime" className="block text-gray-700 text-sm font-bold mb-2">
              Arrival Time *
            </label>
            <input
              type="time"
              id="arrivalTime"
              name="arrivalTime"
              value={formData.arrivalTime}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="departureDate" className="block text-gray-700 text-sm font-bold mb-2">
              Departure Date *
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

          <div>
            <label htmlFor="departureTime" className="block text-gray-700 text-sm font-bold mb-2">
              Departure Time *
            </label>
            <input
              type="time"
              id="departureTime"
              name="departureTime"
              value={formData.departureTime}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
        >
          Add Group
        </button>
      </form>
    </div>
  );
}

export default GroupForm; 