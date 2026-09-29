const nodemailer = require('nodemailer');

/**
 * Checks whether valid Gmail credentials are provided in .env
 */
const isEmailConfigured = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return false;
  if (user === 'your_gmail@gmail.com' || pass === 'your_gmail_app_password') return false;
  if (!user.includes('@')) return false;
  return true;
};

/**
 * Create a Nodemailer transporter instance
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send OTP verification email directly to client inbox.
 * Returns { success: boolean, message: string }
 */
const sendOTPEmail = async (toEmail, toName, otp) => {
  if (!isEmailConfigured()) {
    console.error(`❌ [Email Service] EMAIL_USER or EMAIL_PASS not configured in .env.`);
    return {
      success: false,
      configured: false,
      message: 'Email service credentials not configured.',
    };
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin:0; padding:0; background:#0d0618; font-family: Georgia, 'Times New Roman', serif; color:#ffffff; }
      .wrapper { max-width:540px; margin:40px auto; background:linear-gradient(145deg,#1e0f40,#130a2a); border:1px solid rgba(212,168,83,0.3); border-radius:16px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.6); }
      .header { background:linear-gradient(135deg,#2a1060,#1a0844); padding:36px 30px; text-align:center; border-bottom:1px solid rgba(212,168,83,0.25); }
      .logo { font-size:2.4rem; color:#d4a853; line-height:1; }
      .brand { color:#d4a853; font-size:1.1rem; letter-spacing:0.25em; text-transform:uppercase; margin-top:10px; font-weight:600; }
      .body { padding:36px 32px; }
      h1 { color:#f0cc7a; font-size:1.45rem; margin:0 0 14px; font-weight:normal; }
      p { color:rgba(255,255,255,0.85); line-height:1.75; font-size:0.95rem; margin:0 0 16px; }
      .otp-box { background:rgba(212,168,83,0.08); border:2px dashed rgba(212,168,83,0.45); border-radius:12px; text-align:center; padding:22px; margin:26px 0; }
      .otp-code { font-size:3rem; font-weight:900; letter-spacing:0.35em; color:#f0cc7a; font-family:Consolas, Monaco, monospace; text-shadow:0 0 15px rgba(212,168,83,0.5); }
      .otp-note { font-size:0.8rem; color:rgba(255,255,255,0.6); margin-top:10px; }
      .footer { background:rgba(0,0,0,0.35); padding:18px 32px; text-align:center; font-size:0.75rem; color:rgba(255,255,255,0.4); border-top:1px solid rgba(212,168,83,0.1); }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <div class="logo">✦</div>
        <div class="brand">Ek Raaz Ki Baat Batau?</div>
      </div>
      <div class="body">
        <h1>Verify Your Cosmic Portal Account</h1>
        <p>Greetings, <strong style="color:#f0cc7a">${toName}</strong>!</p>
        <p>You have registered for an account at <em>Ek Raaz Ki Baat Batau?</em>. Enter this 6-digit verification code to activate your account and access your sacred tarot readings:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="otp-note">Valid for 15 minutes · Do not share this code</div>
        </div>
        <p>If you did not initiate this request, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Ek Raaz Ki Baat Batau? · Sent to ${toEmail}
      </div>
    </div>
  </body>
  </html>`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Ek Raaz Ki Baat Batau? ✦" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${otp} — Your Tarot Account Verification Code`,
      html,
    });
    console.log(`✅ [Email Service] OTP successfully delivered to: ${toEmail}`);
    return { success: true, configured: true, message: 'OTP sent to email.' };
  } catch (error) {
    console.error(`❌ [Email Service] Failed to send email to ${toEmail}:`, error.message);
    return {
      success: false,
      configured: true,
      message: error.message,
    };
  }
};

/**
 * Send a welcome email after account activation
 */
const sendWelcomeEmail = async (toEmail, toName) => {
  if (!isEmailConfigured()) return;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Ek Raaz Ki Baat Batau? ✦" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Welcome to the Cosmos ✦ Account Activated',
      html: `
      <div style="max-width:520px;margin:40px auto;background:linear-gradient(145deg,#1e0f40,#130a2a);border:1px solid rgba(212,168,83,0.3);border-radius:16px;padding:40px;font-family:Georgia,serif;color:#fff;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:12px;color:#d4a853;">✦</div>
        <h1 style="color:#f0cc7a;font-size:1.4rem;">Welcome, ${toName}!</h1>
        <p style="color:rgba(255,255,255,0.85);line-height:1.7;">Your email has been verified. The cosmos welcomes you into sacred communion.<br/>Book your first tarot reading anytime.</p>
      </div>`,
    });
  } catch (err) {
    console.error(`⚠️ [Email Service] Welcome email could not be sent:`, err.message);
  }
};

module.exports = { isEmailConfigured, sendOTPEmail, sendWelcomeEmail };
