import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../utils/api';
import { connectSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        const fetchUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(apiUrl('/api/auth/me'), {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                    connectSocket();
                } else {
                    logout();
                }
            } catch (err) {
                console.error('Failed to fetch user', err);
                logout();
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [token]);

    const login = async (email, password) => {
        const res = await fetch(apiUrl('/api/auth/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data);
            connectSocket();
            return { success: true };
        } else {
            return { success: false, message: data.message || 'Login failed' };
        }
    };

    const signup = async (name, email, password) => {
        const res = await fetch(apiUrl('/api/auth/signup'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setUser(data);
            connectSocket();
            return { success: true };
        } else {
            return { success: false, message: data.message || 'Signup failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        disconnectSocket();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, token }}>
            {children}
        </AuthContext.Provider>
    );
};
