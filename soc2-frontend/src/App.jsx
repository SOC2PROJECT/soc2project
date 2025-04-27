// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 🛰️ Connects to the live Render backend
const BACKEND_URL = "https://soc2-backend.onrender.com"; // (Replace with your exact backend URL if different)

function App() {
  const [view, setView] = useState('home'); // 'home', 'register', 'login', 'profile'
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    }
  }, []);

  const fetchProfile = async (authToken) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setProfile(res.data.user); // 👈 small correction
      setView('profile');
    } catch (error) {
      console.error(error);
      setView('home');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setProfile(null);
    setView('home');
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to SOC2 Project 🚀</h1>

      {view === 'home' && (
        <>
          <button onClick={() => setView('register')} style={buttonStyle}>Register</button>
          <button onClick={() => setView('login')} style={buttonStyle}>Login</button>
        </>
      )}

      {view === 'register' && <RegisterForm onBack={() => setView('home')} />}
      {view === 'login' && <LoginForm onBack={() => setView('home')} onLoginSuccess={(jwtToken) => {
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);
        fetchProfile(jwtToken);
      }} />}
      {view === 'profile' && profile && <Profile profile={profile} onLogout={handleLogout} />}
    </div>
  );
}

// Styling for buttons
const buttonStyle = { padding: '10px 20px', margin: '10px', cursor: 'pointer' };

// --- REGISTER FORM
function RegisterForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/api/register`, { email, password });
      setMessage('✅ Registered successfully! Please login.');
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Registration failed.'));
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required style={inputStyle} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={inputStyle} />
        <button type="submit" style={buttonStyle}>Register</button>
      </form>
      <p>{message}</p>
      <button onClick={onBack} style={buttonStyle}>⬅️ Back</button>
    </div>
  );
}

// --- LOGIN FORM
function LoginForm({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BACKEND_URL}/api/login`, { email, password });
      setMessage('✅ Login successful!');
      onLoginSuccess(res.data.token);
    } catch (error) {
      setMessage('❌ ' + (error.response?.data?.error || 'Login failed.'));
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required style={inputStyle} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={inputStyle} />
        <button type="submit" style={buttonStyle}>Login</button>
      </form>
      <p>{message}</p>
      <button onClick={onBack} style={buttonStyle}>⬅️ Back</button>
    </div>
  );
}

// --- PROFILE VIEW
function Profile({ profile, onLogout }) {
  return (
    <div>
      <h2>Profile Page</h2>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
      <p><strong>Bio:</strong> {profile.bio || 'No bio yet'}</p>
      <button onClick={onLogout} style={buttonStyle}>Logout</button>
    </div>
  );
}

// Styling for inputs
const inputStyle = { display: 'block', margin: '10px auto', padding: '10px', width: '250px' };

export default App;
