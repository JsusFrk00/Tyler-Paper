const API_SECRET = "dispatch2026";
const EDITOR_PIN = "7500";

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
    const res = await fetch("/api/newspaper");
    const data = await res.json();
    paper = data || JSON.parse(JSON.stringify(DEFAULT_PAPER));
  } catch(e) {
    console.error("Load error:", e);
    paper = JSON.parse(JSON.stringify(DEFAULT_PAPER));
  }
  if (!paper.images) paper.images = JSON.parse(JSON.stringify(DEFAULT_PAPER.images));
  render();
}

async function savePaper() {
  const btn = document.getElementById("save-btn");
  if (btn) btn.textContent = "Saving...";
  try {
    const res = await fetch("/api/newspaper", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-secret": API_SECRET },
      body: JSON.stringify(draft)
    });
    if (!res.ok) throw new Error("Server error");
    paper = JSON.parse(JSON.stringify(draft));
    editMode = false;
    draft = null;
    showMsg("Edition saved! \u2713");
    render();
  } catch(e) {
    showMsg("Save failed. Try again.");
    if (btn) btn.textContent = "Save Edition";
  }
}

function showMsg(msg) {
  const el = document.getElementById("save-msg");
  if (el) {
    el.textContent = msg;
    setTimeout(function() {
      const e = document.getElementById("save-msg");
      if (e) e.textContent = "";
    }, 3000);
  }
}

function enterEdit() { showPin = true; render(); }
function exitEdit() { editMode = false; showPin = false; draft = null; render(); }

function checkPin() {
  const val = document.getElementById("pin-input").value;
  if (val === EDITOR_PIN) {
    showPin = false;
    editMode = true;
    draft = JSON.parse(JSON.stringify(paper));
    render();
  } else {
    document.getElementById("pin-error").style.display = "block";
    document.getElementById("pin-input").value = "";
  }
}

function updateDraft(key, value) { if (draft) draft[key] = value; }
function updateStory(id, field, value) { if (!draft) return; var s = draft.stories.find(function(s) { return s.id === id; }); if (s) s[field] = value; }
function updateImage(id, field, value) { if (!draft) return; var img = draft.images.find(function(i) { return i.id === id; }); if (img) img[field] = value; }

function handleImageUpload(id, input) {
  var file = input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) { updateImage(id, "src", e.target.result); render(); };
  reader.readAsDataURL(file);
}

function removeImage(id) { updateImage(id, "src", null); render(); }

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function eInput(val, onchange, style) {
  if (!editMode) return esc(val);
  return '<input class="edit-field" type="text" value="' + esc(val) + '" oninput="' + onchange + '" style="' + (style || "") + '" />';
}

function renderPhoto(img) {
  var caption = '<input class="edit-field" type="text" value="' + esc(img.caption) + '" oninput="updateImage(\'' + img.id + '\', \'caption\', this.value)" style="margin-top:4px;font-style:italic;font-size:0.72rem;" />';
  if (editMode) {
    if (img.src) {
      return '<div class="photo-wrap"><img src="' + img.src + '" style="width:100%;max-height:220px;object-fit:cover;border:1px solid #ccc;" />'
        + '<button class="remove-photo" onclick="removeImage(\'' + img.id + '\')">&#x2715;</button></div>' + caption;
    }
    return '<label class="photo-upload-zone"><input type="file" accept="image/*" style="display:none" onchange="handleImageUpload(\'' + img.id + '\', this)" />'
      + '<span class="icon">&#128247;</span><span class="photo-upload-label">Click to upload photo</span></label>' + caption;
  }
  if (!img.src) return "";
  return '<img src="' + img.src + '" alt="' + esc(img.caption) + '" style="width:100%;max-height:220px;object-fit:cover;display:block;border:1px solid #ccc;" />'
    + (img.caption ? '<p class="photo-caption">' + esc(img.caption) + '</p>' : "");
}

function render() {
  var d = editMode ? draft : paper;
  var top = d.stories.find(function(s) { return s.column === "top"; });
  var left = d.stories.find(function(s) { return s.column === "left"; });
  var right = d.stories.find(function(s) { return s.column === "right"; });
  var hasPhotos = d.images.some(function(i) { return i.src; });
  var showStrip = editMode || hasPhotos;

  var html = '<div class="toolbar"><span>\u2600 ' + formatDate() + '</span><div class="toolbar-btns">'
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

  html += '<div class="paper"><div class="masthead">';

  if (editMode) {
    html += '<input class="edit-field" type="text" value="' + esc(d.name) + '" oninput="updateDraft(\'name\', this.value)" style="font-family:UnifrakturMaguntia,cursive;font-size:clamp(2.5rem,8vw,4.5rem);text-align:center;letter-spacing:0.02em;color:#111;" />';
  } else {
    html += '<h1>' + esc(d.name) + '</h1>';
  }

  html += '<div class="masthead-bar">';
  if (editMode) {
    html += '<input class="edit-field" type="text" value="' + esc(d.edition) + '" oninput="updateDraft(\'edition\', this.value)" style="width:160px;font-size:0.7rem;" />';
    html += '<input class="edit-field" type="text" value="' + esc(d.tagline) + '" oninput="updateDraft(\'tagline\', this.value)" style="flex:1;margin:0 12px;font-size:0.7rem;font-style:italic;text-align:center;" />';
  } else {
    html += '<span>' + esc(d.edition) + '</span>';
    html += '<span style="font-style:italic">' + esc(d.tagline) + '</span>';
  }
  html += '<span>Est. ' + new Date().getFullYear() + '</span></div></div>';

  if (top) {
    html += '<div class="top-story"><div class="top-story-head">';
    if (editMode) {
      html += '<input class="edit-field" type="text" value="' + esc(top.headline) + '" oninput="updateStory(' + top.id + ', \'headline\', this.value)" style="font-family:\'Playfair Display\',serif;font-size:clamp(1.6rem,4vw,2.4rem);font-weight:900;text-align:center;color:#111;" />';
    } else {
      html += '<h2>' + esc(top.headline) + '</h2>';
    }
    html += '<div class="divider-line"></div>';
    html += '<div class="byline">By ';
    if (editMode) {
      html += '<input class="edit-field" type="text" value="' + esc(top.byline) + '" oninput="updateStory(' + top.id + ', \'byline\', this.value)" style="font-size:0.72rem;display:inline-block;width:auto;min-width:120px;" />';
    } else {
      html += esc(top.byline);
    }
    html += '</div></div>';
    if (editMode) {
      html += '<textarea class="edit-field" oninput="updateStory(' + top.id + ', \'body\', this.value)" rows="4">' + esc(top.body) + '</textarea>';
    } else {
      html += '<div class="body-text drop-cap"><p>' + esc(top.body) + '</p></div>';
    }
    html += '</div>';
  }

  if (showStrip) {
    html += '<div class="photo-strip">';
    d.images.forEach(function(img) {
      html += '<div class="photo-item">' + renderPhoto(img) + '</div>';
    });
    html += '</div>';
  }

  html += '<div class="two-col">';
  [left, right].forEach(function(story) {
    if (!story) { html += '<div class="col"></div>'; return; }
    html += '<div class="col">';
    if (editMode) {
      html += '<input class="edit-field" type="text" value="' + esc(story.headline) + '" oninput="updateStory(' + story.id + ', \'headline\', this.value)" style="font-family:\'Playfair Display\',serif;font-size:1.25rem;font-weight:700;color:#111;" />';
    } else {
      html += '<h3>' + esc(story.headline) + '</h3>';
    }
    html += '<div class="byline" style="margin-bottom:2px">By ';
    if (editMode) {
      html += '<input class="edit-field" type="text" value="' + esc(story.byline) + '" oninput="updateStory(' + story.id + ', \'byline\', this.value)" style="font-size:0.68rem;display:inline-block;width:auto;min-width:100px;" />';
    } else {
      html += esc(story.byline);
    }
    html += '</div><div class="col-divider"></div>';
    if (editMode) {
      html += '<textarea class="edit-field" oninput="updateStory(' + story.id + ', \'body\', this.value)" rows="5">' + esc(story.body) + '</textarea>';
    } else {
      html += '<p>' + esc(story.body) + '</p>';
    }
    html += '</div>';
  });
  html += '</div>';

  html += '<div class="footer"><span>' + esc(d.name) + ' \u00B7 ' + formatDate() + '</span><span>For internal use only</span></div></div>';

  document.getElementById("app").innerHTML = html;
}

loadPaper();
