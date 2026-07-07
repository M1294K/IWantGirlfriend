const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("companion", {
  getState: () => ipcRenderer.invoke("app:get-state"),
  quit: () => ipcRenderer.invoke("app:quit"),
  sendMessage: (text) => ipcRenderer.invoke("chat:send", text),
  updateSettings: (patch) => ipcRenderer.invoke("settings:update", patch),
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
  onAvatarSay: (callback) => {
    ipcRenderer.on("avatar:say", (_event, text) => callback(text));
  }
});
