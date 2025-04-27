// 0. Secret key for signing JWTs
const JWT_SECRET = 'myultrasecretkey12345'; // (later we hide this better)

// 1. Import dependencies
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

// 2. Create an Express app
const app = express();
app.use(cors()); // 💥 Allow frontend (Vercel) to connect!
app.use(express.json()); // To automatically parse JSON bodies

// 3. Connect to SQLite database
const db = new sqlite3.Database('soc2.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// 4. Create users table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      phone TEXT,
      bio TEXT
    )
  `);
});

// 5. Register Route
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (user) return res.status(400).json({ error: 'User already exists' });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err) => {
        if (err) return res.status(500).json({ error: 'Registration failed' });
        res.status(201).json({ message: 'User registered successfully' });
      });
    } catch (error) {
      res.status(500).json({ error: 'Registration error' });
    }
  });
});

// 6. Login Route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  });
});

// 7. Protected Profile Route
app.get('/api/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    db.get('SELECT email, phone, bio FROM users WHERE email = ?', [decoded.email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({ user });
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 8. Update Profile Route
app.put('/api/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { phone, bio } = req.body;

    db.run('UPDATE users SET phone = ?, bio = ? WHERE email = ?', [phone, bio, decoded.email], function (err) {
      if (err) return res.status(500).json({ error: 'Update failed' });
      res.json({ message: 'Profile updated successfully' });
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 9. Reset Password Route
app.put('/api/reset-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { oldPassword, newPassword } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [decoded.email], async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Old password incorrect' });

      const newHashedPassword = await bcrypt.hash(newPassword, 10);

      db.run('UPDATE users SET password = ? WHERE email = ?', [newHashedPassword, decoded.email], function (err) {
        if (err) return res.status(500).json({ error: 'Password reset failed' });
        res.json({ message: 'Password reset successfully' });
      });
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 10. Logout Route
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logout successful. Please delete your token client-side.' });
});

// 11. Health Check Route
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is healthy!', uptime: process.uptime() });
});

// 12. Catch-All for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 13. Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
