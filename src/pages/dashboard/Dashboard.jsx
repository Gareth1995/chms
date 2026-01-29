import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import SettingsMenu from '../../components/ui/SettingsMenu';
import { getEvents, getAttendanceStats, getMemberGenderStats } from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Default to 'Month' view
  const [timeFilter, setTimeFilter] = useState('Month');
  const [eventFilter, setEventFilter] = useState('Divine Service');

  // New State for the list of events from DB
  const [allStats, setAllStats] = useState({});
  const [eventsList, setEventsList] = useState([]);

  const [genderData, setGenderData] = useState([
    { name: 'Male', value: 0 }, 
    { name: 'Female', value: 0 }
  ]);
  const GENDER_COLORS = ['#6366f1', '#f43f5e']; 

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Fetch Events List AND All Stats in parallel
        const [eventsRes, statsRes, genderRes] = await Promise.all([
          getEvents(),
          getAttendanceStats(),
          getMemberGenderStats()
        ]);

        // A. Handle Events List
        if (eventsRes?.events && Array.isArray(eventsRes.events)) {
          setEventsList(eventsRes.events);
          if (eventsRes.events.length > 0) {
            setEventFilter(eventsRes.events[0]);
          }
        }

        // B. Handle Master Stats Object
        if (statsRes?.status === 'success' && statsRes.data) {
          setAllStats(statsRes.data);
        }

        // C. Handle Gender Stats
        if (genderRes?.status === 'success' && genderRes.genderData) {
          // Merge the colors into the data objects
          const coloredData = genderRes.genderData.map((item, index) => ({
              ...item,
              fill: GENDER_COLORS[index % GENDER_COLORS.length] // Add 'fill' directly to data
          }));
          
          setGenderData(coloredData);
        }

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []); // Empty dependency array = Runs once on mount

  // --- 3. SELECT DATA FOR CHART ---
  // Simply pick the correct array based on the Time Dropdown
  const currentChartData = useMemo(() => {
    // If we don't have an event selected or data loaded, return empty
    if (!eventFilter || !allStats[eventFilter]) return [];

    const eventData = allStats[eventFilter];

    switch (timeFilter) {
      case 'Week': return eventData.weekly;
      case 'Year': return eventData.yearly;
      case 'Month': 
      default: return eventData.monthly;
    }
  }, [timeFilter, eventFilter, allStats]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Logic to switch data based on dropdown
  const getChartData = () => {
    switch (timeFilter) {
      case 'Week': return weeklyData;
      case 'Year': return yearlyData;
      case 'Month': 
      default: return monthlyData;
    }
  };

  // --- OTHER STATIC DATA ---
  // const genderData = [ { name: 'Male', value: 45 }, { name: 'Female', value: 55 } ];
  

  const nationalityData = [
    { name: 'American', value: 30 }, { name: 'British', value: 20 },
    { name: 'Canadian', value: 15 }, { name: 'Nigerian', value: 10 }, { name: 'Other', value: 25 },
  ];
  const NATIONALITY_COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

  const ageData = [
    { range: '0-18', count: 20 }, { range: '19-30', count: 45 },
    { range: '31-50', count: 60 }, { range: '51-70', count: 35 }, { range: '70+', count: 15 },
  ];

  const roleData = [
    { role: 'Member', count: 150 }, { role: 'Visitor', count: 30 },
    { role: 'Leader', count: 15 }, { role: 'Volunteer', count: 25 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-100 p-3 shadow-lg rounded-lg text-xs">
          <p className="font-bold text-gray-800 mb-1">{label}</p>
          <p className="text-indigo-600 font-medium">
            {`${payload[0].name || 'Count'}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card 
      title="Churchlytics Dashboard"
      actionComponent={<SettingsMenu onLogout={handleLogout}/>}
      className="bg-gray-50" 
    >
      <div className="flex flex-col gap-6 p-1">

        {/* --- ROW 1: Attendance Trend --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col justify-between items-center mb-6">
            <div className='w-full text-left gap-3'>
                <h3 className="font-bold text-gray-800 text-lg">Attendance Trends</h3>
                <p className="text-gray-400 text-xs mt-1 gap-3">
                    {/* Dynamic Subtitle updated to show Event */}
                    {/* {eventFilter} attendance by {timeFilter.toLowerCase()} */}
                    {loading ? "Loading events..." : eventFilter} attendance by {timeFilter.toLowerCase()}
                </p>
            </div>
            

          {/* 2. Flex Container for BOTH Dropdowns */}
            <div className="flex gap-3 w-full justify-end">

                {/* --- NEW EVENT DROPDOWN --- */}
                <div className="relative">
                    <select 
                      className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-gray-100 transition-colors font-medium min-w-[140px]"
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                      disabled={loading}
                    >
                      {loading ? (
                        <option>Loading...</option>
                      ) : eventsList.length > 0 ? (
                        eventsList.map((event, index) => (
                          // FIX: Use 'index' as the unique key and 'event' (the string) directly
                          <option key={index} value={event}>
                            {event}
                          </option>
                        ))
                      ) : (
                        <option value="">No Events Found</option>
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>

                {/* --- EXISTING TIME DROPDOWN --- */}
                <div className="relative">
                    <select 
                      className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                    >
                      <option value="Week">Day</option>
                      <option value="Month">Month</option>
                      <option value="Year">Year</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>

            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentChartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 10}} 
                    dy={10}
                />
                <YAxis hide/>
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#4f46e5' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                  animationDuration={800} // Smooth transition when data changes
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- ROW 2: Demographics --- */}
        <div className="flex flex-col gap-6">
          {/* Gender */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="font-bold text-gray-800 mb-4 w-full text-left">Gender Distribution</h3>
            <div className="w-full h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%" 
                    outerRadius="70%" 
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
             <div className="flex gap-4 mt-2">
                {genderData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: GENDER_COLORS[index]}}></span>
                        {entry.name}
                    </div>
                ))}
             </div>
          </div>

          {/* Nationality */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
             <h3 className="font-bold text-gray-800 mb-4 w-full text-left">Nationality</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={nationalityData}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="70%"
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                     {nationalityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={NATIONALITY_COLORS[index % NATIONALITY_COLORS.length]} /> 
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
                {nationalityData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{backgroundColor: NATIONALITY_COLORS[index % NATIONALITY_COLORS.length]}}
                        ></span>
                        {entry.name}
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* --- ROW 3: Age Distribution --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6">Age Groups</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} barGap={0}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                    dataKey="range" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#6b7280', fontSize: 10}} 
                    dy={10} 
                />
                <YAxis hide />
                <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                <Bar 
                    dataKey="count" 
                    fill="#a5b4fc" 
                    radius={[4, 4, 0, 0]} 
                    barSize={50}
                    activeBar={{ fill: '#6366f1' }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- ROW 4: Role Count --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-6">Member Roles</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} layout="vertical"> 
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="role" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{fill: '#374151', fontSize: 13, fontWeight: 500}}
                    width={80}
                />
                <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip />} />
                <Bar 
                    dataKey="count" 
                    fill="#34d399" 
                    radius={[0, 4, 4, 0]} 
                    barSize={30} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </Card>
  );
};

export default Dashboard;