import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId] = useState(() => uuidv4());
  const chatEndRef = useRef(null);
  const [aiTyping, setAiTyping] = useState("");

  // 🌐 BACKEND URL (Render)
  const API_URL = "https://ai-agenttestingbackend.onrender.com";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/history`, { userId });
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Error loading history:", err);
      }
    };
    loadHistory();
  }, [userId]);

  const typeMessage = (text, callback) => {
    let index = 0;
    setAiTyping("");
    const interval = setInterval(() => {
      setAiTyping((prev) => prev + text[index]);
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        callback();
      }
    }, 25);
  };

  const sendPrompt = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/ask`, {
        prompt: input,
        userId,
      });

      const reply = res.data.reply;

      typeMessage(reply, () => {
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        setAiTyping("");
        setLoading(false);
      });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Sorry, something went wrong." },
      ]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>🤖 AI Agent with Chat History</h1>

      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              ...(msg.role === "user" ? styles.userMsg : styles.aiMsg),
            }}
          >
            <div style={styles.msgRole}>
              {msg.role === "user" ? "🧑 You" : "🤖 AI"}
            </div>
            <div>{msg.content}</div>
          </div>
        ))}

        {aiTyping && (
          <div style={{ ...styles.message, ...styles.aiMsg }}>
            <div style={styles.msgRole}>🤖 AI</div>
            <div>{aiTyping}<span className="cursor">▋</span></div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div style={styles.inputContainer}>
        <textarea
          rows="2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message and press Enter..."
          style={styles.input}
        />
        <button onClick={sendPrompt} disabled={loading} style={styles.button}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "system-ui, sans-serif",
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  header: {
    textAlign: "center",
    marginBottom: "1rem",
  },
  chatBox: {
    flexGrow: 1,
    overflowY: "auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "1rem",
    background: "#f9f9f9",
  },
  message: {
    marginBottom: "1rem",
    padding: "0.75rem",
    borderRadius: "8px",
    maxWidth: "75%",
    whiteSpace: "pre-wrap",
  },
  userMsg: {
    alignSelf: "flex-end",
    background: "#d1e7dd",
    marginLeft: "auto",
  },
  aiMsg: {
    alignSelf: "flex-start",
    background: "#e2e3e5",
    marginRight: "auto",
  },
  msgRole: {
    fontWeight: "bold",
    marginBottom: "0.25rem",
  },
  inputContainer: {
    display: "flex",
    marginTop: "1rem",
    gap: "0.5rem",
  },
  input: {
    flexGrow: 1,
    borderRadius: "8px",
    border: "1px solid #ccc",
    padding: "0.75rem",
    resize: "none",
  },
  button: {
    padding: "0.75rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
  },
};

export default App;
