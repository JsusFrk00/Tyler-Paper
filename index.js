const express = require("express");
const { createClient } = require("redis");

const app = express();
app.use(express.json({ limit: "10mb" }));

const REDIS_KEY = "newspaper:content";
const API_SECRET = process.env.API_SECRET;

const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => console.error("Redis error:", err));
redis.connect().catch(err => console.error("Redis connect error:", err));

app.get("/test", (req, res) => {
  res.json({
    redisReady: redis.isReady,
    redisOpen: redis.isOpen,
    redisUrl: process.env.REDIS_URL ? "set" : "NOT SET",
    apiSecret: process.env.API_SECRET ? "set" : "NOT SET"
  });
});

app.get("/api/newspaper", async (req, res) => {
  console.log("GET /api/newspaper hit, redis.isReady:", redis.isReady);
  try {
    const data = await Promise.race([
      redis.get(REDIS_KEY),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Redis timeout")), 8000))
    ]);
    if (!data) return res.json(null);
    res.json(JSON.parse(data));
  } catch (err) {
    console.error("GET error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/newspaper", async (req, res) => {
  const secret = req.headers["x-api-secret"];
  if (!API_SECRET || secret !== API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await redis.set(REDIS_KEY, JSON.stringify(req.body));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save newspaper" });
  }
});

app.get("/", (req, res) => {
  const editorPin = "7500";
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>The Daily Dispatch</title>
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f5f0e8; min-height: 100vh; padding-bottom: 60px; font-family: 'Libre Baskerville', serif; }
.drop-cap p::first-letter { float: left; font-family: 'Playfair Display', serif; font-size: 3.8em; line-height: 0.8; padding-right: 6px; padding-top: 4px; font-weight: 900; color: #111; }
.toolbar { background: #1a1a1a; color: #f5f0e8; padding: 8px 24px; display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; letter-spacing: 0.1em; }
.toolbar-btns { display: flex; gap: 10px; align-items: center; }
.save-btn { cursor: pointer; background: #1a1a1a; color: #f5f0e8; border: 1px solid #f5f0e8; padding: 8px 18px; font-family: 'Libre Baskerville', serif; font-size: 0.8rem; letter-spacing: 0.08em; transition: background 0.2s; }
.save-btn:hover { background: #8b0000; border-color: #8b0000; }
.edit-btn { cursor: pointer; background: transparent; border: 1px solid #555; color: #ccc; padding: 6px 14px; font-family: 'Libre Baskerville', serif; font-size: 0.75rem; letter-spacing: 0.06em; transition: all 0.2s; }
.edit-btn:hover { border-color: #8b0000; color: #8b0000; }
.paper { max-width: 900px; margin: 0 auto; padding: 0 16px; }
.masthead { text-align: center; border-bottom: 4px double #222; padding-bottom: 10px; margin-top: 24px; }
.masthead h1 { font-family: 'UnifrakturMaguntia', cursive; font-size: clamp(2.5rem, 8vw, 4.5rem); letter-spacing: 0.02em; color: #111; line-height: 1.1; }
.masthead-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding: 4px 0; border-top: 1px solid #888; border-bottom: 1px solid #888; font-size: 0.7rem; color: #444; letter-spacing: 0.05em; }
.top-story { padding: 18px 0 14px; border-bottom: 2px solid #555; }
.top-story-head { text-align: center; margin-bottom: 12px; }
.top-story-head h2 { font-family: 'Playfair Display', serif; font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 900; letter-spacing: -0.01em; color: #111; line-height: 1.2; }
.divider-line { width: 60px; height: 2px; background: #555; margin: 10px auto 4px; }
.byline { font-size: 0.72rem; color: #666; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 4px; }
.body-text { font-size: 1rem; line-height: 1.75; color: #222; column-count: 2; column-gap: 28px; column-rule: 1px solid #bbb; margin-top: 12px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-top: 16px; }
.col { padding: 0 20px 20px; }
.col:last-child { border-left: 1px solid #999; }
.col h3 { font-family: 'Playfair Display', serif; font-size: 1.25rem; font-weight: 700; margin-bottom: 4px; line-height: 1.3; color: #111; }
.col-divider { width: 100%; height: 1px; background: #bbb; margin: 8px 0 10px; }
.col p { font-size: 0.88rem; line-height: 1.7; color: #333; }
.photo-strip { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px 0; border-bottom: 1px solid #bbb; }
.photo-item img { width: 100%; max-height: 220px; object-fit: cover; display: block; border: 1px solid #ccc; }
.photo-caption { font-size: 0.72rem; font-style: italic; color: #666; margin-top: 4px; text-align: center; }
.footer { border-top: 3px double #555; margin-top: 20px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 0.65rem; color: #888; letter-spacing: 0.06em; }
.edit-field { width: 100%; font-family: inherit; font-size: inherit; border: 2px dashed #b00; background: rgba(255,240,240,0.5); padding: 4px 6px; border-radius: 3px; color: inherit; resize: vertical; }
.edit-field:focus { outline: none; border-color: #900; }
input.edit-field { resize: none; }
.photo-upload-zone { border: 2px dashed #b00; background: rgba(255,240,240,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; min-height: 140px; transition: background 0.2s; width: 100%; }
.photo-upload-zone:hover { background: rgba(255,220,220,0.6); }
.photo-upload-zone .icon { font-size: 2rem; color: #ccc; }
.photo-upload-label { font-size: 0.7rem; color: #999; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 8px; }
.remove-photo { position: absolute; top: 6px; right: 6px; background: #8b0000; color: #fff; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 0.8rem; line-height: 24px; text-align: center; }
.photo-wrap { position: relative; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal { background: #fff8f0; border: 1px solid #ccc; max-width: 340px; width: 90%; padding: 32px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
.modal h3 { font-size: 0.85rem; color: #555; margin-bottom: 6px; letter-spacing: 0.06em; text-transform: uppercase; }
.modal p { font-size: 0.78rem; color: #888; margin-bottom: 20px; }
.pin-input { width: 100%; padding: 10px; font-family: inherit; font-size: 1rem; border: 1px solid #ccc; border-radius: 3px; text-align: center; letter-spacing: 0.3em; margin-bottom: 12px; }
.pin-error { color: #b00; font-size: 0.75rem; margin-bottom: 10px; display: none; }
.modal-hint { font-size: 0.7rem; color: #aaa; margin-top: 14px; }
.cancel-link { background: none; border: none; color: #aaa; cursor: pointer; font-size: 0.75rem; margin-top: 8px; font-family: inherit; display: block; margin: 8px auto 0; }
.save-msg { color: #90ee90; font-size: 0.75rem; }
.loading { display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 1.1rem; letter-spacing: 0.05em; color: #333; }
</style>
</head>
<body>
<div id="app"><div class="loading">Loading today's edition…</div></div>
<script>
const API_SECRET = "${process.env.API_SECRET || 'dispatch2026'}";
const EDITOR_PIN = "${editorPin}";
const DEFAULT_PAPER = {
  name: "The Daily Dispatch",
  tagline: "All the news that's fit to print — at the office",
  edition: "Vol. 1, No. 1",
  images: [
    { id: "img1", src: null, caption: "Photo caption here" },
    { id: "img2", src: null, caption: "Photo caption here" }
  ],
  stories: [
    { id: 1, column: "top", headline: "Welcome to The Daily Dispatch", byline: "The Editor", body: "This is your team's very own daily newspaper. Each morning, the editor updates the stories and everyone on the team gets the latest news, updates, and announcements — all in one place. No emails, no Slack threads, just clean, readable news." },
    { id: 2, column: "left", headline: "How to Use This Paper", byline: "Staff Reporter", body: "Click the Editor Mode button in the top right to unlock editing. You can update headlines, body text, and bylines. Hit Save Edition when done — your coworkers will see the changes instantly when they refresh." },
    { id: 3, column: "right", headline: "Tip of the Day", byline: "Features Desk", body: "Change the newspaper name, tagline, and edition number to match your team's style. Make it yours — a daily ritual your team will actually look forward to." }
  ]
};

let paper = null, draft = null, editMode = false, showPin = false;

function formatDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

async function loadPaper() {
  try {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 5000); const res = await fetch("/api/newspaper", { signal: controller.signal }); clearTimeout(timeout);
    const data = await res.json();
    paper = data || JSON.parse(JSON.stringify(DEFAULT_PAPER));
  } catch { paper = JSON.parse(JSON.stringify(DEFAULT_PAPER)); }
  if (!paper.images) paper.images = JSON.parse(JSON.stringify(DEFAULT_PAPER.images));
  render();
}

async function savePaper() {
  const btn = document.getElementById("save-btn");
  if (btn) btn.textContent = "Saving…";
  try {
    const res = await fetch("/api/newspaper", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-secret": API_SECRET },
      body: JSON.stringify(draft)
    });
    if (!res.ok) throw new Error();
    paper = JSON.parse(JSON.stringify(draft));
    editMode = false; draft = null;
    showMsg("Edition saved! ✓");
    render();
  } catch { showMsg("Save failed. Try again."); if (btn) btn.textContent = "Save Edition"; }
}

function showMsg(msg) {
  const el = document.getElementById("save-msg");
  if (el) { el.textContent = msg; setTimeout(() => { const e = document.getElementById("save-msg"); if(e) e.textContent = ""; }, 3000); }
}

function enterEdit() { showPin = true; render(); }
function exitEdit() { editMode = false; showPin = false; draft = null; render(); }

function checkPin() {
  const val = document.getElementById("pin-input").value;
  if (val === EDITOR_PIN) {
    showPin = false; editMode = true;
    draft = JSON.parse(JSON.stringify(paper));
    render();
  } else {
    document.getElementById("pin-error").style.display = "block";
    document.getElementById("pin-input").value = "";
  }
}

function updateDraft(key, value) { draft[key] = value; }
function updateStory(id, field, value) { const s = draft.stories.find(s => s.id === id); if (s) s[field] = value; }
function updateImage(id, field, value) { const img = draft.images.find(i => i.id === id); if (img) img[field] = value; }

function handleImageUpload(id, input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { updateImage(id, "src", e.target.result); render(); };
  reader.readAsDataURL(file);
}

function removeImage(id) { updateImage(id, "src", null); render(); }

function esc(s) { return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function eInput(val, onchange, style) {
  return editMode ? '<input class="edit-field" type="text" value="' + esc(val) + '" oninput="' + onchange + '" style="' + (style||"") + '" />' : esc(val);
}
function eTextarea(val, onchange) {
  return editMode ? '<textarea class="edit-field" oninput="' + onchange + '" rows="5">' + esc(val) + '</textarea>' : '<p>' + esc(val) + '</p>';
}

function renderPhoto(img) {
  if (editMode) {
    const caption = '<input class="edit-field" type="text" value="' + esc(img.caption) + '" oninput="updateImage(\'' + img.id + '\', \'caption\', this.value)" style="margin-top:4px;font-style:italic;font-size:0.72rem;" />';
    if (img.src) {
      return '<div class="photo-wrap"><img src="' + img.src + '" style="width:100%;max-height:220px;object-fit:cover;border:1px solid #ccc;" />'
        + '<button class="remove-photo" onclick="removeImage(\'' + img.id + '\')">✕</button></div>' + caption;
    }
    return '<label class="photo-upload-zone"><input type="file" accept="image/*" style="display:none" onchange="handleImageUpload(\'' + img.id + '\', this)" />'
      + '<span class="icon">📷</span><span class="photo-upload-label">Click to upload photo</span></label>' + caption;
  }
  if (!img.src) return "";
  return '<img src="' + img.src + '" alt="' + esc(img.caption) + '" style="width:100%;max-height:220px;object-fit:cover;display:block;border:1px solid #ccc;" />'
    + (img.caption ? '<p class="photo-caption">' + esc(img.caption) + '</p>' : "");
}

function render() {
  const d = editMode ? draft : paper;
  const top = d.stories.find(s => s.column === "top");
  const left = d.stories.find(s => s.column === "left");
  const right = d.stories.find(s => s.column === "right");
  const hasPhotos = d.images.some(i => i.src);
  const showStrip = editMode || hasPhotos;

  let html = '<div class="toolbar"><span>☀ ' + formatDate() + '</span><div class="toolbar-btns">'
    + '<span id="save-msg" class="save-msg"></span>'
    + (editMode
      ? '<button id="save-btn" class="save-btn" onclick="savePaper()">Save Edition</button><button class="edit-btn" onclick="exitEdit()">Cancel</button>'
      : '<button class="edit-btn" onclick="enterEdit()">Editor Mode</button>')
    + '</div></div>';

  if (showPin) {
    html += '<div class="modal-overlay"><div class="modal">'
      + '<h3>Editor Access</h3><p>Enter your editor PIN to continue</p>'
      + '<input id="pin-input" class="pin-input" type="password" placeholder="PIN" onkeydown="if(event.key===\'Enter\')checkPin()" />'
      + '<div id="pin-error" class="pin-error">Incorrect PIN. Try again.</div>'
      + '<button class="save-btn" style="width:100%" onclick="checkPin()">Unlock Editor</button>'
      + '<p class="modal-hint">Contact your editor for the PIN</p>'
      + '<button class="cancel-link" onclick="exitEdit()">Cancel</button>'
      + '</div></div>';
  }

  html += '<div class="paper"><div class="masthead">'
    + (editMode
      ? '<input class="edit-field" type="text" value="' + esc(d.name) + '" oninput="updateDraft(\'name\', this.value)" style="font-family:UnifrakturMaguntia,cursive;font-size:clamp(2.5rem,8vw,4.5rem);text-align:center;letter-spacing:0.02em;color:#111;" />'
      : '<h1>' + esc(d.name) + '</h1>')
    + '<div class="masthead-bar">'
    + (editMode ? '<input class="edit-field" type="text" value="' + esc(d.edition) + '" oninput="updateDraft(\'edition\', this.value)" style="width:160px;font-size:0.7rem;" />' : '<span>' + esc(d.edition) + '</span>')
    + (editMode ? '<input class="edit-field" type="text" value="' + esc(d.tagline) + '" oninput="updateDraft(\'tagline\', this.value)" style="flex:1;margin:0 12px;font-size:0.7rem;font-style:italic;text-align:center;" />' : '<span style="font-style:italic">' + esc(d.tagline) + '</span>')
    + '<span>Est. ' + new Date().getFullYear() + '</span></div></div>';

  if (top) {
    html += '<div class="top-story"><div class="top-story-head">'
      + (editMode ? '<input class="edit-field" type="text" value="' + esc(top.headline) + '" oninput="updateStory(' + top.id + ', \'headline\', this.value)" style="font-family:\'Playfair Display\',serif;font-size:clamp(1.6rem,4vw,2.4rem);font-weight:900;text-align:center;color:#111;" />' : '<h2>' + esc(top.headline) + '</h2>')
      + '<div class="divider-line"></div>'
      + '<div class="byline">By ' + (editMode ? '<input class="edit-field" type="text" value="' + esc(top.byline) + '" oninput="updateStory(' + top.id + ', \'byline\', this.value)" style="font-size:0.72rem;display:inline-block;width:auto;min-width:120px;" />' : esc(top.byline)) + '</div>'
      + '</div>'
      + (editMode ? '<textarea class="edit-field" oninput="updateStory(' + top.id + ', \'body\', this.value)" rows="4">' + esc(top.body) + '</textarea>' : '<div class="body-text drop-cap"><p>' + esc(top.body) + '</p></div>')
      + '</div>';
  }

  if (showStrip) {
    html += '<div class="photo-strip">' + d.images.map(img => '<div class="photo-item">' + renderPhoto(img) + '</div>').join("") + '</div>';
  }

  html += '<div class="two-col">' + [left, right].map((story) => {
    if (!story) return '<div class="col"></div>';
    return '<div class="col">'
      + (editMode ? '<input class="edit-field" type="text" value="' + esc(story.headline) + '" oninput="updateStory(' + story.id + ', \'headline\', this.value)" style="font-family:\'Playfair Display\',serif;font-size:1.25rem;font-weight:700;color:#111;" />' : '<h3>' + esc(story.headline) + '</h3>')
      + '<div class="byline" style="margin-bottom:2px">By ' + (editMode ? '<input class="edit-field" type="text" value="' + esc(story.byline) + '" oninput="updateStory(' + story.id + ', \'byline\', this.value)" style="font-size:0.68rem;display:inline-block;width:auto;min-width:100px;" />' : esc(story.byline)) + '</div>'
      + '<div class="col-divider"></div>'
      + (editMode ? '<textarea class="edit-field" oninput="updateStory(' + story.id + ', \'body\', this.value)" rows="5">' + esc(story.body) + '</textarea>' : '<p>' + esc(story.body) + '</p>')
      + '</div>';
  }).join("") + '</div>';

  html += '<div class="footer"><span>' + esc(d.name) + ' · ' + formatDate() + '</span><span>For internal use only</span></div></div>';

  document.getElementById("app").innerHTML = html;
}

loadPaper();
</script>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
