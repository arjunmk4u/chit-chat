// static/script.js
const socket = io();
let username = "Anonymous";
let unreadCount = 0;
const originalTitle = document.title;

function escapeHTML(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function scrollToBottom() {
  const chat = document.getElementById("chat");
  chat.scrollTop = chat.scrollHeight;
}

function setName() {
  const input = document.getElementById("username");
  username = (input && input.value.trim()) || "Anonymous";
  const statusDiv = document.getElementById("chat-status");
  if (statusDiv) statusDiv.textContent = `You're currently chatting as: ${username}`;
}

function updateTitle() {
  document.title = unreadCount > 0 ? `(${unreadCount}) Chit Live` : originalTitle;
}

function sendMessage() {
  const msgBox = document.getElementById("msg");
  const text = (msgBox.value || "").trim();
  if (!text) return;
  socket.emit("client_message", { user: username, text });
  msgBox.value = "";
}

// Create a thinking bubble with a temp id (so multiple AIs concurrently are supported)
function showThinking(temp_id) {
  if (!temp_id) temp_id = "default";
  const id = `ai-thinking-${temp_id}`;
  if (document.getElementById(id)) return;

  const chat = document.getElementById("chat");
  const thinking = document.createElement("div");
  thinking.classList.add("msg", "ai-thinking");
  thinking.id = id;

  thinking.innerHTML = `
    <div class="msg-user">CoderBot</div>
    <div class="msg-content">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  chat.appendChild(thinking);
  scrollToBottom();
}

function removeThinking(temp_id) {
  if (temp_id) {
    const el = document.getElementById(`ai-thinking-${temp_id}`);
    if (el) el.remove();
  } else {
    // remove any thinking bubbles
    document.querySelectorAll(".ai-thinking").forEach(e => e.remove());
  }
}

function appendMessage(user, text, sender) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.innerHTML = `<div class="msg-user">${escapeHTML(user)}</div><div class="msg-content">${escapeHTML(text)}</div>`;
  chat.appendChild(div);
  scrollToBottom();
}

// socket listeners
socket.on("connect", () => {
  console.log("connected to socket server");
});

socket.on("ai_thinking", (data) => {
  showThinking(data && data.temp_id);
});

socket.on("chat_message", (data) => {
  // If it's from AI, remove the related thinking bubble first
  if (data.sender === "ai") {
    removeThinking(data.temp_id);
    appendMessage(data.user || "CoderBot", data.text || "", "ai");
  } else {
    appendMessage(data.user || "Anonymous", data.text || "", data.sender || "server");
  }

  if (document.hidden) {
    unreadCount++;
    updateTitle();
  }
});

// visibilitychange -> reset unread
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    unreadCount = 0;
    updateTitle();
  }
});

// DOM ready setup
window.addEventListener("DOMContentLoaded", () => {
  const msgBox = document.getElementById("msg");
  const nameInput = document.getElementById("username");

  // Enter to send, Shift+Enter newline
  msgBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  nameInput.addEventListener("input", setName);

  setName();
});
