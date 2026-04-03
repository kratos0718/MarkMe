const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create invalid transporter initially - user needs to configure these
    // For now using a placeholder or looking for ENV vars
    // Ideally we use a service like Gmail, SendGrid, etc.
    // For this environment, we'll try to use a test account or expect ENV vars.

    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail'
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@gitam-attendance.edu',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: options.html // Optional
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
