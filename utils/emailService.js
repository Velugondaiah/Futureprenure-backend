const nodemailer = require('nodemailer');

// Create transporter with Gmail settings - using explicit host/port for better compatibility
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
        user: 'diagnoaiteam1@gmail.com',
        pass: 'qjjj bncw teai hypl'
    },
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    // Increased timeouts for cloud hosting environments
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    pool: true,               // Use pooled connections
    maxConnections: 1,
    maxMessages: 3,
    rateDelta: 1000,
    rateLimit: 3
});

// Don't verify connection on startup - it can cause issues on cloud platforms
// Test will happen when first email is sent
console.log('Email transporter configured');

// Retry function for sending emails
const sendWithRetry = async (mailOptions, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully on attempt ${attempt}:`, info.messageId);
            return info;
        } catch (error) {
            console.error(`Email attempt ${attempt} failed:`, error.message);
            if (attempt === retries) {
                throw error;
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        }
    }
};

const sendAppointmentEmail = async (appointment, doctor, userEmail) => {
    console.log('Attempting to send email to:', userEmail);

    try {
        const mailOptions = {
            from: '"DiagnoAI Team" <diagnoaiteam1@gmail.com>',
            to: userEmail,
            subject: `Appointment Confirmation - ${appointment.mode} Consultation`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #171f46;">Appointment Confirmation</h2>
                    <p>Dear ${appointment.patient_name},</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Appointment Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li>📅 Date: ${appointment.date}</li>
                            <li>⏰ Time: ${appointment.time}</li>
                            <li>👨‍⚕️ Doctor: Dr. ${doctor.name}</li>
                            <li>📍 Location: ${appointment.location}</li>
                            <li>🏥 Mode: ${appointment.mode}</li>
                        </ul>
                    </div>
                    ${appointment.mode === 'Online' ? `
                        <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #2c3e50; margin-top: 0;">Online Consultation Details</h3>
                            <p>Meeting ID: <strong>${appointment.meeting_id}</strong></p>
                            <p>Please join 5 minutes before the scheduled time.</p>
                        </div>
                    
                    ` : `
                        <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #2c3e50; margin-top: 0;">Clinic Visit Details</h3>
                            <p>Please arrive 15 minutes before your appointment time.</p>
                        </div>
                    `}
                </div>
            `
        };

        console.log('Sending email to:', userEmail);
        
        const info = await sendWithRetry(mailOptions);
        return true;

    } catch (error) {
        console.error('Email sending failed after all retries:', error.message);
        return false;
    }
};

module.exports = { sendAppointmentEmail }; 