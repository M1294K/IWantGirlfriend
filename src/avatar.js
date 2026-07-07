const avatarButton = document.getElementById("avatarButton");
const speech = document.getElementById("speech");
const avatar = document.getElementById("avatar");
const SPEECH_LIMIT = 88;
let speechTimer;

avatarButton.addEventListener("click", () => {
  window.companion.openChat();
});

avatarButton.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  window.companion.showAvatarMenu();
});

function truncateSpeech(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= SPEECH_LIMIT) return normalized;
  return `${normalized.slice(0, SPEECH_LIMIT - 3).trimEnd()}...`;
}

function moodFromText(text) {
  const lower = String(text || "").toLowerCase();
  if (lower.includes("error") || lower.includes("failed") || lower.includes("problem")) {
    return "mood-alert";
  }
  if (lower.includes("?")) {
    return "mood-curious";
  }
  if (
    lower.includes("good") ||
    lower.includes("great") ||
    lower.includes("nice") ||
    lower.includes("love") ||
    lower.includes("happy")
  ) {
    return "mood-happy";
  }
  return "mood-neutral";
}

function setMood(text) {
  avatar.classList.remove("mood-neutral", "mood-happy", "mood-curious", "mood-alert");
  avatar.classList.add(moodFromText(text));
}

function say(text) {
  const fullText = String(text || "").trim();
  speech.textContent = truncateSpeech(fullText);
  speech.title = fullText;
  setMood(fullText);
  speech.classList.add("visible");
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => {
    speech.classList.remove("visible");
  }, 8000);
}

window.companion.onAvatarSay((text) => say(text));

window.companion.getState().then((state) => {
  const last = state.messages.filter((message) => message.role === "assistant").at(-1);
  if (last) say(last.content);
});
