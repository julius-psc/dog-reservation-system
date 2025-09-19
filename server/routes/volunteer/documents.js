// routes/volunteer/documents.js
const path = require("path");
const fs = require("fs").promises;
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  sendAdminDocumentSubmissionEmail,
} = require("../../email/emailService");

module.exports = function registerVolunteerDocumentsRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
}) {
  const isProduction = process.env.NODE_ENV === "production";
  const s3Client = isProduction
    ? new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      })
    : null;

  router.post(
    "/update-charter",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const userId = req.user.userId;

        if (!req.files || !req.files.insurance) {
          return res
            .status(400)
            .json({ error: "Please upload an insurance file." });
        }

        const insuranceFile = req.files.insurance;
        const insuranceFilename = `insurance_${userId}_${Date.now()}${path.extname(
          insuranceFile.name
        )}`;

        let insurancePath;

        if (isProduction) {
          const uploadToS3 = async (file, key) => {
            const params = {
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `insurance/${key}`,
              Body: file.data,
              ContentType: file.mimetype,
            };
            const command = new PutObjectCommand(params);
            await s3Client.send(command);
            return `https://${process.env.S3_BUCKET_NAME}.s3.${
              process.env.AWS_REGION || "us-east-1"
            }.amazonaws.com/insurance/${key}`;
          };

          insurancePath = await uploadToS3(insuranceFile, insuranceFilename);
        } else {
          const insuranceUploadDir = path.join(
            __dirname,
            "..",
            "forms",
            "insurance"
          );
          await fs.mkdir(insuranceUploadDir, { recursive: true });
          insurancePath = `/insurance/${insuranceFilename}`;
          const insuranceFullPath = path.join(
            insuranceUploadDir,
            insuranceFilename
          );
          await insuranceFile.mv(insuranceFullPath);
        }

        const result = await pool.query(
          "UPDATE users SET volunteer_status = $1, insurance_file_path = $2 WHERE id = $3 RETURNING *",
          ["pending", insurancePath, userId]
        );

        const volunteer = await pool.query(
          "SELECT username FROM users WHERE id = $1",
          [userId]
        );
        const volunteerName = volunteer.rows[0].username;

        await sendAdminDocumentSubmissionEmail(
          "lilou.ann.mossmann@gmail.com",
          volunteerName,
          null, // No charter path
          insurancePath
        );

        res.json({
          message: "Document submitted successfully!",
          user: result.rows[0],
        });
      } catch (error) {
        console.error("Error updating charter status:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to process document" });
      }
    }
  );
};
