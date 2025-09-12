import requests

def ollama_chat(model="deepseek-coder:1.3b"):
    print(f"🤖 Chatbot started (using {model}). Type 'exit' to quit.\n")

    history = []  # store conversation history

    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            print("👋 Goodbye!")
            break

        # Append user input to history
        history.append({"role": "user", "content": user_input})

        # Send request to Ollama API
        response = requests.post(
            "http://localhost:11434/api/chat",
            json={
                "model": model,
                "messages": history,
                "stream": False
            }
        )

        if response.status_code == 200:
            reply = response.json()["message"]["content"]
            print(f"Bot: {reply}\n")
            # Save bot reply to history
            history.append({"role": "assistant", "content": reply})
        else:
            print("⚠️ Error:", response.text)

if __name__ == "__main__":
    ollama_chat("deepseek-coder:1.3b")  # you can replace with mistral, phi, etc.
