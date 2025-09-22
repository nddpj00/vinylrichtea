import "dotenv/config";
import express from "express";
import cors from "cors";
import Discogs from "disconnect";

const app = express();
const PORT = process.env.PORT || 5000;
// Use the Discogs user token from environment variable
const discogsUserToken = process.env.DISCOGS_USER_TOKEN;
if (!discogsUserToken) {
  throw new Error("Missing DISCOGS_USER_TOKEN in environment variables");
}

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Vinyl backend is running!");
});

// Discogs API search route
app.get("/api/discogs/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Missing search query" });
  }
  try {
    const discogsClient = new Discogs.Client({ userToken: discogsUserToken });
    const db = discogsClient.database();
    db.search(q, { type: "release", per_page: 10 }, (err, data) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Discogs API error", details: err.message });
      }
      res.json(data);
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
