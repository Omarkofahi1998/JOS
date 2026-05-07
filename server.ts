import express from "express";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("URL parameter is required");
    }

    const fetchWithRetry = async (url: string, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await axios.get(url, { 
            responseType: 'arraybuffer',
            headers: {
              'User-Agent': 'JoStudentsExamGenerator/1.0 (contact: cullinanmsjo@gmail.com; https://jostudents.com)',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            },
            timeout: 10000
          });
        } catch (error: any) {
          if (i === retries - 1) throw error;
          if (error.response?.status === 429) {
            const waitTime = delay * Math.pow(2, i);
            console.log(`Rate limited (429). Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw error;
        }
      }
    };

    try {
      const response = await fetchWithRetry(imageUrl);
      if (!response) throw new Error("No response from fetch");
      const contentType = response.headers['content-type'] as string;
      res.setHeader('Content-Type', contentType || 'image/jpeg');
      res.send(response.data);
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error("Wikimedia rate limit persistent:", imageUrl);
        return res.status(429).send("External rate limit reached");
      }
      console.error("Proxy error:", error.message || error);
      res.status(500).send("Error fetching image");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
