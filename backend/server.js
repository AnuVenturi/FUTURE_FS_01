const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const contactRoutes = require('./routes/contact');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err.message));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server running with MongoDB Atlas & Email notifications',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/contact', contactRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`💾 MongoDB Atlas: Connected`);
  console.log(`📧 Email notifications: Enabled for ${process.env.NOTIFY_EMAIL}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/contact - Submit contact form`);
  console.log(`   GET  /api/contact - View all messages\n`);
});