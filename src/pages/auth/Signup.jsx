import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    return (
        <Card
            title='Create Account'
            subTitle='Start your church analytics journey!'
            backAction={() => navigate('/login')}>
            <form className='flex flex-col gap-3'>

                <div className='grid grid-cols-2 gap-3'>
                    <input
                        name='firstName' placeholder='First Name' className='p-3 border rounded-lg w-full'>
                    </input>

                    <input
                        name='lastName' placeholder='Last Name' className='p-3 border rounded-lg w-full'>
                    </input>
                </div>

                <input
                    name='nationality' placeholder='Nationality' className='p-3 border rounded-lg w-full'>
                </input>

                <input
                    name='cell' placeholder='Cell Number' className='p-3 border rounded-lg w-full'>
                </input>

                <input
                    name='email' placeholder='Email' className='p-3 border rounded-lg w-full'>
                </input>

                <input
                    name='password' placeholder='Password' className='p-3 border rounded-lg w-full'>
                </input>

                <button className='bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700'>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>

            </form>

        </Card>
    );
};

export default Signup;