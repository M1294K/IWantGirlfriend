const settingsStatus = document.getElementById("settingsStatus");
const leftSideButton = document.getElementById("leftSideButton");
const rightSideButton = document.getElementById("rightSideButton");
const providerSelect = document.getElementById("providerSelect");
const modelInput = document.getElementById("modelInput");
const openaiKeyInput = document.getElementById("openaiKeyInput");
const personaPromptInput = document.getElementById("personaPromptInput");
const proactiveToggle = document.getElementById("proactiveToggle");
const autoLaunchToggle = document.getElementById("autoLaunchToggle");
const memoryComposer = document.getElementById("memoryComposer");
const memoryInput = document.getElementById("memoryInput");
const memoryList = document.getElementById("memoryList");
const clearMemoriesButton = document.getElementById("clearMemoriesButton");
const imageProviderSelect = document.getElementById("imageProviderSelect");
const imageModelInput = document.getElementById("imageModelInput");
const imageSizeSelect = document.getElementById("imageSizeSelect");
const folderButton = document.getElementById("folderButton");
const folderPath = document.getElementById("folderPath");
const portraitButton = document.getElementById("portraitButton");

let appState;

function renderSettings(settings) {
  settingsStatus.textContent =
    settings.provider === "openai"
      ? `OpenAI: ${settings.openaiModel}`
      : settings.provider === "ollama"
        ? `Ollama: ${settings.ollamaModel}`
        : "Offline mode";
  providerSelect.value = settings.provider;
  modelInput.value = settings.provider === "openai" ? settings.openaiModel : settings.ollamaModel;
  openaiKeyInput.value = settings.openaiApiKey || "";
  personaPromptInput.value = settings.persona?.systemPrompt || "";
  proactiveToggle.checked = settings.proactiveEnabled;
  autoLaunchToggle.checked = settings.autoLaunch;
  imageProviderSelect.value = settings.imageProvider || "placeholder";
  imageModelInput.value = settings.imageModel || "gpt-image-2";
  imageSizeSelect.value = settings.imageSize || "1024x1024";
  folderPath.textContent = settings.workspaceFolder || "No folder selected";
  leftSideButton.classList.toggle("active", settings.avatarSide === "left");
  rightSideButton.classList.toggle("active", settings.avatarSide === "right");
}

function renderMemories(memories) {
  memoryList.innerHTML = "";

  if (!memories.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No memories yet.";
    memoryList.append(empty);
    return;
  }

  for (const memory of memories) {
    const item = document.createElement("article");
    item.className = "memory-item";

    const content = document.createElement("p");
    content.textContent = memory.content;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      appState.memories = await window.companion.deleteMemory(memory.id);
      renderMemories(appState.memories);
    });

    item.append(content, remove);
    memoryList.append(item);
  }
}

async function updateSettings(patch) {
  appState.settings = await window.companion.updateSettings(patch);
  renderSettings(appState.settings);
}

leftSideButton.addEventListener("click", () => updateSettings({ avatarSide: "left" }));
rightSideButton.addEventListener("click", () => updateSettings({ avatarSide: "right" }));
providerSelect.addEventListener("change", () => updateSettings({ provider: providerSelect.value }));
modelInput.addEventListener("change", () => {
  const value = modelInput.value.trim();
  if (providerSelect.value === "openai") {
    updateSettings({ openaiModel: value || "gpt-5.5" });
  } else {
    updateSettings({ ollamaModel: value || "llama3.1" });
  }
});
openaiKeyInput.addEventListener("change", () => updateSettings({ openaiApiKey: openaiKeyInput.value.trim() }));
personaPromptInput.addEventListener("change", () =>
  updateSettings({ persona: { systemPrompt: personaPromptInput.value.trim() } })
);
proactiveToggle.addEventListener("change", () => updateSettings({ proactiveEnabled: proactiveToggle.checked }));
autoLaunchToggle.addEventListener("change", () => updateSettings({ autoLaunch: autoLaunchToggle.checked }));
memoryComposer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = memoryInput.value.trim();
  if (!content) return;
  appState.memories = await window.companion.addMemory(content);
  memoryInput.value = "";
  renderMemories(appState.memories);
});
clearMemoriesButton.addEventListener("click", async () => {
  try {
    appState.memories = await window.companion.clearMemories();
    renderMemories(appState.memories);
  } catch (error) {
    settingsStatus.textContent = error.message;
  }
});
imageProviderSelect.addEventListener("change", () => updateSettings({ imageProvider: imageProviderSelect.value }));
imageModelInput.addEventListener("change", () =>
  updateSettings({ imageModel: imageModelInput.value.trim() || "gpt-image-2" })
);
imageSizeSelect.addEventListener("change", () => updateSettings({ imageSize: imageSizeSelect.value }));

folderButton.addEventListener("click", async () => {
  const selected = await window.companion.chooseFolder();
  folderPath.textContent = selected || "No folder selected";
});

portraitButton.addEventListener("click", async () => {
  try {
    const record = await window.companion.createSelfPortrait();
    settingsStatus.textContent = `Created: ${record.path}`;
  } catch (error) {
    settingsStatus.textContent = `Portrait failed: ${error.message}`;
  }
});

window.companion.onSettingsUpdated((settings) => {
  appState.settings = settings;
  renderSettings(settings);
});
window.companion.onMemoriesUpdated((memories) => {
  appState.memories = memories;
  renderMemories(memories);
});

window.companion.getState().then((state) => {
  appState = state;
  renderSettings(state.settings);
  renderMemories(state.memories);
});
