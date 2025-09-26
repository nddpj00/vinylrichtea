import "dotenv/config";
import express from "express";
import session from "express-session";
import DiscogsModule from "disconnect";
import cors from "cors";

const Discogs = DiscogsModule.Client;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret", // use a strong secret in production
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

const consumerKey = process.env.DISCOGS_CONSUMER_KEY;
const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET;
const callbackUrl =
  process.env.DISCOGS_CALLBACK_URL ||
  "http://localhost:5000/api/discogs/callback";

// Step 1: Start OAuth and redirect user to Discogs
app.get("/api/discogs/login", (req, res) => {
  const oAuth = new Discogs().oauth();
  oAuth.getRequestToken(
    consumerKey,
    consumerSecret,
    callbackUrl,
    (err, requestData) => {
      if (err)
        return res.status(500).json({ error: "OAuth error", details: err });
      // Save requestData in session for later use
      req.session.requestData = requestData;
      res.redirect(requestData.authorizeUrl);
    }
  );
});

// Step 2: Handle callback from Discogs
app.get("/api/discogs/callback", (req, res) => {
  if (!req.session.requestData) {
    return res
      .status(400)
      .json({ error: "No OAuth request data found in session" });
  }

  const oAuth = new Discogs(req.session.requestData).oauth();
  oAuth.getAccessToken(req.query.oauth_verifier, (err, accessData) => {
    if (err) {
      console.error("[DEBUG] OAuth callback error:", err);
      return res.status(500).json({ error: "OAuth error", details: err });
    }
    // Save accessData in session for authenticated requests
    req.session.accessData = accessData;
    console.log(
      "[DEBUG] Discogs accessData:",
      JSON.stringify(accessData, null, 2)
    );
    // Redirect to frontend or send a success message
    const frontendUrl = "http://localhost:5173";
    res.redirect(frontendUrl);
  });
});

// Helper route to check authentication status
app.get("/api/discogs/status", (req, res) => {
  const isAuthenticated = !!req.session.accessData;
  console.log("[DEBUG] Status check - Session data:", {
    authenticated: isAuthenticated,
    hasRequestData: !!req.session.requestData,
    sessionId: req.session.id,
    accessData: req.session.accessData ? "Present" : "Missing",
  });
  // Try to resolve username via Discogs identity if authenticated
  if (isAuthenticated) {
    const dis = new Discogs(req.session.accessData);
    dis.getIdentity((err, identity) => {
      if (err) {
        console.warn(
          "[DEBUG] status identity lookup failed",
          err && err.message
        );
        return res.json({
          authenticated: true,
          hasRequestData: !!req.session.requestData,
          sessionId: req.session.id,
        });
      }
      return res.json({
        authenticated: true,
        hasRequestData: !!req.session.requestData,
        sessionId: req.session.id,
        username: identity?.username || null,
      });
    });
    return;
  }

  res.json({
    authenticated: isAuthenticated,
    hasRequestData: !!req.session.requestData,
    sessionId: req.session.id,
  });
});

// Logout route - clears session
app.post("/api/discogs/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("[DEBUG] session destroy error", err);
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

// Step 3: Fetch user collection (must be authenticated)
app.get("/api/discogs/collection", (req, res) => {
  if (!req.session.accessData) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  console.log(
    "[DEBUG] Session accessData:",
    JSON.stringify(req.session.accessData, null, 2)
  );

  try {
    const dis = new Discogs(req.session.accessData);

    // Use getIdentity instead of getProfile - it's more reliable for authenticated users
    dis.getIdentity((err, identity) => {
      if (err) {
        console.error("[DEBUG] Identity error:", err);
        if (err.statusCode === 404) {
          return res.status(404).json({
            error: "User identity not found",
            message:
              "Could not retrieve user identity. The user may not exist or the token may be invalid.",
            details: err,
          });
        }
        return res.status(500).json({ error: "Identity error", details: err });
      }

      console.log(
        "[DEBUG] Discogs identity:",
        JSON.stringify(identity, null, 2)
      );
      if (!identity || !identity.username) {
        return res
          .status(500)
          .json({ error: "No username found in identity", identity });
      }

      const username = identity.username;
      console.log("[DEBUG] Fetching collection for username:", username);

      const collection = dis.user().collection();

      // Use folder 0 (All) - this is the standard folder for all items
      collection.getReleases(
        username,
        0,
        { per_page: 10, page: 1 },
        (err, data) => {
          if (err) {
            console.error("[DEBUG] Collection error:", err);
            console.error("[DEBUG] Error details:", {
              statusCode: err.statusCode,
              message: err.message,
              username: username,
            });

            if (err.statusCode === 404) {
              return res.status(404).json({
                error: "Collection not found",
                message: `No collection found for user '${username}'. The user may have a private collection or no items.`,
                details: err,
              });
            }
            return res
              .status(500)
              .json({ error: "Collection error", details: err });
          } else {
            console.log("[DEBUG] Collection data received:", {
              pagination: data.pagination,
              itemCount: data.releases ? data.releases.length : 0,
            });
            res.json(data);
          }
        }
      );
    });
  } catch (error) {
    console.error("[DEBUG] Unexpected error:", error);
    return res
      .status(500)
      .json({ error: "Unexpected error", details: error.message });
  }
});

// Fetch tracklist for a release by release id (Discogs release id)
app.get("/api/discogs/tracklist", (req, res) => {
  const releaseId = req.query.release_id;
  const resourceUrl = req.query.resource_url;
  if (!releaseId && !resourceUrl)
    return res
      .status(400)
      .json({ error: "release_id or resource_url required" });
  if (!req.session.accessData)
    return res.status(401).json({ error: "Not authenticated" });

  try {
    const dis = new Discogs(req.session.accessData);

    const respondWith = (err, obj, source) => {
      if (err) {
        console.error("[DEBUG] getRelease/master error:", err);
        if (err.statusCode === 404)
          return res
            .status(404)
            .json({ error: `${source} not found`, details: err });
        return res
          .status(500)
          .json({ error: `${source} fetch error`, details: err });
      }
      console.log(
        "[DEBUG] Release/master fetched keys:",
        Object.keys(obj || {})
      );
      return res.json({
        tracklist: obj.tracklist || [],
        title: obj.title || obj.name,
        artists: obj.artists || obj.performers || null,
        raw: obj,
      });
    };

    if (resourceUrl) {
      // determine if resource is a master or release
      try {
        const url = new URL(resourceUrl);
        const parts = url.pathname.split("/").filter(Boolean); // e.g. ['api','discogs','releases','12345'] or ['releases','12345']
        // find last numeric id
        const idPart = parts.reverse().find((p) => /^\d+$/.test(p));
        if (idPart) {
          const id = parseInt(idPart, 10);
          if (resourceUrl.includes("/masters/") || parts.includes("masters")) {
            // call database.getMaster
            dis
              .database()
              .getMaster(id, (err, master) =>
                respondWith(err, master, "master")
              );
            return;
          }
          // default to release
          dis
            .database()
            .getRelease(id, (err, release) =>
              respondWith(err, release, "release")
            );
          return;
        }
      } catch (e) {
        console.warn(
          "[DEBUG] resource_url parse failed, falling back to releaseId",
          e.message
        );
      }
    }

    // fallback to numeric release id if provided
    if (releaseId) {
      const id = parseInt(releaseId, 10);
      if (Number.isNaN(id))
        return res.status(400).json({ error: "release_id must be numeric" });
      dis
        .database()
        .getRelease(id, (err, release) => respondWith(err, release, "release"));
      return;
    }

    // Shouldn't get here
    return res
      .status(400)
      .json({ error: "Unable to determine release or master id" });
  } catch (error) {
    console.error("[DEBUG] Unexpected error fetching release:", error);
    res.status(500).json({ error: "Unexpected error", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
