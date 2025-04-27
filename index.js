// 0. Secret key for signing JWTs
const JWT_SECRET = 'myultrasecretkey12345'; // (later we hide this better)

// 1. Import dependencies
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

// 2. Create an Express app
const app = express();
app.use(express.json()); // To automatically parse JSON bodies

// 3. Connect to SQLite database
const db = new Database('soc2.db');

// 4. Create users table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    phone TEXT,
    bio TEXT
  )
`).run();

// 5. Register Route
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  const userExists = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (userExists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashedPassword);

  res.json({ message: 'User registered successfully' });
});

// 6. Login Route (with JWT token)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (isMatch) {
    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// 7. Protected Profile Route
app.get('/api/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT email, phone, bio FROM users WHERE email = ?').get(decoded.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
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

    db.prepare('UPDATE users SET phone = ?, bio = ? WHERE email = ?')
      .run(phone, bio, decoded.email);

    res.json({ message: 'Profile updated successfully' });
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

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(decoded.email);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Old password incorrect' });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE email = ?')
      .run(newHashedPassword, decoded.email);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 10. Logout Route (handled client-side)
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logout successful. Please delete your token client-side.' });
});

// 11. Health Check Route
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is healthy!', uptime: process.uptime() });
});

// 12. Start server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
