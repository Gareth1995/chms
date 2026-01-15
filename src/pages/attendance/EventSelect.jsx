import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import EventDropdown from '../../components/ui/eventDropdown';

const EventSelect = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    console.log("Change made");
  };

  return (
    <Card 
      title="Event Selection" 
      subTitle="Select an event to track attendance for"
      backAction={() => navigate('/dashboard')} // Arrow goes straight to dashboard
    >

        {/* Nationality & Gender */}
        <div className="grid grid-cols-2 gap-3">
            <div>
              {/* <EventDropdown title={"Gender"} initialOptions={["Conference", "Workshop", "Meetup"]}/> */}
              <EventDropdown/>
            </div>
        </div>

        {/* Event date */}
        <div className='pt-5 pb-10'>
          <label className="text-xs font-bold text-gray-500 uppercase">Event Date</label>
          <input 
            name="dob" type="date" required onChange={handleChange}
            // className="w-full p-3 border rounded-lg mt-1"
            className="w-full max-w-full block box-border p-3 border rounded-lg mt-1 appearance-none bg-white"
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95 mt-2"
        >
          Track Attendance
        </button>

    </Card>
  );
};

export default EventSelect;