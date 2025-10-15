// server.js
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";

const app = express();
const upload = multer({ dest: "uploads/" });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

app.use(express.static("public"));

app.post("/api/deploy", upload.single("file"), async (req, res) => {
  try {
    const projectName = req.body.name || "my-deploy";
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = path.resolve(req.file.path);
    const html = await fs.readFile(filePath, "utf-8");
    await fs.unlink(filePath);

    const payload = {
      name: projectName,
      files: [
        {
          file: "index.html",
          data: html,
        },
      ],
      target: "production",
    };

    const vercel = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await vercel.json();
    if (!vercel.ok) return res.status(500).json(data);

    res.json({
      success: true,
      url: `https://${data.url}`,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
