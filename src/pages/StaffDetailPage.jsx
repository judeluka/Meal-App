import { useParams } from 'react-router-dom';

function StaffDetailPage() {
  const { staffId } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
        Details for Staff ID: {staffId}
      </h1>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <p className="text-gray-600">Staff member details and assignments coming soon...</p>
      </div>
    </div>
  );
}

export default StaffDetailPage; 