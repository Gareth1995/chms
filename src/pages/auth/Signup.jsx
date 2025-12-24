import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'

const Signup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        console.log({[e.target.name] : e.value});
    }

    const handleSignup = (e) => {
        e.preventDefault();
        console.log(e);
        // console.log('submit clicked');
    }

    return (
        <Card
            title='Create Account'
            subTitle='Start your church analytics journey!'
            backAction={() => navigate('/login')}>
            <form className='flex flex-col gap-3' onSubmit={handleSignup}>

                <div className='grid grid-cols-2 gap-3'>
                    <input
                        name='firstName' placeholder='First Name' className='p-3 border rounded-lg w-full' onChange={handleChange}>
                    </input>

                    <input
                        name='lastName' placeholder='Last Name' className='p-3 border rounded-lg w-full' onChange={handleChange}>
                    </input>
                </div>

                <input
                    name='nationality' placeholder='Nationality' className='p-3 border rounded-lg w-full' onChange={handleChange}>
                </input>

                <input
                    name='cell' placeholder='Cell Number' className='p-3 border rounded-lg w-full' onChange={handleChange}>
                </input>

                <input
                    name='email' placeholder='Email' className='p-3 border rounded-lg w-full' onChange={handleChange}>
                </input>

                <input
                    name='password' placeholder='Password' className='p-3 border rounded-lg w-full' onChange={handleChange}>
                </input>

                <button
                    className='bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700'
                    type='submit'
                    disabled={loading}
                >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>

            </form>

        </Card>
    );
};

export default Signup;