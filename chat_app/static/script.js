var socket = io();
var username = "Anonymous";
var unreadCount = 0;
var originalTitle = document.title;

// Escape HTML to display literally
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Set or update username
function setName() {
  var nameInput = document.getElementById("username").value.trim();
  if (nameInput !== "") {
    username = nameInput;
  } else {
    username = "Anonymous";
  }
  // Update status text below navbar
  var statusDiv = document.getElementById("chat-status");
  if (statusDiv) {
    statusDiv.textContent = `You're currently chatting as: ${username}`;
  }
}

// Update document title for unread messages
function updateTitle() {
  if (unreadCount > 0) {
    document.title = `(${unreadCount}) Chit Live`;
  } else {
    document.title = originalTitle;
  }
}

// Send chat message
function sendMessage() {
  var text = document.getElementById("msg").value;
  if (text.trim() !== "") {
    socket.emit("client_message", { user: username, text: text });
    document.getElementById("msg").value = "";
  }
}

// Run after DOM loaded
window.onload = function () {
  var msgBox = document.getElementById("msg");
  var usernameInput = document.getElementById("username");

  // Handle Enter key (Shift+Enter for newline)
  msgBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  // Update username dynamically as user types
  usernameInput.addEventListener("input", setName);

  // Receive messages
  socket.on("chat_message", function (data) {
    const chat = document.getElementById("chat");
    const div = document.createElement("div");
    div.className = "msg " + data.sender;

    const safeUser = escapeHTML(data.user);
    const safeText = escapeHTML(data.text);

    // Username on top, message content below
    div.innerHTML = `<div class="msg-user">${safeUser}</div><div class="msg-content">${safeText}</div>`;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;

    if (document.hidden) {
      unreadCount++;
      updateTitle();
    }
  });

  // Reset unread count when tab is visible
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      unreadCount = 0;
      updateTitle();
    }
  });

  // Initialize status text
  setName();
};
