import React, { createContext, useState, usecContext, useEffect, useContext } from 'react';

const AuthContext = createContext(null);


// This houses globally recognised functions and variables
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // check if user was logged in before (saved in browser memory)
    useEffect(() => {
        const storedUser = localStorage.getItem('chms_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('chms_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('chms_user');
    };

    return (
        <AuthContext.Provider value={{user, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);