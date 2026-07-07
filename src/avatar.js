const avatarButton = document.getElementById("avatarButton");
const speech = document.getElementById("speech");
let speechTimer;

avatarButton.addEventListener("click", () => {
  window.companion.openChat();
});

avatarButton.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  window.companion.showAvatarMenu();
});

function say(text) {
  speech.textContent = text;
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
