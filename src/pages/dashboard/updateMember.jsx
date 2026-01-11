import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { addMemberUpdates } from '../../services/api';

const UpdateMember = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const selectedMembers = state?.selectedMembers || [];
    console.log(selectedMembers);

    const formatDateForInput = (dob) => {
        if (!dob) return "";

        const date = new Date(dob);
        return date.toISOString().split("T")[0];
    };

    const [formData, setFormData] = useState({
        member_id: selectedMembers[0].id,
        firstName: selectedMembers[0].firstName,
        lastName: selectedMembers[0].lastName,
        nationality: selectedMembers[0].nationality,
        gender: selectedMembers[0].gender,
        role: selectedMembers[0].role,
        email: selectedMembers[0].email,
        cell: selectedMembers[0].cell,
        dob: formatDateForInput(selectedMembers[0].dob),
        age: selectedMembers[0].age,
        update_reason: "default"
    });
    
    console.log(formData);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await addMemberUpdates(formData);

        setLoading(false);

        if (result.status === 'success') {
            alert("Member added successfully!");
            // navigate back to members page
            navigate('/members')
        }
    };

    return (
        <Card 
        title="Update a Member" 
        subTitle="Enter member details to update below"
        backAction={() => navigate('/members')} // Arrow goes straight to dashboard
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
                name="lastName" required value={formData.lastName} onChange={handleChange}
                className="w-full p-3 border rounded-lg mt-1" placeholder="Doe"
                />
            </div>
            </div>

            {/* Nationality & Gender */}
            <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nationality</label>
                <input 
                name="nationality" required value={formData.nationality} onChange={handleChange}
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
                name="email" type="email" required value={formData.email} onChange={handleChange}
                className="w-full p-3 border rounded-lg mt-1" placeholder="member@example.com"
            />
            </div>

            <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Cell Number</label>
            <input 
                name="cell" type="tel" required value={formData.cell} onChange={handleChange}
                className="w-full p-3 border rounded-lg mt-1" placeholder="082 123 4567"
            />
            </div>

            {/* Date of Birth */}
            <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</label>
            <input 
                name="dob" type="date" required value={formData.dob} onChange={handleChange}
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
            {loading ? "Saving..." : "Update Member"}
            </button>

        </form>
        </Card>
    );
};

export default UpdateMember;