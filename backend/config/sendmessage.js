const nodemailer = require('nodemailer');
require('dotenv').config();

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Constants for consistent branding
const COMPANY_NAME = 'Forever Trends';
const LOGO_URL = 'https://via.placeholder.com/150?text=Forever+Trends'; // Replace with your actual logo URL
const WEBSITE_URL = 'https://forevertrends.com';
const HEADER = `
  <div style="text-align: center; padding: 20px; background-color: #f8f8f8;">
    <img src="${LOGO_URL}" alt="${COMPANY_NAME} Logo" style="width: 150px; height: auto;" />
    <h1 style="font-size: 24px; color: #333;">${COMPANY_NAME}</h1>
  </div>
`;
const FOOTER = `
  <div style="text-align: center; padding: 20px; background-color: #f8f8f8; font-size: 12px; color: #666;">
    <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
    <p>
      <a href="${WEBSITE_URL}/contact" style="color: #007bff; text-decoration: none;">Contact Us</a> | 
      <a href="${WEBSITE_URL}/unsubscribe" style="color: #007bff; text-decoration: none;">Unsubscribe</a>
    </p>
    <p>123 Fashion St, Style City, SC 12345</p>
  </div>
`;

// Email Templates
const send2StepVerificationEmail = async (to, code) => {
  const subject = 'Your 2-Step Verification Code';
  const html = `
    ${HEADER}
    <div style="padding: 20px; font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #007bff;">Verify Your Account</h2>
      <p>Your 2-Step Verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; color: #333;">${code}</p>
      <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
      <p>If you did not request this code, please contact our <a href="${WEBSITE_URL}/support" style="color: #007bff; text-decoration: none;">support team</a>.</p>
    </div>
    ${FOOTER}
  `;

  try {
    await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`2-Step Verification email sent to ${to}`);
  } catch (error) {
    console.error('Error sending 2-Step Verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

const sendOrderUpdateEmail = async (to, orderId, status) => {
  const subject = `Order #${orderId} Update: ${status}`;
  const html = `
    ${HEADER}
    <div style="padding: 20px; font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #007bff;">Order Update</h2>
      <p>Your order #${orderId} is now <strong>${status}</strong>.</p>
      <p>Track your order details or manage your purchase:</p>
      <a href="${WEBSITE_URL}/orders/${orderId}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Track Order</a>
      <p>Thank you for shopping with us!</p>
    </div>
    ${FOOTER}
  `;

  try {
    await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Order Update email sent to ${to} for order ${orderId}`);
  } catch (error) {
    console.error('Error sending Order Update email:', error);
    throw new Error('Failed to send order update email');
  }
};

const sendOrderBookingEmail = async (to, orderId, amount) => {
  const subject = `Order #${orderId} Confirmation`;
  const html = `
    ${HEADER}
    <div style="padding: 20px; font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #007bff;">Thank You for Your Order!</h2>
      <p>Your order #${orderId} has been successfully placed.</p>
      <p><strong>Total Amount:</strong> $${amount.toFixed(2)}</p>
      <p>We’ll notify you when your order ships. In the meantime, you can:</p>
      <a href="${WEBSITE_URL}/orders/${orderId}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">View Order</a>
      <p>Explore more on our website:</p>
      <a href="${WEBSITE_URL}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">Shop Now</a>
    </div>
    ${FOOTER}
  `;

  try {
    await transporter.sendMail({
      from: `"${COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Order Booking email sent to ${to} for order ${orderId}`);
  } catch (error) {
    console.error('Error sending Order Booking email:', error);
    throw new Error('Failed to send order booking email');
  }
};

module.exports = {
  send2StepVerificationEmail,
  sendOrderUpdateEmail,
  sendOrderBookingEmail,
};