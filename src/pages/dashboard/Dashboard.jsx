// import React, { useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Card from '../../components/ui/Card';
// import { useAuth } from '../../contexts/AuthContext';
// import SettingsMenu from '../../components/ui/SettingsMenu';

// const Home = () => {
//   const navigate = useNavigate();
//   // Get user info and logout function from our global state
//   const { user, logout } = useAuth();

//   const handleLogout = () => {
//     logout(); // Clear user state
//     navigate('/login'); // Redirect to login page
//   };

//   // Simple SVG icons for the menu items
//   const AttendanceIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
//     </svg>
//   );

//   const FutureIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//     </svg>
//   );

//   return (
//     <Card 
//       // Display user's first name, fallback to 'User' if not available
//       title={`Hello, ${user?.firstName || 'User'}`}
//       // Pass our LogoutButton component to the Card header
//       actionComponent={<SettingsMenu onLogout={handleLogout}/>}
//     >
//       <div>
//         <h3 className="text-lg font-bold text-gray-700 mb-4">Main Menu</h3>
//         <div className="flex flex-col gap-3">
          
//           {/* 1. Member Attendance Button (Active) */}
//           <button 
//             // variant="outline" 
//             onClick={() => navigate('/dashboard')}
//             // Custom Tailwind classes to match the design
//             className="!bg-blue-50 !border-blue-200 text-left flex items-center gap-4 hover:!bg-blue-100 transition-colors p-4"
//           >
//             <div className="p-2 bg-blue-100 rounded-lg">
//               <AttendanceIcon />
//             </div>
//             <div>
//               <h4 className="font-bold text-blue-900">Member Attendance</h4>
//               <p className="text-sm text-blue-700 font-normal">Take attendance for services and events.</p>
//             </div>
//           </button>

//           {/* 2. Small Groups Button (Future/Disabled) */}
//           <button 
//             variant="outline" 
//             disabled // Makes the button unclickable
//             className="!bg-gray-50 !border-gray-200 text-left flex items-center gap-4 cursor-not-allowed p-4 opacity-70"
//           >
//             <div className="p-2 bg-gray-100 rounded-lg">
//               <FutureIcon />
//             </div>
//             <div>
//               <h4 className="font-bold text-gray-500">Small Groups (Future)</h4>
//               <p className="text-sm text-gray-400 font-normal">Manage small group information.</p>
//             </div>
//           </button>

//           {/* 3. Events Button (Future/Disabled) */}
//           <button 
//             variant="outline" 
//             disabled
//             className="!bg-gray-50 !border-gray-200 text-left flex items-center gap-4 cursor-not-allowed p-4 opacity-70"
//           >
//             <div className="p-2 bg-gray-100 rounded-lg">
//               <FutureIcon />
//             </div>
//             <div>
//               <h4 className="font-bold text-gray-500">Events (Future)</h4>
//               <p className="text-sm text-gray-400 font-normal">Create and manage church events.</p>
//             </div>
//           </button>

//         </div>
//       </div>
//     </Card>
//   );
// };

// export default Home;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js'; // Import Plotly
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import SettingsMenu from '../../components/ui/SettingsMenu';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State for the Time Filter Dropdown
  const [timeFilter, setTimeFilter] = useState('Month');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- DUMMY DATA ---

  // 1. Attendance Data (Line Chart)
  const attendanceData = [
    {
      x: ['2023-01-01', '2023-02-01', '2023-03-01', '2023-04-01', '2023-05-01', '2023-06-01'],
      y: [120, 150, 130, 170, 160, 200],
      type: 'scatter',
      mode: 'lines',
      marker: { color: '#2563eb' }, // Blue
      line: { shape: 'spline' }, // Smooth curves like the wireframe
    },
  ];

  // 2. Gender Data (Pie Chart)
  const genderData = [
    {
      values: [45, 55],
      labels: ['Male', 'Female'],
      type: 'pie',
      marker: { colors: ['#60a5fa', '#f472b6'] } // Light Blue, Pink
    },
  ];

  // 3. Nationality Data (Pie Chart)
  const nationalityData = [
    {
      values: [30, 20, 15, 10, 25],
      labels: ['American', 'British', 'Canadian', 'Nigerian', 'Other'],
      type: 'pie',
      textinfo: 'none', // Hide text on slice to match wireframe style
    },
  ];

  // 4. Age Distribution (Bar Chart)
  const ageData = [
    {
      x: ['0-18', '19-30', '31-50', '51-70', '70+'],
      y: [20, 45, 60, 35, 15],
      type: 'bar',
      marker: { color: '#9ca3af' } // Gray
    },
  ];

  // 5. Role Count (Bar Chart)
  const roleData = [
    {
      x: ['Member', 'Visitor', 'Leader', 'Volunteer'],
      y: [150, 30, 15, 25],
      type: 'bar',
      marker: { color: '#9ca3af' } // Gray
    },
  ];

  // Shared Layout Config for cleanliness
  const commonLayout = {
    autosize: true,
    margin: { l: 40, r: 20, t: 30, b: 40 },
    font: { family: 'inherit' },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };

  return (
    <Card 
      title="Churchlytics Dashboard"
      actionComponent={<SettingsMenu onLogout={handleLogout}/>}
    >
      <div className="flex flex-col gap-6">

        {/* --- ROW 1: Attendance Over Time --- */}
        <div className="border border-gray-300 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-700">Attendance over time</h3>
            {/* Time Dropdown */}
            <select 
              className="border border-gray-400 rounded px-2 py-1 text-sm bg-white"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
              <option value="Year">Year</option>
            </select>
          </div>
          
          <div className="h-64 w-full border border-gray-800">
            <Plot
              data={attendanceData}
              layout={{
                ...commonLayout,
                title: '',
                xaxis: { showgrid: false },
                yaxis: { showgrid: false },
              }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

        {/* --- ROW 2: Gender & Nationality (Grid) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Gender */}
          <div className="flex flex-col items-center">
            <div className="border border-black px-4 py-1 mb-2 bg-white font-medium">
              Gender
            </div>
            <div className="w-full h-64">
              <Plot
                data={genderData}
                layout={{ ...commonLayout, showlegend: false }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                config={{ displayModeBar: false }}
              />
            </div>
          </div>

          {/* Nationality */}
          <div className="flex flex-col items-center">
            <div className="border border-black px-4 py-1 mb-2 bg-white font-medium">
              Nationality
            </div>
            <div className="w-full h-64">
              <Plot
                data={nationalityData}
                layout={{ ...commonLayout, showlegend: false }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                config={{ displayModeBar: false }}
              />
            </div>
          </div>
        </div>

        {/* --- ROW 3: Age Distribution --- */}
        <div className="border border-gray-300 p-4 rounded-md">
          <div className="border border-black px-4 py-1 inline-block mb-2 bg-white font-medium">
            Age distribution
          </div>
          <div className="h-64 w-full border border-gray-800">
            <Plot
              data={ageData}
              layout={{
                ...commonLayout,
                bargap: 0.1,
              }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

        {/* --- ROW 4: Role Count --- */}
        <div className="border border-gray-300 p-4 rounded-md">
           <div className="border border-black px-4 py-1 inline-block mb-2 bg-white font-medium">
            Role Count
          </div>
          <div className="h-64 w-full border border-gray-800">
            <Plot
              data={roleData}
              layout={{
                ...commonLayout,
                bargap: 0.1,
              }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

      </div>
    </Card>
  );
};

export default Dashboard;