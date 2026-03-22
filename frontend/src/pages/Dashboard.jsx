import { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, UserCheck, UserPlus } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('Dashboard: Component rendering', { loading, hasStats: !!stats });

  useEffect(() => {
    const fetchStats = async () => {
      console.log('Dashboard: Fetching stats...');
      try {
        const response = await api.get('/users/stats');
        console.log('Dashboard: Stats received', response.data);
        setStats(response.data);
      } catch (error) {
        console.error('Dashboard: Failed to fetch stats', error);
      } finally {
        setLoading(false);
        console.log('Dashboard: Loading set to false');
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    console.log('Dashboard: Rendering loading state');
    return <div>Loading Dashboard Data...</div>;
  }

  console.log('Dashboard: Rendering main content');
  return (
    <div>
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Overview</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats?.totalUsers || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Admin Users</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats?.adminUsers || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">New Users (7 Days)</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats?.newUsersLastWeek || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
