import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId] = useState(() => {
    // Store userId in localStorage to persist across page refreshes
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) return storedUserId;
    
    const newUserId = uuidv4();
    localStorage.setItem('userId', newUserId);
    return newUserId;
  });
  const chatEndRef = useRef(null);
  const [aiTyping, setAiTyping] = useState("");

  // ✅ BACKEND URL (Render)
  const API_URL = "https://ai-agenttestingbackend.onrender.com";

  // Configure axios to handle credentials
  axios.defaults.withCredentials = true;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        console.log("Loading chat history for user:", userId);
        const res = await axios.post(`${API_URL}/api/history`, 
          { userId },
          { 
            timeout: 10000,
            withCredentials: true 
          }
        );
        
        if (res.data && res.data.messages) {
          setMessages(res.data.messages);
          console.log("History loaded successfully");
        }
      } catch (err) {
        console.error("Error loading history:", err);
        if (err.code === "ERR_NETWORK") {
          console.log("Network error - please check backend connection");
        }
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
      const res = await axios.post(`${API_URL}/api/ask`, 
        {
          prompt: input,
          userId,
        },
        {
          timeout: 30000,
          withCredentials: true
        }
      );

      const reply = res.data.reply;

      typeMessage(reply, () => {
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        setAiTyping("");
        setLoading(false);
      });
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Sorry, something went wrong. Please try again." },
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

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('userId');
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🤖 AI Agent with Chat History</h1>
        <button onClick={clearChat} style={styles.clearButton}>
          Clear Chat
        </button>
      </div>

      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <div style={styles.welcomeMessage}>
            Welcome! Start a conversation with the AI assistant.
          </div>
        )}
        
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
            <div>{aiTyping}<span style={styles.cursor}>▋</span></div>
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
          disabled={loading}
        />
        <button onClick={sendPrompt} disabled={loading || !input.trim()} style={styles.button}>
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  clearButton: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#dc3545",
    color: "white",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  chatBox: {
    flexGrow: 1,
    overflowY: "auto",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "1rem",
    background: "#f9f9f9",
    marginBottom: "1rem",
  },
  welcomeMessage: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    padding: "2rem",
  },
  message: {
    marginBottom: "1rem",
    padding: "0.75rem",
    borderRadius: "8px",
    maxWidth: "75%",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
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
    fontSize: "0.9rem",
  },
  inputContainer: {
    display: "flex",
    gap: "0.5rem",
  },
  input: {
    flexGrow: 1,
    borderRadius: "8px",
    border: "1px solid #ccc",
    padding: "0.75rem",
    resize: "none",
    fontFamily: "inherit",
  },
  button: {
    padding: "0.75rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
    minWidth: "80px",
  },
  cursor: {
    animation: "blink 1s infinite",
  },
};

// Add CSS for blinking cursor
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`, styleSheet.cssRules.length);

export default App;