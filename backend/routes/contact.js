const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const Message = require('../models/Message');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// POST - Submit contact form
router.post('/', async (req, res) => {
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
    // 1. Save message to MongoDB
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    console.log(`📝 Message saved from ${name} (${email})`);

    // 2. Send email notification to YOU
    const notificationMsg = {
      to: process.env.NOTIFY_EMAIL,
      from: process.env.FROM_EMAIL,
      subject: `📬 New Portfolio Message from ${name}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e0e0e0; border-radius: 15px; background: linear-gradient(135deg, #ffffff, #f9fefc);">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="background: linear-gradient(135deg, #2e8a7a, #3ba592); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
              <span style="font-size: 30px;">📬</span>
            </div>
          </div>
          <h2 style="color: #2e8a7a; text-align: center; margin-bottom: 20px;">New Portfolio Message</h2>
          <div style="background: #f5fefb; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 8px 0;"><strong style="color: #2e8a7a;">👤 Name:</strong> ${name}</p>
            <p style="margin: 8px 0;"><strong style="color: #2e8a7a;">📧 Email:</strong> ${email}</p>
            <p style="margin: 8px 0;"><strong style="color: #2e8a7a;">💬 Message:</strong></p>
            <p style="background: white; padding: 12px; border-radius: 10px; margin-top: 8px; border-left: 4px solid #3ba592;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="text-align: center; font-size: 12px; color: #8aa89e;">Sent from your portfolio website • ${new Date().toLocaleString()}</p>
        </div>
      `
    };

    await sgMail.send(notificationMsg);
    console.log(`📧 Email notification sent to ${process.env.NOTIFY_EMAIL}`);

    // 3. Send auto-reply to user
    const autoReplyMsg = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: "Thank you for reaching out!",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 15px;">
          <div style="text-align: center;">
            <div style="background: linear-gradient(135deg, #2e8a7a, #3ba592); width: 70px; height: 70px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 35px;">✨</span>
            </div>
          </div>
          <h2 style="color: #2e8a7a; text-align: center;">Hello ${name},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #4a6a62;">Thank you for reaching out to me through my portfolio. I've received your message and will get back to you within <strong>24-48 hours</strong>.</p>
          <div style="background: #f5fefb; padding: 15px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #7aa89c;"><strong>Your message:</strong></p>
            <p style="margin: 10px 0 0 0; color: #4a6a62; font-style: italic;">"${message.substring(0, 150)}${message.length > 150 ? '...' : ''}"</p>
          </div>
          <p style="text-align: center; margin-top: 25px; font-size: 14px; color: #8aa89e;">Best regards,<br><strong style="color: #2e8a7a;">Venturi Anu Sri Lakshmi</strong><br>Full Stack Developer</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 11px; text-align: center; color: #b8ddd2;">This is an automated response. Please do not reply directly to this email.</p>
        </div>
      `
    };

    await sgMail.send(autoReplyMsg);
    console.log(`📧 Auto-reply sent to ${email}`);

    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully! I will get back to you soon.' 
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message. Please try again later.' 
    });
  }
});

// GET - Fetch all messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;