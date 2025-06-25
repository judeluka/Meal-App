import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import StaffPage from './pages/StaffPage.jsx';
import GroupDetailPage from './pages/GroupDetailPage.jsx';
import StaffDetailPage from './pages/StaffDetailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import MealGridPage from './pages/MealGridPage.jsx';
import { CentreProvider } from './context/CentreContext.jsx';

function App() {
  return (
    <CentreProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="py-8">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/group/:groupId" element={<GroupDetailPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/staff/:staffId" element={<StaffDetailPage />} />
              <Route path="/meal-grid" element={<MealGridPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </CentreProvider>
  );
}

export default App; 