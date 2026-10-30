// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer'); 
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
  phone: { type: String, required: true, unique: true },
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

// --- NodeMailer Email OTP System Setup ---
const otpStore = {}; // Temporary memory store for OTPs

// Configure NodeMailer with your Gmail (Using Port 587 STARTTLS)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Must be false for port 587. It automatically upgrades to TLS.
  requireTLS: true,
  auth: {
    user: 'deepeshkumart7@gmail.com', 
    pass: 'ydoecucvbgxcwyqy' 
  }
});

// --- Auth Routes ---

// 1. Send OTP for Registration
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp; 
  
  try {
    await transporter.sendMail({
      from: 'Karuppanan Finance <deepeshkumart7@gmail.com>',
      to: email,
      subject: 'Your Registration OTP',
      html: `<h2>Welcome to Karuppanan Finance</h2><p>Your email verification OTP is: <b style="font-size: 24px;">${otp}</b></p>`
    });
    res.json({ message: 'OTP sent to email successfully' });
  } catch (error) {
    console.error("NODEMAILER ERROR:", error);
    res.status(500).json({ error: 'Failed to send email OTP' });
  }
});

// 2. Verify OTP & Register User
app.post('/api/auth/register', async (req, res) => {
  const { email, phone, password, otp } = req.body;
  
  if (otpStore[email] && otpStore[email] === otp) {
    try {
      const user = new User({ email, phone, password });
      await user.save();
      delete otpStore[email]; // Clear OTP
      res.json({ uid: user._id, email: user.email, phone: user.phone });
    } catch (err) {
      res.status(400).json({ error: 'Email or Phone number already exists.' });
    }
  } else {
    res.status(400).json({ error: 'Invalid or expired OTP.' });
  }
});

// 3. Login with Email OR Phone
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or phone
  
  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
    password: password
  });

  if (user) {
    res.json({ uid: user._id, email: user.email, phone: user.phone });
  } else {
    res.status(401).json({ error: 'Invalid email/phone or password.' });
  }
});

// 4. Password Reset Route
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

// --- Client Routes ---
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));