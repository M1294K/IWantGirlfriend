# AI GirlFriend Desktop

Desktop AI companion MVP for Windows.

This project is intentionally a desktop app, not a web app. It uses Electron so the companion can appear as an avatar on the user's screen, open a chat window, store local state, and later run agent-style actions with clear permission boundaries.

## Current Status

Implemented:

- Transparent always-on-top avatar window.
- Avatar placement on the lower-left or lower-right side of the screen.
- Avatar click opens the chat window.
- Avatar right-click opens an app menu.
- System tray icon with `Open Chat`, `Avatar Position`, `Settings`, and `Quit`.
- Chat window with local conversation history.
- Quit button in the chat window.
- Chat window size and position persistence.
- Offline fallback reply mode.
- Optional Ollama local model mode.
- Simple local memory trigger with `remember: ...` or `memo: ...`.
- User-selected workspace folder.
- Placeholder SVG self-portrait generation into the selected folder.
- Proactive message scheduler.
- Optional auto-start setting for packaged builds.

Not implemented yet:

- OpenAI API provider.
- Real image generation provider.
- Live2D, VRM, or sprite-based avatar.
- SQLite memory store.
- Fine-grained approval dialogs for file actions.
- Signed installer.

## Requirements

- Windows
- Node.js 22 or newer
- npm

Optional:

- Ollama, if you want local LLM replies.

## Install

```powershell
npm install
```

## Run In Development

```powershell
npm run dev
```

## Package A Development Build

```powershell
npm run pack
```

The unpacked app is created here:

```text
release/win-unpacked/AI GirlFriend.exe
```

## Optional Ollama Setup

Install Ollama, pull a model, and run it locally.

Example:

```powershell
ollama pull llama3.1
ollama serve
```

Then select `Ollama local` in the app.

Default endpoint:

```text
http://127.0.0.1:11434/api/chat
```

Default model:

```text
llama3.1
```

## Agent Safety Model

The intended safety boundary is:

- The app may write inside a user-selected workspace folder.
- Destructive file actions should require explicit approval.
- Access outside the selected workspace should require explicit approval.
- Running external programs should require explicit approval.
- Sending messages, emails, posts, or network actions on the user's behalf should require explicit approval.

The current MVP only creates a placeholder SVG file inside the selected folder.

## Roadmap

### Phase 1: Desktop Basics

- Tray menu.
- Avatar context menu.
- Quit flow.
- Auto-start setting.
- Window size and position persistence.

Status: mostly implemented.

### Phase 2: AI Providers

- Add OpenAI provider settings.
- Improve Ollama error handling.
- Add persona editing UI.
- Add conversation summarization.

### Phase 3: Avatar

- Replace the CSS avatar with sprite images.
- Add expression states.
- Switch expressions based on reply emotion.
- Evaluate Live2D or VRM later.

### Phase 4: Agent Actions

- Add explicit action approval dialogs.
- Add real image generation through OpenAI Images, Stable Diffusion WebUI, or ComfyUI.
- Store generated asset history.
- Add folder-only file tools.

### Phase 5: Memory

- Move from JSON storage to SQLite.
- Add long-term memory search.
- Add user-editable memory management.

## Notes

The repository folder currently uses the original spelling `AI_Girfriend`. The app product name remains `AI GirlFriend`.
