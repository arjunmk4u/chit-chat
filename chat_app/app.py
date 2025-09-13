# app.py
from flask import Flask, render_template
from flask_socketio import SocketIO
import socket
import requests
import threading
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
# For dev: use threading so you don't need eventlet installed.
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "deepseek-coder:1.3b"

@app.route("/")
def index():
    return render_template("index.html")

def ask_ollama_and_emit(prompt, temp_id):
    """Background task: call Ollama and emit the reply to clients."""
    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False
            },
            timeout=60
        )
        if resp.status_code == 200:
            reply = resp.json().get("message", {}).get("content", "(no content)")
        else:
            reply = f"⚠️ AI Error ({resp.status_code}): {resp.text}"
    except Exception as e:
        reply = f"⚠️ AI Exception: {str(e)}"

    # Broadcast AI reply. Include temp_id so clients can remove the correct thinking bubble.
    socketio.emit("chat_message", {
        "user": "CoderBot",
        "text": reply,
        "sender": "ai",
        "temp_id": temp_id
    })

@socketio.on("client_message")
def handle_client_message(data):
    user = data.get("user", "Anonymous")
    text = data.get("text", "")
    print(f"[Browser] {user}: {text}")

    # Broadcast the user's message to everyone
    socketio.emit("chat_message", {"user": user, "text": text, "sender": "client"})

    # If user invoked the bot
    if text.strip().startswith("@coder"):
        prompt = text.replace("@coder", "", 1).strip()
        temp_id = str(uuid.uuid4())
        # Ask clients to show thinking bubble (with id)
        socketio.emit("ai_thinking", {"user": "CoderBot", "temp_id": temp_id})
        # Run the blocking request in a background thread/task
        socketio.start_background_task(ask_ollama_and_emit, prompt, temp_id)

def console_input_thread():
    while True:
        msg = input("Server: ")
        socketio.emit("chat_message", {"user": "Server", "text": msg, "sender": "server"})

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

if __name__ == "__main__":
    threading.Thread(target=console_input_thread, daemon=True).start()
    host_ip = get_ip()
    print(f"🌐 Server running at: http://{host_ip}:8017")
    socketio.run(app, host=host_ip, port=8017, debug=True)
