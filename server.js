require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { customAlphabet } = require('nanoid');
const validUrl = require('valid-url');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Health
app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// API: Create link
// Body: { target_url: string, code?: string }
app.post('/api/links', async (req, res) => {
  try {
    const { target_url, code } = req.body;
    if (!target_url || !validUrl.isWebUri(target_url)) {
      return res.status(400).json({ error: 'Invalid or missing target_url' });
    }
    let chosen = code;
    if (chosen) {
      if (!CODE_REGEX.test(chosen)) {
        return res.status(400).json({ error: 'Code must match [A-Za-z0-9]{6,8}' });
      }
      const exists = db.getLinkByCode(chosen);
      if (exists) return res.status(409).json({ error: 'Code already exists' });
    } else {
      // generate a code (6 chars)
      const nano = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 6);
      chosen = nano();
      // ensure uniqueness
      let i = 0;
      while (db.getLinkByCode(chosen)) {
        chosen = nano();
        if (++i > 10) break;
      }
    }
    const created = db.createLink(chosen, target_url);
    return res.status(201).json(created);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// API: List links
app.get('/api/links', (req, res) => {
  const all = db.getAllLinks();
  res.json(all);
});

// API: Get single link stats
app.get('/api/links/:code', (req, res) => {
  const code = req.params.code;
  const link = db.getLinkByCode(code);
  if (!link) return res.status(404).json({ error: 'Not found' });
  res.json(link);
});

// API: Delete a link
app.delete('/api/links/:code', (req, res) => {
  const code = req.params.code;
  const link = db.getLinkByCode(code);
  if (!link) return res.status(404).json({ error: 'Not found' });
  db.deleteLink(code);
  res.json({ ok: true });
});

// Redirect route: /:code
app.get('/:code', (req, res) => {
  const code = req.params.code;
  // avoid matching static asset paths by checking length pattern
  if (!CODE_REGEX.test(code)) return res.status(404).send('Not found');
  const link = db.getLinkByCode(code);
  if (!link) return res.status(404).send('Not found');
  db.incrementClick(code);
  return res.redirect(302, link.target_url);
});

// Start server
app.listen(PORT, () => {
  console.log(`TinyLink server listening on port ${PORT}`);
  console.log(`Dashboard: ${BASE_URL}/`);
});
