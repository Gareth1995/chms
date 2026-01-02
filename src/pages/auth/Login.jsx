import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { loginUser } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext'

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth(); // getting login function from context

    const [loading, setLoading] = useState(false);
    // Setting state for all fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleLogin = async (e) => {
        // console.log('login clicked...');
        e.preventDefault;
        setLoading(true);

        // Call login api
        const result = await loginUser(email, password);

        if (result.status === 'success') {
            // save user to global context
            login(result.user);

            // go to app
            navigate('/dashboard');
        } else {
            alert("Login Failed: " + result.message);
        }

        setLoading(false);
    };

    return (
        <Card title="Welcome" subTitle="Sign into your ChMS">
            <form onSubmit={handleLogin} className='flex flex-col gap-4'>
                <input
                    type='email'
                    placeholder='pastor@church.com'
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full p-3 border rounded-lg'
                    required
                />

                <input
                    type='password'
                    placeholder='password'
                    onChange={(e) => setPassword(e.target.value)}
                    className='w-full p-3 border rounded-lg'
                    required
                />

                <button type="submit" className='bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700'>
                    {loading ? "Signing In..." : "Sign In"}
                </button>

                <div className="text-center mt-4 text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-blue-600 hover:underline">
                        Sign up
                    </Link>
                </div>
            </form>
        </Card> 
    );
};

export default Login;