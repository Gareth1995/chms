import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { addMember } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AddMember = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    gender: 'Male', // Default
    role: 'Member', // Default
    email: '',
    cell: '',
    dob: '',
    church_id: user.church_id
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await addMember(formData);

    setLoading(false);

    if (result.status === 'success') {
      alert("Member added successfully!");
      // Option A: Clear form to add another
      setFormData({
        firstName: '', lastName: '', nationality: '', gender: 'Male', 
        role: 'Member', email: '', cell: '', dob: ''
      });
      // Option B: Go back to dashboard (Uncomment next line if preferred)
      // navigate('/dashboard');
    } else {
      alert("Error: " + result.message);
    }
  };

  return (
    <Card 
      title="Add New Member" 
      subTitle="Enter member details below"
      backAction={() => navigate('/dashboard')} // Arrow goes straight to dashboard
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
            <input 
              name="firstName" required value={formData.firstName} onChange={handleChange}
              className="w-full p-3 border rounded-lg mt-1" placeholder="John"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
            <input 
              name="lastName" value={formData.lastName} onChange={handleChange}
              className="w-full p-3 border rounded-lg mt-1" placeholder="Doe"
            />
          </div>
        </div>

        {/* Nationality & Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Nationality</label>
            <input 
              name="nationality" value={formData.nationality} onChange={handleChange}
              className="w-full p-3 border rounded-lg mt-1" placeholder="e.g. South African"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
            <select 
              name="gender" value={formData.gender} onChange={handleChange}
              className="w-full p-3 border rounded-lg mt-1 bg-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {/* Role Dropdown */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Church Role</label>
          <select 
            name="role" value={formData.role} onChange={handleChange}
            className="w-full p-3 border rounded-lg mt-1 bg-white"
          >
            <option value="Member">Member</option>
            <option value="Visitor">Visitor</option>
            <option value="Deacon">Deacon</option>
            <option value="Treasurer">Treasurer</option>
            <option value="Sabbath School Sup">Sabbath School Sup</option>
            <option value="Elder">Elder</option>
            <option value="Church Clerk">Church Clerk</option>
            <option value="Youth Leader">Youth Leader</option>
            <option value="Children's Ministries Leader">Children's Ministries Leader</option>
          </select>
        </div>

        {/* Contact Info */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
          <input 
            name="email" type="email" value={formData.email} onChange={handleChange}
            className="w-full p-3 border rounded-lg mt-1" placeholder="member@example.com"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Cell Number</label>
          <input 
            name="cell" type="tel" value={formData.cell} onChange={handleChange}
            className="w-full p-3 border rounded-lg mt-1" placeholder="082 123 4567"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</label>
          <input 
            name="dob" type="date" value={formData.dob} onChange={handleChange}
            // className="w-full p-3 border rounded-lg mt-1"
            className="w-full max-w-full block box-border p-3 border rounded-lg mt-1 appearance-none bg-white"
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all active:scale-95 mt-2"
        >
          {loading ? "Saving..." : "Add Member"}
        </button>

      </form>
    </Card>
  );
};

export default AddMember;