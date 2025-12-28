import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

const Home = () => {
  const navigate = useNavigate();
  // Get user info and logout function from our global state
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout(); // Clear user state
    navigate('/login'); // Redirect to login page
  };

  // A small component for the "Logout" link
  const LogoutButton = () => (
    <button 
      onClick={handleLogout}
      className="text-blue-500 text-sm font-semibold hover:underline"
    >
      Logout
    </button>
  );

  // Simple SVG icons for the menu items
  const AttendanceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );

  const FutureIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );

  return (
    <Card 
      // Display user's first name, fallback to 'User' if not available
      title={`Hello, ${user?.firstName || 'User'}`}
      // Pass our LogoutButton component to the Card header
      actionComponent={<LogoutButton />}
    >
      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-4">Main Menu</h3>
        <div className="flex flex-col gap-3">
          
          {/* 1. Member Attendance Button (Active) */}
          <button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            // Custom Tailwind classes to match the design
            className="!bg-blue-50 !border-blue-200 text-left flex items-center gap-4 hover:!bg-blue-100 transition-colors p-4"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <AttendanceIcon />
            </div>
            <div>
              <h4 className="font-bold text-blue-900">Member Attendance</h4>
              <p className="text-sm text-blue-700 font-normal">Take attendance for services and events.</p>
            </div>
          </button>

          {/* 2. Small Groups Button (Future/Disabled) */}
          <button 
            variant="outline" 
            disabled // Makes the button unclickable
            className="!bg-gray-50 !border-gray-200 text-left flex items-center gap-4 cursor-not-allowed p-4 opacity-70"
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <FutureIcon />
            </div>
            <div>
              <h4 className="font-bold text-gray-500">Small Groups (Future)</h4>
              <p className="text-sm text-gray-400 font-normal">Manage small group information.</p>
            </div>
          </button>

          {/* 3. Events Button (Future/Disabled) */}
          <button 
            variant="outline" 
            disabled
            className="!bg-gray-50 !border-gray-200 text-left flex items-center gap-4 cursor-not-allowed p-4 opacity-70"
          >
            <div className="p-2 bg-gray-100 rounded-lg">
              <FutureIcon />
            </div>
            <div>
              <h4 className="font-bold text-gray-500">Events (Future)</h4>
              <p className="text-sm text-gray-400 font-normal">Create and manage church events.</p>
            </div>
          </button>

        </div>
      </div>
    </Card>
  );
};

export default Home;