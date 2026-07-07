const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  dialog,
  ipcMain,
  nativeImage,
  screen
} = require("electron");
const fs = require("fs");
const path = require("path");

const APP_NAME = "AI GirlFriend";
const DEFAULT_PERSONA = {
  name: "Luna",
  tone: "warm, playful, emotionally attentive",
  systemPrompt:
    "You are Luna, a warm and playful desktop AI companion. Speak naturally, remember the user's preferences, and ask before doing anything risky."
};

let avatarWindow;
let chatWindow;
let settingsWindow;
let tray;
let store;
let proactiveTimer;

function getStorePath() {
  return path.join(app.getPath("userData"), "store.json");
}

function defaultStore() {
  return {
    settings: {
      avatarSide: "right",
      autoLaunch: false,
      proactiveEnabled: true,
      proactiveMinutes: 90,
      workspaceFolder: "",
      provider: "offline",
      openaiApiKey: "",
      openaiModel: "gpt-5.5",
      ollamaUrl: "http://127.0.0.1:11434/api/chat",
      ollamaModel: "llama3.1",
      chatBounds: null,
      settingsBounds: null,
      persona: DEFAULT_PERSONA
    },
    messages: [
      {
        role: "assistant",
        content:
          "Hi. I am Luna. This is still an early build, but I can stay on your desktop and talk with you.",
        createdAt: new Date().toISOString()
      }
    ],
    memories: [],
    generatedImages: []
  };
}

function loadStore() {
  const file = getStorePath();
  if (!fs.existsSync(file)) {
    store = defaultStore();
    saveStore();
    return;
  }

  try {
    const defaults = defaultStore();
    const persisted = JSON.parse(fs.readFileSync(file, "utf8"));
    store = {
      ...defaults,
      ...persisted,
      settings: {
        ...defaults.settings,
        ...(persisted.settings || {}),
        persona: {
          ...defaults.settings.persona,
          ...(persisted.settings?.persona || {})
        }
      },
      messages: persisted.messages || defaults.messages,
      memories: persisted.memories || defaults.memories,
      generatedImages: persisted.generatedImages || defaults.generatedImages
    };
  } catch {
    store = defaultStore();
    saveStore();
  }
}

function saveStore() {
  fs.mkdirSync(path.dirname(getStorePath()), { recursive: true });
  fs.writeFileSync(getStorePath(), JSON.stringify(store, null, 2), "utf8");
}

function createTrayImage() {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#101215"/>
      <circle cx="16" cy="14" r="9" fill="#f1c5b6"/>
      <path d="M7 14c1-7 5-11 10-11 6 0 10 5 10 11-3-3-7-5-10-5-4 0-7 2-10 5z" fill="#202631"/>
      <path d="M10 23c3-4 5-6 7-6s4 2 7 6v5H10z" fill="#59c7b1"/>
      <circle cx="13" cy="14" r="1.5" fill="#111418"/>
      <circle cx="19" cy="14" r="1.5" fill="#111418"/>
    </svg>
  `);
  return nativeImage.createFromDataURL(`data:image/svg+xml;charset=utf-8,${svg}`);
}

function createTray() {
  tray = new Tray(createTrayImage());
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(buildAppMenu());
  tray.on("double-click", showChat);
}

function refreshTrayMenu() {
  if (tray) tray.setContextMenu(buildAppMenu());
}

function buildAppMenu() {
  return Menu.buildFromTemplate([
    { label: "Open Chat", click: showChat },
    { label: "Settings", click: showSettings },
    {
      label: "Avatar Position",
      submenu: [
        {
          label: "Left",
          type: "radio",
          checked: store?.settings.avatarSide === "left",
          click: () => updateSettings({ avatarSide: "left" })
        },
        {
          label: "Right",
          type: "radio",
          checked: store?.settings.avatarSide !== "left",
          click: () => updateSettings({ avatarSide: "right" })
        }
      ]
    },
    { type: "separator" },
    { label: "Quit", click: quitApp }
  ]);
}

function createAvatarWindow() {
  avatarWindow = new BrowserWindow({
    width: 220,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  avatarWindow.loadFile(path.join(__dirname, "avatar.html"));
  avatarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  avatarWindow.setAlwaysOnTop(true, "floating");
  moveAvatarWindow();
}

function createChatWindow() {
  const savedBounds = store.settings.chatBounds;
  chatWindow = new BrowserWindow({
    width: savedBounds?.width || 460,
    height: savedBounds?.height || 640,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: 380,
    minHeight: 500,
    show: false,
    title: APP_NAME,
    backgroundColor: "#101215",
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  chatWindow.loadFile(path.join(__dirname, "chat.html"));
  chatWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      chatWindow.hide();
    }
  });
  chatWindow.on("resize", saveChatBounds);
  chatWindow.on("move", saveChatBounds);
}

function createSettingsWindow() {
  const savedBounds = store.settings.settingsBounds;
  settingsWindow = new BrowserWindow({
    width: savedBounds?.width || 560,
    height: savedBounds?.height || 680,
    x: savedBounds?.x,
    y: savedBounds?.y,
    minWidth: 460,
    minHeight: 560,
    show: false,
    title: `${APP_NAME} Settings`,
    backgroundColor: "#101215",
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  settingsWindow.loadFile(path.join(__dirname, "settings.html"));
  settingsWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      settingsWindow.hide();
    }
  });
  settingsWindow.on("resize", saveSettingsBounds);
  settingsWindow.on("move", saveSettingsBounds);
}

function saveChatBounds() {
  if (!chatWindow || chatWindow.isDestroyed()) return;
  store.settings.chatBounds = chatWindow.getBounds();
  saveStore();
}

function saveSettingsBounds() {
  if (!settingsWindow || settingsWindow.isDestroyed()) return;
  store.settings.settingsBounds = settingsWindow.getBounds();
  saveStore();
}

function moveAvatarWindow() {
  if (!avatarWindow) return;
  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea;
  const bounds = avatarWindow.getBounds();
  const margin = 18;
  const x =
    store.settings.avatarSide === "left"
      ? workArea.x + margin
      : workArea.x + workArea.width - bounds.width - margin;
  const y = workArea.y + workArea.height - bounds.height - margin;
  avatarWindow.setPosition(Math.round(x), Math.round(y));
}

function showChat() {
  if (!chatWindow) return;
  chatWindow.show();
  chatWindow.focus();
}

function showSettings() {
  if (!settingsWindow) return;
  settingsWindow.show();
  settingsWindow.focus();
}

function quitApp() {
  app.isQuitting = true;
  if (proactiveTimer) clearInterval(proactiveTimer);
  app.quit();
}

function broadcast(channel, payload) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload);
  }
}

function getRecentMessages(limit = 12) {
  return store.messages.slice(Math.max(0, store.messages.length - limit));
}

function rememberFromUserText(text) {
  const match = text.match(/(?:remember|memo)\s*[:：]?\s*(.+)$/i);
  if (!match) return;

  const memory = {
    content: match[1].trim(),
    createdAt: new Date().toISOString()
  };
  store.memories.push(memory);
}

function buildCompanionInstructions() {
  const persona = store.settings.persona || DEFAULT_PERSONA;
  const memories = store.memories
    .slice(-8)
    .map((memory) => `- ${memory.content}`)
    .join("\n");

  return [
    persona.systemPrompt,
    "",
    "Stay in character as a desktop companion.",
    "Be concise, warm, and natural.",
    "Do not claim you performed file or system actions unless the app actually did them.",
    memories ? `Known user memories:\n${memories}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

async function getAssistantReply(userText) {
  if (store.settings.provider === "openai") {
    return getOpenAIReply(userText);
  }

  if (store.settings.provider === "ollama") {
    return getOllamaReply(userText);
  }

  return getOfflineReply(userText);
}

function responseTextFromOpenAI(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

async function getOpenAIReply(userText) {
  const apiKey = String(store.settings.openaiApiKey || "").trim();
  if (!apiKey) {
    throw new Error("OpenAI API key is not set.");
  }

  const input = [
    ...getRecentMessages(10).map((message) => ({
      role: message.role,
      content: message.content
    })),
    { role: "user", content: userText }
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: store.settings.openaiModel || "gpt-5.5",
      instructions: buildCompanionInstructions(),
      input
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error?.message || `OpenAI request failed: ${response.status}`;
    throw new Error(message);
  }

  return responseTextFromOpenAI(data) || "I received an empty response.";
}

async function getOllamaReply(userText) {
  const response = await fetch(store.settings.ollamaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: store.settings.ollamaModel,
      stream: false,
      messages: [
        { role: "system", content: buildCompanionInstructions() },
        ...getRecentMessages(10).map((message) => ({
          role: message.role,
          content: message.content
        })),
        { role: "user", content: userText }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content?.trim() || "I received an empty response.";
}

function getOfflineReply(userText) {
  const lower = userText.toLowerCase();
  if (lower.includes("folder")) {
    return "Folder actions are ready. Choose a workspace folder and I will only create files inside that folder.";
  }

  if (lower.includes("image") || lower.includes("picture") || lower.includes("portrait")) {
    return "I can create a local placeholder portrait now. A real image provider can be connected next.";
  }

  if (lower.includes("remember") || lower.includes("memo")) {
    return "Got it. Use 'remember: ...' or 'memo: ...' and I will store it locally.";
  }

  const options = [
    "I am listening. This offline mode is simple, but the local chat history is already working.",
    "That is a good direction. If you switch to Ollama or OpenAI, I can answer with a real model.",
    "The shape is becoming clear: a desktop companion first, then a careful agent inside folders you approve."
  ];
  return options[Math.floor(Math.random() * options.length)];
}

function createSelfPortraitFile() {
  const folder = store.settings.workspaceFolder;
  if (!folder) {
    throw new Error("Choose a workspace folder first.");
  }

  const safeFolder = path.resolve(folder);
  fs.mkdirSync(safeFolder, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `luna-self-portrait-${timestamp}.svg`;
  const filePath = path.join(safeFolder, filename);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#14171f"/>
  <circle cx="512" cy="424" r="240" fill="#f3c7b7"/>
  <path d="M270 420c10-185 118-296 250-296 146 0 248 116 250 296-72-76-156-113-250-113-96 0-180 38-250 113z" fill="#1f2530"/>
  <path d="M332 588c72 98 133 145 184 145 53 0 113-47 180-145 30 84 49 168 58 252H270c10-86 30-170 62-252z" fill="#59c7b1"/>
  <circle cx="420" cy="430" r="24" fill="#111318"/>
  <circle cx="602" cy="430" r="24" fill="#111318"/>
  <path d="M432 550c48 42 106 42 154 0" fill="none" stroke="#9a4f58" stroke-width="18" stroke-linecap="round"/>
  <text x="512" y="910" text-anchor="middle" fill="#f3f5f7" font-size="48" font-family="Segoe UI, Arial">Luna</text>
</svg>`;
  fs.writeFileSync(filePath, svg, "utf8");

  const record = {
    path: filePath,
    prompt: "Local placeholder self portrait for Luna",
    createdAt: new Date().toISOString()
  };
  store.generatedImages.push(record);
  saveStore();
  return record;
}

function applyAutoLaunch() {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({
    openAtLogin: Boolean(store.settings.autoLaunch)
  });
}

function scheduleProactiveMessage() {
  if (proactiveTimer) clearInterval(proactiveTimer);
  proactiveTimer = setInterval(() => {
    if (!store.settings.proactiveEnabled) return;

    const last = store.messages[store.messages.length - 1];
    if (!last) return;

    const minutesSinceLast =
      (Date.now() - new Date(last.createdAt).getTime()) / 1000 / 60;
    if (minutesSinceLast < store.settings.proactiveMinutes) return;

    const hour = new Date().getHours();
    if (hour < 9 || hour > 23) return;

    const message = {
      role: "assistant",
      content: "It has been quiet. Are you taking a break, or were you focused on something?",
      createdAt: new Date().toISOString(),
      proactive: true
    };
    store.messages.push(message);
    saveStore();
    broadcast("messages:updated", store.messages);
    if (avatarWindow) {
      avatarWindow.webContents.send("avatar:say", message.content);
    }
  }, 60 * 1000);
}

function updateSettings(patch) {
  store.settings = {
    ...store.settings,
    ...patch,
    persona: {
      ...store.settings.persona,
      ...(patch.persona || {})
    }
  };
  saveStore();
  moveAvatarWindow();
  applyAutoLaunch();
  scheduleProactiveMessage();
  refreshTrayMenu();
  broadcast("settings:updated", store.settings);
  return store.settings;
}

ipcMain.handle("app:get-state", () => ({
  settings: store.settings,
  messages: store.messages,
  memories: store.memories,
  generatedImages: store.generatedImages
}));

ipcMain.handle("app:quit", () => {
  quitApp();
});

ipcMain.handle("app:open-settings", () => {
  showSettings();
});

ipcMain.handle("avatar:show-menu", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  buildAppMenu().popup({ window });
});

ipcMain.handle("chat:send", async (_event, text) => {
  const content = String(text || "").trim();
  if (!content) return store.messages;

  const userMessage = {
    role: "user",
    content,
    createdAt: new Date().toISOString()
  };
  store.messages.push(userMessage);
  rememberFromUserText(content);
  saveStore();
  broadcast("messages:updated", store.messages);

  try {
    const reply = await getAssistantReply(content);
    const assistantMessage = {
      role: "assistant",
      content: reply,
      createdAt: new Date().toISOString()
    };
    store.messages.push(assistantMessage);
    saveStore();
    broadcast("messages:updated", store.messages);
    if (avatarWindow) avatarWindow.webContents.send("avatar:say", reply);
  } catch (error) {
    const assistantMessage = {
      role: "assistant",
      content: `Connection problem: ${error.message}`,
      createdAt: new Date().toISOString()
    };
    store.messages.push(assistantMessage);
    saveStore();
    broadcast("messages:updated", store.messages);
  }

  return store.messages;
});

ipcMain.handle("settings:update", (_event, patch) => updateSettings(patch));

ipcMain.handle("settings:choose-folder", async (event) => {
  const parent = BrowserWindow.fromWebContents(event.sender) || settingsWindow || chatWindow;
  const result = await dialog.showOpenDialog(parent, {
    title: "AI companion workspace folder",
    properties: ["openDirectory", "createDirectory"]
  });

  if (result.canceled || !result.filePaths[0]) {
    return store.settings.workspaceFolder;
  }

  updateSettings({ workspaceFolder: result.filePaths[0] });
  return store.settings.workspaceFolder;
});

ipcMain.handle("agent:create-self-portrait", () => {
  const record = createSelfPortraitFile();
  broadcast("images:updated", store.generatedImages);
  return record;
});

ipcMain.on("avatar:open-chat", showChat);

app.whenReady().then(() => {
  loadStore();
  createTray();
  createAvatarWindow();
  createChatWindow();
  createSettingsWindow();
  applyAutoLaunch();
  scheduleProactiveMessage();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createAvatarWindow();
      createChatWindow();
      createSettingsWindow();
    }
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

app.on("window-all-closed", () => {});
