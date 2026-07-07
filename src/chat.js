const messagesEl = document.getElementById("messages");
const composer = document.getElementById("composer");
const input = document.getElementById("messageInput");
const personaName = document.getElementById("personaName");
const statusLine = document.getElementById("statusLine");
const settingsButton = document.getElementById("settingsButton");
const quitButton = document.getElementById("quitButton");

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

function renderHeader(settings) {
  personaName.textContent = settings.persona?.name || "Luna";
  statusLine.textContent =
    settings.provider === "openai"
      ? `OpenAI: ${settings.openaiModel}`
      : settings.provider === "ollama"
        ? `Ollama: ${settings.ollamaModel}`
        : "offline companion";
}

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await window.companion.sendMessage(text);
});

settingsButton.addEventListener("click", () => window.companion.openSettings());
quitButton.addEventListener("click", () => window.companion.quit());

window.companion.onMessagesUpdated((messages) => renderMessages(messages));
window.companion.onSettingsUpdated((settings) => {
  appState.settings = settings;
  renderHeader(settings);
});

window.companion.getState().then((state) => {
  appState = state;
  renderHeader(state.settings);
  renderMessages(state.messages);
});
