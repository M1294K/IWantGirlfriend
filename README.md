# AI GirlFriend Desktop

Desktop AI companion MVP for Windows.

This project is intentionally a desktop app, not a web app. It uses Electron so the companion can appear as an avatar on the user's screen, open a chat window, store local state, and later run agent-style actions with clear permission boundaries.

## Current Status

Implemented:

- Transparent always-on-top avatar window.
- Avatar speech bubble truncates long messages with `...`.
- Basic avatar expression states based on assistant replies.
- Avatar placement on the lower-left or lower-right side of the screen.
- Avatar click opens the chat window.
- Avatar right-click opens an app menu.
- System tray icon with `Open Chat`, `Avatar Position`, `Settings`, and `Quit`.
- Chat window with local conversation history.
- Separate settings window so chat space stays focused on conversation.
- Quit button in the chat window.
- Chat window size and position persistence.
- Settings window size and position persistence.
- Offline fallback reply mode.
- OpenAI Responses API mode.
- Local OpenAI API key and model settings.
- Optional Ollama local model mode.
- Editable persona system prompt.
- Simple local memory trigger with `remember: ...`, `memo: ...`, or `기억해: ...`.
- Memory management UI for adding, deleting, and clearing local memories.
- User-selected workspace folder.
- Placeholder SVG self-portrait generation into the selected folder.
- Optional OpenAI Images self-portrait generation.
- Approval dialog before agent-created files are written.
- Proactive message scheduler.
- Optional auto-start setting for packaged builds.

Not implemented yet:

- Real image generation provider.
- Live2D, VRM, or sprite-based avatar.
- SQLite memory store.
- Signed installer.

## Requirements

- Windows
- Node.js 22 or newer
- npm

Optional:

- OpenAI API key, if you want cloud model replies.
- OpenAI API key, if you want real image generation.
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

## Optional OpenAI Setup

Select `OpenAI` in the app, paste an API key, and choose a model.

The app calls the OpenAI Responses API directly:

```text
POST https://api.openai.com/v1/responses
```

The current default model is:

```text
gpt-5.5
```

The local persona prompt is sent with the `instructions` parameter. Recent messages are sent through the `input` parameter.

For image generation, select `OpenAI Images` in the Workspace section of Settings. The app calls:

```text
POST https://api.openai.com/v1/images/generations
```

The current default image model is:

```text
gpt-image-2
```

## Agent Safety Model

The intended safety boundary is:

- The app may write inside a user-selected workspace folder.
- Destructive file actions should require explicit approval.
- Access outside the selected workspace should require explicit approval.
- Running external programs should require explicit approval.
- Sending messages, emails, posts, or network actions on the user's behalf should require explicit approval.

The current MVP can create a placeholder SVG or an OpenAI-generated PNG inside the selected folder, and asks for approval before writing it.

## Roadmap

### Phase 1: Desktop Basics

- Tray menu.
- Avatar context menu.
- Quit flow.
- Auto-start setting.
- Window size and position persistence.
- Separate settings window.

Status: implemented.

### Phase 2: AI Providers

- Add OpenAI provider settings.
- Improve Ollama error handling.
- Add persona editing UI.
- Add conversation summarization.

Status: OpenAI provider, provider settings, and persona editing are implemented. Conversation summarization is still pending.

### Phase 3: Avatar

- Replace the CSS avatar with sprite images.
- Add expression states.
- Switch expressions based on reply emotion.
- Evaluate Live2D or VRM later.

Status: basic CSS expression states are implemented. Sprite images, richer emotion detection, and Live2D/VRM are still pending.

### Phase 4: Agent Actions

- Add explicit action approval dialogs.
- Add real image generation through OpenAI Images, Stable Diffusion WebUI, or ComfyUI.
- Store generated asset history.
- Add folder-only file tools.

Status: approval is implemented for self-portrait file actions, and OpenAI Images can generate PNG portraits. Stable Diffusion/ComfyUI and broader file tools are still pending.

### Phase 5: Memory

- Move from JSON storage to SQLite.
- Add long-term memory search.
- Add user-editable memory management.

Status: JSON-backed memory management UI is implemented. SQLite and search are still pending.

## Notes

The repository folder currently uses the original local spelling `AI_Girfriend`. The GitHub repository is `M1294K/IWantGirlfriend`, and the app product name remains `AI GirlFriend`.
