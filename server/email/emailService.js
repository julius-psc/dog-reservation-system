const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// PASSWORD RESET EMAIL
async function sendPasswordResetEmail(email, resetLink) {
  // Gmail version of sendPasswordResetEmail
  try {
    // Construct the path to your email template file
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "resetPasswordEmail.html"
    ); // Path relative to emailService.js

    // Read the HTML content from the file
    const emailTemplate = fs.readFileSync(templatePath, "utf8");
    const htmlContent = emailTemplate.replace("${resetLink}", resetLink);

    await transporter.sendMail({
      from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: htmlContent, // Use the HTML content from the file
    });
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// VOLUNTEER APPROVAL EMAIL
async function sendApprovalEmail(email, username) {
  try {
    // Construct the path to your email template file
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "approvalEmail.html"
    ); // Path relative to emailService.js

    // Read the HTML content from the file
    const emailTemplate = fs.readFileSync(templatePath, "utf8");

    // Replace placeholders in the template with actual values
    const htmlContent = emailTemplate
      .replace("${username}", username)
      .replace("${email}", email);

    await transporter.sendMail({
      from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Volunteer Application Has Been Approved",
      html: htmlContent,
    });
    console.log(`Approval email sent to ${email}`);
  } catch (error) {
    console.error("Error sending approval email:", error);
  }
}

// RESERVATION APPROVED EMAIL (CLIENT)
async function sendReservationApprovedEmail(email, clientName, dogName, reservationDate, startTime, endTime) {
    try {
        // Construct the path to your email template file
        const templatePath = path.join(
            __dirname,
            "..",
            "templates",
            "reservationApprovedEmail.html" // New template file
        );

        // Read the HTML content from the file
        const emailTemplate = fs.readFileSync(templatePath, "utf8");

        // Format the date for the email (you can adjust the format as needed)
        const formattedDate = new Date(reservationDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        // Replace placeholders in the template with actual reservation details
        const htmlContent = emailTemplate
            .replace("${clientName}", clientName)
            .replace("${dogName}", dogName)
            .replace("${reservationDate}", formattedDate)
            .replace("${startTime}", startTime)
            .replace("${endTime}", endTime);


        await transporter.sendMail({
            from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Votre réservation a été approuvée !",
            html: htmlContent,
        });
        console.log(`Reservation approved email sent to ${email}`);
    } catch (error) {
        console.error("Error sending reservation approved email:", error);
    }
}

// RESERVATION APPROVED EMAIL (VOLUNTEER)
async function sendVolunteerConfirmationEmail(volunteerEmail, volunteerName, clientName, dogName, reservationDate, startTime, endTime, clientAddress, clientEmail, clientPhone) {
    try {
        // 1.  Load the HTML template
        const templatePath = path.join(__dirname, "..", "templates", "volunteerConfirmationEmail.html"); // Create this file!
        const emailTemplate = fs.readFileSync(templatePath, "utf8");

        // 2. Replace placeholders with actual values
        const htmlContent = emailTemplate
            .replace(/\$\{volunteerName\}/g, volunteerName)
            .replace(/\$\{clientName\}/g, clientName)
            .replace(/\$\{dogName\}/g, dogName)
            .replace(/\$\{reservationDate\}/g, reservationDate)
            .replace(/\$\{startTime\}/g, startTime)
            .replace(/\$\{endTime\}/g, endTime)
            .replace(/\$\{clientAddress\}/g, clientAddress)
            .replace(/\$\{clientEmail\}/g, clientEmail)
            .replace(/\$\{clientPhone\}/g, clientPhone);

        // 3. Send the email
        await transporter.sendMail({
            from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
            to: volunteerEmail, // Send to the volunteer
            subject: "Nouvelle réservation confirmée !",
            html: htmlContent, // Use the processed HTML
        });
        console.log(`Reservation confirmation email sent to volunteer: ${volunteerEmail}`);

    } catch (error) {
        console.error("Error sending volunteer confirmation email:", error);
        throw error; // Re-throw to be caught in the calling function
    }
}

// RESERVATION REJECTED CLIENT
async function sendReservationRejectedEmail(email, clientName, dogName, reservationDate, startTime, endTime) {
    try {
        // Construct the path to your email template file for REJECTION
        const templatePath = path.join(
            __dirname,
            "..",
            "templates",
            "reservationRejectedEmail.html" // Ensure this template file exists!
        );

        // Read the HTML content from the file
        const emailTemplate = fs.readFileSync(templatePath, "utf8");

        // Format the date for the email
        const formattedDate = new Date(reservationDate).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        // Replace placeholders in the rejection template
        const htmlContent = emailTemplate
            .replace("${clientName}", clientName)
            .replace("${dogName}", dogName)
            .replace("${reservationDate}", formattedDate)
            .replace("${startTime}", startTime)
            .replace("${endTime}", endTime);

        await transporter.sendMail({
            from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Votre demande de réservation n'a pas pu être acceptée pour le moment", // Subject for rejection
            html: htmlContent,
        });
        console.log(`Reservation rejected email sent to ${email}`);
    } catch (error) {
        console.error("Error sending reservation rejected email:", error);
    }
}


// RESERVATION REQUEST SENT TO VOLUNTEER EMAIL
async function sendReservationRequestEmailToVolunteer(volunteerEmail, volunteerName, clientName, dogName, reservationDate, startTime, endTime, reservationId) {
  try {
      // 1.  Load the HTML template
      const templatePath = path.join(__dirname, "..", "templates", "reservationRequestEmailToVolunteer.html"); // Create this file!
      const emailTemplate = fs.readFileSync(templatePath, "utf8");

      // 2. Format the date for the email
      const formattedDate = new Date(reservationDate).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
      });

      const approvalLink = `[LINK TO APPROVE RESERVATION IN APP - Replace this with actual link]`; // Replace with actual link
      const rejectionLink = `[LINK TO REJECT RESERVATION IN APP - Replace this with actual link]`; // Replace with actual link


      // 3. Replace placeholders with actual values
      const htmlContent = emailTemplate
          .replace(/\$\{volunteerName\}/g, volunteerName)
          .replace(/\$\{clientName\}/g, clientName)
          .replace(/\$\{dogName\}/g, dogName)
          .replace(/\$\{reservationDate\}/g, formattedDate)
          .replace(/\$\{startTime\}/g, startTime)
          .replace(/\$\{endTime\}/g, endTime)
          .replace(/\$\{reservationId\}/g, reservationId)
          .replace(/\$\{approvalLink\}/g, approvalLink) // Add approval link
          .replace(/\$\{rejectionLink\}/g, rejectionLink); // Add rejection link

      // 4. Send the email
      await transporter.sendMail({
          from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
          to: volunteerEmail, // Send to the volunteer
          subject: "Nouvelle demande de réservation en attente d'approbation", // Subject in French
          html: htmlContent, // Use the processed HTML
      });
      console.log(`Reservation request email sent to volunteer: ${volunteerEmail}`);

  } catch (error) {
      console.error("Error sending reservation request email to volunteer:", error);
      throw error; // Re-throw to be caught in the calling function
  }
}


module.exports = {
  sendPasswordResetEmail: sendPasswordResetEmail,
  sendApprovalEmail,
  sendReservationApprovedEmail,
  sendVolunteerConfirmationEmail,
  sendReservationRejectedEmail,
  sendReservationRequestEmailToVolunteer
};