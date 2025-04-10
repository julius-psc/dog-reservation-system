const express = require("express");
const router = express.Router();

module.exports = (pool) => {
// New statistics endpoint
router.get("/stats", async (req, res) => {
    try {
      // Query to get volunteer count and unique villages
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'volunteer') as volunteer_count,
          COUNT(DISTINCT village_name) as village_count
        FROM (
          SELECT jsonb_array_elements_text(
            jsonb_build_array(village) || 
            COALESCE(villages_covered, '[]'::jsonb)
          ) AS village_name
          FROM users
          WHERE role = 'volunteer'
        ) AS villages
        WHERE village_name IS NOT NULL
      `;
      
      const result = await pool.query(query);
      const stats = {
        volunteers: Number(result.rows[0].volunteer_count),
        villages: Number(result.rows[0].village_count)
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics", details: error.message });
    }
  });

  return router;
};