import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { CentreContext } from '../context/CentreContext.jsx';

function Navbar() {
  const location = useLocation();
  const { centre, setCentre, centres } = useContext(CentreContext);

  const isActiveLink = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <span className="text-white text-xl font-bold">Meal Order App</span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActiveLink('/') 
                    ? 'bg-blue-900 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/groups"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActiveLink('/groups') 
                    ? 'bg-blue-900 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Groups
              </Link>
              <Link
                to="/staff"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActiveLink('/staff') 
                    ? 'bg-blue-900 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Staff
              </Link>
              <Link
                to="/meal-grid"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActiveLink('/meal-grid') 
                    ? 'bg-blue-900 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Meal Grid
              </Link>
              <Link
                to="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActiveLink('/settings') 
                    ? 'bg-blue-900 text-white' 
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Settings
              </Link>
            </div>
          </div>
          {/* Centre Selector */}
          <div className="flex items-center">
            <label htmlFor="centre-select" className="text-white mr-2 font-medium">Centre:</label>
            <select
              id="centre-select"
              value={centre}
              onChange={e => setCentre(e.target.value)}
              className="rounded px-2 py-1 text-sm bg-white text-blue-900 focus:outline-none"
            >
              {centres.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 