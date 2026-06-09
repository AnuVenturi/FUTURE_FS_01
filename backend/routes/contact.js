const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Message = require('../models/Message'); // Make sure this matches your file name

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// POST - Submit contact form
router.post('/', async (req, res) => {
  console.log('✅ Contact endpoint hit!', req.body); // DEBUG LOG
  
  const { name, email, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'All fields are required' 
    });
  }

  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide a valid email address' 
    });
  }

  if (message.length < 10) {
    return res.status(400).json({ 
      success: false, 
      error: 'Message must be at least 10 characters long' 
    });
  }

  try {
    // 1. Save message to MongoDB Atlas
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    console.log(`📝 Message saved from ${name} (${email})`);

    // 2. Send Email Notification to YOU
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL,
      subject: `📬 New Portfolio Message from ${name}`,
      html: `...` // Your HTML template here
    });
    console.log(`📧 Email notification sent to ${process.env.NOTIFY_EMAIL}`);

    // 3. Send Auto-reply
    await transporter.sendMail({
      from: `"Venturi Anu Sri Lakshmi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank you for reaching out!",
      html: `...` // Your auto-reply HTML here
    });
    console.log(`📧 Auto-reply sent to ${email}`);

    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully! I will get back to you soon.' 
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message. Please try again later.' 
    });
  }
});

// GET - Fetch all messages (admin only)
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;