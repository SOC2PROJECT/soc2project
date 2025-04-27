import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [view, setView] = useState('home'); // 'home', 'register', 'login', 'profile', 'update', 'reset'
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile(savedToken);
    }
  }, []);

  const fetchProfile = async (authToken) => {
    try {
      const res = await axios.get('http://localhost:3000/api/profile', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setProfile(res.data.user);
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
          <button onClick={() => setView('register')} style={btnStyle}>Register</button>
          <button onClick={() => setView('login')} style={btnStyle}>Login</button>
        </>
      )}

      {view === 'register' && <RegisterForm onBack={() => setView('home')} />}
      {view === 'login' && <LoginForm onBack={() => setView('home')} onLoginSuccess={(jwtToken) => {
        localStorage.setItem('token', jwtToken);
        setToken(jwtToken);
        fetchProfile(jwtToken);
      }} />}
      {view === 'profile' && profile && (
        <Profile profile={profile} onLogout={handleLogout} onUpdate={() => setView('update')} onResetPassword={() => setView('reset')} />
      )}
      {view === 'update' && <UpdateProfile token={token} onBack={() => fetchProfile(token)} />}
      {view === 'reset' && <ResetPassword token={token} onBack={() => fetchProfile(token)} />}
    </div>
  );
}

const btnStyle = { padding: '10px 20px', margin: '10px' };

// -- Register
function RegisterForm({ onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/register', { email, password });
      setMsg('✅ Registered successfully! Now login.');
    } catch (error) {
      setMsg('❌ ' + error.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={inputStyle} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={inputStyle} />
        <button type="submit" style={btnStyle}>Register</button>
      </form>
      <p>{msg}</p>
      <button onClick={onBack} style={{ marginTop: '20px' }}>⬅️ Back</button>
    </div>
  );
}

// -- Login
function LoginForm({ onBack, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/login', { email, password });
      setMsg('✅ Login successful!');
      onLoginSuccess(res.data.token);
    } catch (error) {
      setMsg('❌ ' + error.response?.data?.error || 'Login failed.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={inputStyle} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required style={inputStyle} />
        <button type="submit" style={btnStyle}>Login</button>
      </form>
      <p>{msg}</p>
      <button onClick={onBack} style={{ marginTop: '20px' }}>⬅️ Back</button>
    </div>
  );
}

// -- Profile
function Profile({ profile, onLogout, onUpdate, onResetPassword }) {
  return (
    <div>
      <h2>Profile</h2>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
      <p><strong>Bio:</strong> {profile.bio || 'Not set'}</p>
      <button onClick={onUpdate} style={btnStyle}>Update Profile</button>
      <button onClick={onResetPassword} style={btnStyle}>Reset Password</button>
      <button onClick={onLogout} style={{ ...btnStyle, backgroundColor: 'red', color: 'white' }}>Logout</button>
    </div>
  );
}

// -- Update Profile
function UpdateProfile({ token, onBack }) {
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:3000/api/profile', { phone, bio }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('✅ Profile updated!');
    } catch (error) {
      setMsg('❌ Failed to update.');
    }
  };

  return (
    <div>
      <h2>Update Profile</h2>
      <form onSubmit={handleUpdate}>
        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
        <input type="text" value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio" style={inputStyle} />
        <button type="submit" style={btnStyle}>Update</button>
      </form>
      <p>{msg}</p>
      <button onClick={onBack} style={{ marginTop: '20px' }}>⬅️ Back</button>
    </div>
  );
}

// -- Reset Password
function ResetPassword({ token, onBack }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:3000/api/reset-password', { oldPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('✅ Password reset successful!');
    } catch (error) {
      setMsg('❌ ' + error.response?.data?.error || 'Failed to reset.');
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <form onSubmit={handleReset}>
        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Old Password" required style={inputStyle} />
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" required style={inputStyle} />
        <button type="submit" style={btnStyle}>Reset</button>
      </form>
      <p>{msg}</p>
      <button onClick={onBack} style={{ marginTop: '20px' }}>⬅️ Back</button>
    </div>
  );
}

const inputStyle = { display: 'block', margin: '10px auto', padding: '10px', width: '80%' };

export default App;
