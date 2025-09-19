// routes/volunteer/profilePicture.js
const path = require("path");
const fs = require("fs").promises;
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");

module.exports = function registerVolunteerProfilePictureRoutes({
  router,
  pool,
  authenticate,
  authorizeVolunteer,
}) {
  router.post(
    "/volunteer/profile-picture",
    authenticate,
    authorizeVolunteer,
    async (req, res) => {
      try {
        const userId = req.user.userId;

        if (!req.files || !req.files.profilePicture) {
          return res
            .status(400)
            .json({ error: "Please upload a profile picture." });
        }

        const profilePictureFile = req.files.profilePicture;
        const profilePictureFilename = `profile_${userId}_${Date.now()}.png`;
        const isProduction = process.env.NODE_ENV === "production";
        const baseUrl = isProduction
          ? `https://${process.env.S3_BUCKET_NAME}.s3.${
              process.env.AWS_REGION || "us-east-1"
            }.amazonaws.com`
          : `http://localhost:${process.env.PORT || 3001}`;

        const s3Client = isProduction
          ? new S3Client({
              region: process.env.AWS_REGION || "us-east-1",
              credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              },
            })
          : null;

        // Convert to PNG via sharp
        const pngBuffer = await sharp(profilePictureFile.data).png().toBuffer();

        let profilePictureUrl;

        if (isProduction) {
          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `profile-pictures/${profilePictureFilename}`,
            Body: pngBuffer,
            ContentType: "image/png",
          };
          const command = new PutObjectCommand(params);
          await s3Client.send(command);
          profilePictureUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${
            process.env.AWS_REGION || "eu-north-1"
          }.amazonaws.com/profile-pictures/${profilePictureFilename}`;
        } else {
          const uploadDir = path.join(
            __dirname,
            "..",
            "..",
            "uploads",
            "profile-pictures"
          );
          await fs.mkdir(uploadDir, { recursive: true });
          profilePictureUrl = `${baseUrl}/uploads/profile-pictures/${profilePictureFilename}`;
          const fullPath = path.join(uploadDir, profilePictureFilename);
          await fs.writeFile(fullPath, pngBuffer);
        }

        const result = await pool.query(
          "UPDATE users SET profile_picture_url = $1 WHERE id = $2 RETURNING profile_picture_url",
          [profilePictureUrl, userId]
        );

        res.json({
          message: "Profile picture uploaded successfully!",
          profilePictureUrl: result.rows[0].profile_picture_url,
        });
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ error: "Failed to upload profile picture" });
      }
    }
  );
};
