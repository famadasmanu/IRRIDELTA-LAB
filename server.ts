import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// In-memory store for tokens (for demo purposes, a real app would use a DB)
// We'll key it by a simple session ID or just store the latest one for the single user preview
let currentUserTokens: any = null;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // The redirect URI is dynamic based on where the app is running
  // We'll pass it from the client when requesting the URL
);

app.use(express.json());

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/auth/url", (req, res) => {
  const redirectUri = req.query.redirectUri as string;
  
  if (!redirectUri) {
    return res.status(400).json({ error: "redirectUri is required" });
  }

  // Create a new client instance with the dynamic redirect URI
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ url });
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  
  try {
    if (!code || typeof code !== 'string') {
      throw new Error("No code provided");
    }
    
    // We need the redirect URI to exchange the code.
    // Since we don't have it here, we can reconstruct it from the request.
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const redirectUri = `${protocol}://${host}/auth/callback`;

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    
    const { tokens } = await client.getToken(code);
    currentUserTokens = tokens;
    
    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Autenticación exitosa. Esta ventana se cerrará automáticamente.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Error de autenticación");
  }
});

app.get("/api/calendar/events", async (req, res) => {
  if (!currentUserTokens) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    oauth2Client.setCredentials(currentUserTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    res.json({ events: response.data.items || [] });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  currentUserTokens = null;
  res.json({ success: true });
});

app.get("/api/auth/status", (req, res) => {
  res.json({ isAuthenticated: !!currentUserTokens });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
