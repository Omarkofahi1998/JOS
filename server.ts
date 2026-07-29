import express from "express";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  app.post("/api/upload", upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const folder = req.body.folder || 'academy';
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Missing Supabase URL or Service Role Key in server environment." });
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('academy')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('academy')
        .getPublicUrl(fileName);

      // Return both direct publicUrl and proxy relative path
      const proxyUrl = `/api/files/download?bucket=academy&path=${fileName}`;
      res.status(200).json({ publicUrl, proxyUrl });
    } catch (error: any) {
      console.error("Server upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/files/download", async (req, res) => {
    const bucket = (req.query.bucket as string) || 'bank_files';
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: "Missing file path" });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Missing Supabase configuration." });
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabaseAdmin.storage.from(bucket).download(filePath);
      if (error) throw error;

      const buffer = Buffer.from(await data.arrayBuffer());
      res.setHeader('Content-Type', data.type || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
      return res.send(buffer);
    } catch (err: any) {
      console.error("File proxy error:", err);
      return res.status(404).json({ error: "File not found or access denied" });
    }
  });

  app.post("/api/create-user", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];

    const { email, password, role, fullName, metadata } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Missing Supabase URL or Service Role Key in server environment." });
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Verify admin role
      const { data: { user }, error: authUserError } = await supabaseAdmin.auth.getUser(token);
      if (authUserError || !user) throw new Error("Invalid token.");

      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
      
      if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Admin access required." });
      }

      // 1. Create User in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: role, ...metadata }
      });

      if (authError) throw authError;

      // 2. Add User to Profiles Table
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: role,
          created_at: new Date().toISOString()
        });
        
      if (profileError) throw profileError;

      res.status(200).json({ message: "User created successfully", user: authData.user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/add-product", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];

    const payload = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Missing Supabase URL or Service Role Key in server environment." });
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Verify token
      const { data: { user }, error: authUserError } = await supabaseAdmin.auth.getUser(token);
      if (authUserError || !user) throw new Error("Invalid token.");

      // Check if user is instructor (or admin)
      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
      
      if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin' && profile.role !== 'company')) {
        return res.status(403).json({ error: "Forbidden: Instructor access required." });
      }

      // Add product via admin
      const { data, error: insertError } = await supabaseAdmin
        .from('products')
        .insert([{
          ...payload,
          instructor_id: user.id // enforce user's ID
        }]);

      if (insertError) throw insertError;

      res.status(200).json({ message: "Product added successfully", data });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/add-service", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];

    const payload = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Missing Supabase URL or Service Role Key in server environment." });
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Verify token
      const { data: { user }, error: authUserError } = await supabaseAdmin.auth.getUser(token);
      if (authUserError || !user) throw new Error("Invalid token.");

      // Check if user is service_provider (or admin/company)
      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
      
      if (!profile || (profile.role !== 'service_provider' && profile.role !== 'admin' && profile.role !== 'company')) {
        return res.status(403).json({ error: "Forbidden: Service Provider access required." });
      }

      // Add service via admin
      const { data, error: insertError } = await supabaseAdmin
        .from('services')
        .insert([{
          ...payload,
          provider_id: user.id // enforce user's ID
        }]);

      if (insertError) throw insertError;

      res.status(200).json({ message: "Service added successfully", data });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/add-job", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];

    const payload = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Missing Supabase URL or Service Role Key in server environment." });
    }

    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Verify token
      const { data: { user }, error: authUserError } = await supabaseAdmin.auth.getUser(token);
      if (authUserError || !user) throw new Error("Invalid token.");

      // Check if user is employer (or admin/company)
      const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
      
      if (!profile || (profile.role !== 'employer' && profile.role !== 'company' && profile.role !== 'admin')) {
        return res.status(403).json({ error: "Forbidden: Employer access required." });
      }

      // Add job via admin
      const { data, error: insertError } = await supabaseAdmin
        .from('jobs')
        .insert([payload]);

      if (insertError) throw insertError;

      res.status(200).json({ message: "Job added successfully", data });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("URL parameter is required");
    }

    try {
      const parsedUrl = new URL(imageUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.status(403).send("Invalid protocol");
      }
      // Basic SSRF mitigation (not exhaustive, but prevents basic localhost/loopback attacks)
      const hostname = parsedUrl.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('169.254.')) {
        return res.status(403).send("Forbidden IP/Hostname");
      }
    } catch (e) {
      return res.status(400).send("Invalid URL format");
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
