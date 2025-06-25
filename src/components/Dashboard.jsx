function Dashboard({ groups }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Groups</h2>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Group Name
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Number of People
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Arrival Date
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Departure Date
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-5 py-4 border-b border-gray-200 text-center text-gray-500">
                  No groups found
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 border-b border-gray-200 text-sm font-medium text-gray-900">
                    {group.name}
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600">
                    {group.pax}
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600">
                    {new Date(group.arrivalDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-5 py-4 border-b border-gray-200 text-sm text-gray-600">
                    {new Date(group.departureDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard; 