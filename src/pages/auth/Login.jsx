import React from 'react';
import Card from '../../components/ui/Card';

const Login = () => {
    return (
        <Card title="Welcome" subTitle="Sign into your ChMS">
            <div className='flex flex-col gap-4'>
                {/* We will replace these with real Input components later */}
                <input
                    type='email'
                    placeholder='pastor@church.com'
                    className='w-full p-3 border rounded-lg'
                />

                <input
                    type='password'
                    placeholder='password'
                    className='w-full p-3 border rounded-lg'
                />

                <button className='bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700'>
                    Sign In
                </button>
            </div>
        </Card> 
    );
};

export default Login;