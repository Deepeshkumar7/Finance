// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer'); // MOVED TO TOP
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// --- Mongoose Models ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true } 
});
const User = mongoose.model('User', UserSchema);

const ClientSchema = new mongoose.Schema({
  userId: String,
  day: String,
  name: String,
  phone: String,
  village: String,
  principal: Number,
  interest: Number,
  totalPaid: { type: Number, default: 0 },
  paymentHistory: Array,
  createdAt: { type: Date, default: Date.now }
});
const Client = mongoose.model('Client', ClientSchema);

// --- API Routes ---

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ uid: user._id, email: user.email });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email, password: req.body.password });
  if (user) res.json({ uid: user._id, email: user.email });
  else res.status(401).json({ error: 'Invalid credentials' });
});

// Password Reset Route
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// Client Routes
app.get('/api/clients', async (req, res) => {
  const { userId, day } = req.query;
  const clients = await Client.find({ userId, day });
  res.json(clients);
});

app.post('/api/clients', async (req, res) => {
  const client = new Client(req.body);
  await client.save();
  res.json(client);
});

app.put('/api/clients/:id', async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(client);
});

app.delete('/api/clients/:id', async (req, res) => {
  await Client.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// --- NodeMailer Email OTP System ---

// Temporary memory store for OTPs (resets if server restarts)
const otpStore = {};

// Configure NodeMailer with your Gmail (Using Secure SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  auth: {
    user: 'deepeshkumart7@gmail.com', 
    pass: 'ydoecucvbgxcwyqy' 
  }
});

// Endpoint 1: Generate and Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp; 
  
  try {
    await transporter.sendMail({
      from: 'Karuppanan Finance <deepeshkumart7@gmail.com>',
      to: email,
      subject: 'Your Dashboard Login OTP',
      html: `<h2>Dashboard Access</h2><p>Your secure login OTP is: <b style="font-size: 24px;">${otp}</b></p><p>This code is valid for 10 minutes.</p>`
    });
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email OTP' });
  }
});

// Endpoint 2: Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  
  if (otpStore[email] && otpStore[email] === otp) {
    delete otpStore[email]; 
    res.json({ uid: email, email: email, role: 'admin' });
  } else {
    res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));