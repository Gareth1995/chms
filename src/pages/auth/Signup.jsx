import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'
import { registerUser, loginUser, getChurchNames } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext'


const Signup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);

    const [churchList, setChurchList] = useState([]);
    const [loadingChurches, setLoadingChurches] = useState(true); // For dropdown fetching

    // Setting state for all fields
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nationality: '',
        role:'',
        cell: '',
        email: '',
        password: ''
    });

    // 4. Fetch churches immediately when the component loads
    useEffect(() => {
        const loadChurches = async () => {
            setLoadingChurches(true); // Start loading
            try {
                const result = await getChurchNames();
                if (result.status === 'success') {
                    setChurchList(result.churches);
                } else {
                    console.error("Failed to load churches:", result.message);
                }
            } catch (error) {
                console.error("Error loading churches:", error);
            } finally {
                setLoadingChurches(false); // Stop loading regardless of success/fail
            }
        };
        loadChurches();
    }, []);

    const handleChange = (e) => {
        // console.log({[e.target.name] : e.value});
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Call our API
        const result = await registerUser(formData);

        if (result.status === 'success') {
            
            // Call login api
            const login_result = await loginUser(formData.email, formData.password);

            if (login_result.status === 'success') {
                // save user to global context
                login(login_result.user);

                // go to app
                navigate('/dashboard');
            } else {
                alert("Login Failed: " + login_result.message);
            }
        } else {
            alert("Error: " + result.message);
        }

        setLoading(false);
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

                <div className="relative">
                    <select
                        name="church_id"
                        value={formData.church_id}
                        onChange={handleChange}
                        required
                        // LOGIC: If no church selected -> text-gray-400 (Grey). If selected -> text-black (Black).
                        className={`p-3 border rounded-lg w-full appearance-none bg-white ${!formData.church_id ? 'text-gray-400' : 'text-black'}`}
                    >
                        {/* Dynamic Default Option */}
                        <option value="" className="text-gray-400">
                            {loadingChurches ? "Loading churches..." : "Select your Church"}
                        </option>

                        {/* Map options (Text is always black for options) */}
                        {churchList.map((church) => (
                            <option key={church.id} value={church.id} className="text-black">
                                {church.name}
                            </option>
                        ))}
                    </select>

                    {/* Spinner vs Arrow Logic */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        {loadingChurches ? (
                            // Simple Loading Spinner SVG
                            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            // Standard Down Arrow SVG
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        )}
                    </div>
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
                    {loading ? 'Creating Account and Signing In...' : 'Sign Up'}
                </button>

            </form>

        </Card>
    );
};

export default Signup;