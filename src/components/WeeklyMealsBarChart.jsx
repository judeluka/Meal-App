import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

function WeeklyMealsBarChart({ weeklyBreakdown }) {
  // Prepare data for recharts
  const data = weeklyBreakdown.map(week => ({
    week: week.weekStart,
    regular: (week.totalMeals || 0) - (week.totalPackedMeals || 0),
    packed: week.totalPackedMeals || 0,
  }));

  return (
    <div className="w-full h-96 bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-900">Weekly Meals Overview</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barCategoryGap={20}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} tickFormatter={date => new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value, name) => [value, name === 'regular' ? 'Regular Meals' : 'Packed Meals']} />
          <Legend wrapperStyle={{ fontSize: 14 }} />
          <Bar dataKey="regular" fill="#2563eb" name="Regular Meals" radius={[8, 8, 0, 0]} />
          <Bar dataKey="packed" fill="#f59e42" name="Packed Meals" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WeeklyMealsBarChart; 