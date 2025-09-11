from flask import Flask, render_template, request
from flask_socketio import SocketIO
import threading
import socket

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

@app.route("/")
def index():
    return render_template("index.html")

# --- Socket Events ---

@socketio.on("client_message")
def handle_client_message(data):
    user = data.get("user", "Anonymous")
    text = data.get("text", "")
    print(f"[Browser] {user}: {text}")
    socketio.emit("chat_message", {"user": user, "text": text, "sender": "client"})

def console_input_thread():
    """Reads messages from terminal and sends to all clients."""
    while True:
        msg = input("Server: ")
        socketio.emit("chat_message", {"user": "Server", "text": msg, "sender": "server"})

def get_ip():
    """Find local IP address."""
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
    socketio.run(app, host=host_ip, port=8017)
