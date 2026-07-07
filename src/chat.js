const messagesEl = document.getElementById("messages");
const composer = document.getElementById("composer");
const input = document.getElementById("messageInput");
const personaName = document.getElementById("personaName");
const statusLine = document.getElementById("statusLine");
const leftSideButton = document.getElementById("leftSideButton");
const rightSideButton = document.getElementById("rightSideButton");
const quitButton = document.getElementById("quitButton");
const providerSelect = document.getElementById("providerSelect");
const modelInput = document.getElementById("modelInput");
const proactiveToggle = document.getElementById("proactiveToggle");
const autoLaunchToggle = document.getElementById("autoLaunchToggle");
const folderButton = document.getElementById("folderButton");
const folderPath = document.getElementById("folderPath");
const portraitButton = document.getElementById("portraitButton");

let appState;

function renderMessages(messages) {
  messagesEl.innerHTML = "";
  for (const message of messages) {
    const item = document.createElement("article");
    item.className = `message ${message.role}`;
    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent = message.role === "user" ? "You" : appState?.settings?.persona?.name || "Luna";
    const content = document.createElement("p");
    content.textContent = message.content;
    item.append(meta, content);
    messagesEl.append(item);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderSettings(settings) {
  personaName.textContent = settings.persona?.name || "Luna";
  statusLine.textContent =
    settings.provider === "ollama" ? `Ollama: ${settings.ollamaModel}` : "offline companion";
  providerSelect.value = settings.provider;
  modelInput.value = settings.ollamaModel;
  proactiveToggle.checked = settings.proactiveEnabled;
  autoLaunchToggle.checked = settings.autoLaunch;
  folderPath.textContent = settings.workspaceFolder || "No folder selected";
  leftSideButton.classList.toggle("active", settings.avatarSide === "left");
  rightSideButton.classList.toggle("active", settings.avatarSide === "right");
}

async function updateSettings(patch) {
  appState.settings = await window.companion.updateSettings(patch);
  renderSettings(appState.settings);
}

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await window.companion.sendMessage(text);
});

leftSideButton.addEventListener("click", () => updateSettings({ avatarSide: "left" }));
rightSideButton.addEventListener("click", () => updateSettings({ avatarSide: "right" }));
quitButton.addEventListener("click", () => window.companion.quit());
providerSelect.addEventListener("change", () => updateSettings({ provider: providerSelect.value }));
modelInput.addEventListener("change", () => updateSettings({ ollamaModel: modelInput.value.trim() || "llama3.1" }));
proactiveToggle.addEventListener("change", () => updateSettings({ proactiveEnabled: proactiveToggle.checked }));
autoLaunchToggle.addEventListener("change", () => updateSettings({ autoLaunch: autoLaunchToggle.checked }));

folderButton.addEventListener("click", async () => {
  const selected = await window.companion.chooseFolder();
  folderPath.textContent = selected || "No folder selected";
});

portraitButton.addEventListener("click", async () => {
  try {
    const record = await window.companion.createSelfPortrait();
    await window.companion.sendMessage(`Created my self portrait file: ${record.path}`);
  } catch (error) {
    await window.companion.sendMessage(`Self portrait failed: ${error.message}`);
  }
});

window.companion.onMessagesUpdated((messages) => renderMessages(messages));
window.companion.onSettingsUpdated((settings) => {
  appState.settings = settings;
  renderSettings(settings);
});

window.companion.getState().then((state) => {
  appState = state;
  renderSettings(state.settings);
  renderMessages(state.messages);
});
