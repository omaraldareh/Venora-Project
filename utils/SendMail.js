const nodemailer = require('nodemailer');
require('dotenv').config();

// التعديل هنا: تحديد المنفذ المشفر والـ Pool لتجاوز حظر جدار حماية Render
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // المنفذ الآمن المعتمد
    secure: true, // تفعيل التشفير
    pool: true, // يحافظ على الاتصال مفتوحاً لتجنب الـ Timeout
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD // تأكد أن هذا هو الـ App Password (16 حرفاً من جوجل)
    },
    tls: {
        rejectUnauthorized: false // تخطي قيود الأمان على سيرفر Render
    }
});

const sendOtpMail = async (to, otp, type) => {
    let subject = '';
    let title = '';
    let message = '';

    if (type === 'register') {
        subject = 'Venora - Account Verification';
        title = 'Verify your account';
        message = 'Welcome to Venora. Use the following code to verify your account.';
    }

    if (type === 'reset') {
        subject = 'Venora - Reset Password';
        title = 'Reset your password';
        message = 'We received a request to reset your password.';
    }

    await transporter.sendMail({
        from: `"Venora Team" <${process.env.EMAIL}>`,
        to,
        subject,
        html: `
        <div style="max-width:600px; margin:auto; padding:30px; font-family:Arial,sans-serif; background:#f9fafb; border-radius:12px; border:1px solid #e5e7eb;">
            <div style="text-align:center">
                <h1 style="color:#111827; margin-bottom:5px;">Venora</h1>
                <p style="color:#6b7280; margin-top:0;">Hall Booking Platform</p>
            </div>
            <div style="background:white; padding:25px; border-radius:10px; margin-top:20px;">
                <h2 style="color:#111827;">${title}</h2>
                <p style="color:#4b5563;">${message}</p>
                <div style="font-size:32px; font-weight:bold; text-align:center; padding:20px; background:#f3f4f6; border-radius:8px; letter-spacing:8px; margin:25px 0;">
                    ${otp}
                </div>
                <p style="color:#6b7280;">This code will expire in 5 minutes.</p>
                <hr style="border:none; border-top:1px solid #e5e7eb; margin:25px 0;"/>
                <p style="color:#9ca3af; font-size:12px; text-align:center;">
                    If you didn't request this action, you can safely ignore this email.
                </p>
            </div>
        </div>
        `
    });
};

module.exports = sendOtpMail;