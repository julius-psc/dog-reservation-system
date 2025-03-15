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
  try {
    const templatePath = path.join(__dirname, "..", "templates", "resetPasswordEmail.html");
    const emailTemplate = fs.readFileSync(templatePath, "utf8");
    const htmlContent = emailTemplate.replace("${resetLink}", resetLink);

    await transporter.sendMail({
      from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: htmlContent,
    });
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// VOLUNTEER APPROVAL EMAIL
async function sendApprovalEmail(email, username) {
  try {
    const templatePath = path.join(__dirname, "..", "templates", "approvalEmail.html");
    const emailTemplate = fs.readFileSync(templatePath, "utf8");
    const htmlContent = emailTemplate
      .replace("${username}", username)
      .replace("${email}", email);

    await transporter.sendMail({
      from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Votre candidature bénévole a été approuvée",
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
    const templatePath = path.join(__dirname, "..", "templates", "reservationApprovedEmail.html");
    const emailTemplate = fs.readFileSync(templatePath, "utf8");
    const formattedDate = new Date(reservationDate).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
async function sendVolunteerConfirmationEmail(
  volunteerEmail,
  volunteerName,
  clientName,
  dogName,
  reservationDate,
  startTime,
  endTime,
  clientAddress,
  clientEmail,
  clientPhone
) {
  try {
    const templatePath = path.join(__dirname, "..", "templates", "volunteerConfirmationEmail.html");
    const emailTemplate = fs.readFileSync(templatePath, "utf8");
    const htmlContent = emailTemplate
      .replace(/\${volunteerName}/g, volunteerName)
      .replace(/\${clientName}/g, clientName)
      .replace(/\${dogName}/g, dogName)
      .replace(/\${reservationDate}/g, reservationDate)
      .replace(/\${startTime}/g, startTime)
      .replace(/\${endTime}/g, endTime)
      .replace(/\${clientAddress}/g, clientAddress)
      .replace(/\${clientEmail}/g, clientEmail)
      .replace(/\${clientPhone}/g, clientPhone);

    await transporter.sendMail({
      from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
      to: volunteerEmail,
      subject: "Nouvelle réservation confirmée !",
      html: htmlContent,
    });
    console.log(`Reservation confirmation email sent to volunteer: ${volunteerEmail}`);
  } catch (error) {
    console.error("Error sending volunteer confirmation email:", error);
    throw error;
  }
}

// RESERVATION REJECTED EMAIL (CLIENT)
async function sendReservationRejectedEmail(email, clientName, dogName, reservationDate, startTime, endTime) {
  try {
    const templatePath = path.join(__dirname, "..", "templates", "reservationRejectedEmail.html");
    const emailTemplate = fs.readFileSync(templatePath, "utf8");
    const formattedDate = new Date(reservationDate).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const htmlContent = emailTemplate
      .replace("${clientName}", clientName)
      .replace("${dogName}", dogName)
      .replace("${reservationDate}", formattedDate)
      .replace("${startTime}", startTime)
      .replace("${endTime}", endTime);

    await transporter.sendMail({
      from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Votre demande de réservation n'a pas pu être acceptée pour le moment",
      html: htmlContent,
    });
    console.log(`Reservation rejected email sent to ${email}`);
  } catch (error) {
    console.error("Error sending reservation rejected email:", error);
  }
}

// RESERVATION REQUEST EMAIL (VOLUNTEER)
async function sendReservationRequestEmailToVolunteer(
  volunteerEmail,
  volunteerName,
  clientName,
  dogName,
  reservationDate,
  startTime,
  endTime,
  reservationId,
  village // New parameter for village
) {
  try {
    const templatePath = path.join(__dirname, "..", "templates", "reservationRequestEmailToVolunteer.html");
    const emailTemplate = fs.readFileSync(templatePath, "utf8");

    const formattedDate = new Date(reservationDate).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Placeholder links - replace these with actual links in your application
    const approvalLink = `[LINK TO APPROVE RESERVATION IN APP - Replace with actual link including reservationId=${reservationId}]`;
    const rejectionLink = `[LINK TO REJECT RESERVATION IN APP - Replace with actual link including reservationId=${reservationId}]`;

    const htmlContent = emailTemplate
      .replace(/\${volunteerName}/g, volunteerName)
      .replace(/\${clientName}/g, clientName)
      .replace(/\${dogName}/g, dogName)
      .replace(/\${reservationDate}/g, formattedDate)
      .replace(/\${startTime}/g, startTime)
      .replace(/\${endTime}/g, endTime)
      .replace(/\${reservationId}/g, reservationId)
      .replace(/\${village}/g, village) // Replace village placeholder
      .replace(/\${approvalLink}/g, approvalLink)
      .replace(/\${rejectionLink}/g, rejectionLink);

    await transporter.sendMail({
      from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
      to: volunteerEmail,
      subject: "Nouvelle demande de réservation en attente d'approbation",
      html: htmlContent,
    });
    console.log(`Reservation request email sent to volunteer: ${volunteerEmail}`);
  } catch (error) {
    console.error("Error sending reservation request email to volunteer:", error);
    throw error;
  }
}

// ADMIN NOTIFICATION EMAIL FOR DOCUMENT SUBMISSION
async function sendAdminDocumentSubmissionEmail(adminEmail, volunteerName, charterPath, insurancePath) {
  try {
    const templatePath = path.join(__dirname, "..", "templates", "adminDocumentSubmissionEmail.html");
    let htmlContent;

    if (fs.existsSync(templatePath)) {
      const emailTemplate = fs.readFileSync(templatePath, "utf8");
      htmlContent = emailTemplate
        .replace("${volunteerName}", volunteerName)
        .replace("${charterPath}", charterPath)
        .replace("${insurancePath}", insurancePath);
    } else {
      htmlContent = `
        <p>A volunteer has submitted their documents:</p>
        <p><strong>Volunteer Name:</strong> ${volunteerName}</p>
        <p><strong>Charter File:</strong> <a href="${charterPath}">${charterPath}</a></p>
        <p><strong>Insurance File:</strong> <a href="${insurancePath}">${insurancePath}</a></p>
        <p>Please review them at your earliest convenience.</p>
      `;
    }

    await transporter.sendMail({
      from: `"Chiens en Cavale" <${process.env.EMAIL_USER}>`,
      to: ["peschardjulius03@gmail.com", "lilou.ann.mossmann@gmail.com"], // Send to both admins
      subject: "New Volunteer Document Submission",
      html: htmlContent,
    });
    console.log(`Admin notification email sent to ${adminEmail}`);
  } catch (error) {
    console.error("Error sending admin document submission email:", error);
    throw error;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendApprovalEmail,
  sendReservationApprovedEmail,
  sendVolunteerConfirmationEmail,
  sendReservationRejectedEmail,
  sendReservationRequestEmailToVolunteer,
  sendAdminDocumentSubmissionEmail,
};