const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("companion", {
  getState: () => ipcRenderer.invoke("app:get-state"),
  quit: () => ipcRenderer.invoke("app:quit"),
  openSettings: () => ipcRenderer.invoke("app:open-settings"),
  sendMessage: (text) => ipcRenderer.invoke("chat:send", text),
  updateSettings: (patch) => ipcRenderer.invoke("settings:update", patch),
  addMemory: (content) => ipcRenderer.invoke("memory:add", content),
  deleteMemory: (memoryId) => ipcRenderer.invoke("memory:delete", memoryId),
  clearMemories: () => ipcRenderer.invoke("memory:clear"),
  chooseFolder: () => ipcRenderer.invoke("settings:choose-folder"),
  createSelfPortrait: () => ipcRenderer.invoke("agent:create-self-portrait"),
  openChat: () => ipcRenderer.send("avatar:open-chat"),
  showAvatarMenu: () => ipcRenderer.invoke("avatar:show-menu"),
  onMessagesUpdated: (callback) => {
    ipcRenderer.on("messages:updated", (_event, messages) => callback(messages));
  },
  onSettingsUpdated: (callback) => {
    ipcRenderer.on("settings:updated", (_event, settings) => callback(settings));
  },
  onMemoriesUpdated: (callback) => {
    ipcRenderer.on("memories:updated", (_event, memories) => callback(memories));
  },
  onAvatarSay: (callback) => {
    ipcRenderer.on("avatar:say", (_event, text) => callback(text));
  }
});
