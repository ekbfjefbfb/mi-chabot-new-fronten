import React, { useState, useEffect, useRef } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "./chatAnimations.css";

const BACKEND_URL = "https://mi-chatbot-backend-6vjk.onrender.com/assistant/stream";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [botThinking, setBotThinking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [welcomeText, setWelcomeText] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const fileInputRef = useRef();

  const welcomeMessages = [
    "Hoy es un gran día para aprender algo nuevo!",
    "Bienvenido, ¿qué vas a crear hoy?",
    "Prepárate para explorar nuevas ideas.",
    "Cada día es una oportunidad para mejorar.",
    "Listo para generar documentos y más!",
    "Inspírate y crea algo asombroso hoy.",
    "¡Hora de ser productivo y creativo!"
  ];

  useEffect(() => {
    const dayIndex = new Date().getDate() % welcomeMessages.length;
    setWelcomeText(welcomeMessages[dayIndex]);
  }, []);

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { text, sender, id: Date.now() }]);
  };

  const sendMessage = async () => {
    if (!input.trim() && (!fileInputRef.current || fileInputRef.current.files.length === 0)) return;

    if (input.trim()) addMessage(input, "user");
    setInput("");
    setBotThinking(true);
    setShowWelcome(false);

    const formData = new FormData();
    formData.append("command", input);
    if (fileInputRef.current) {
      Array.from(fileInputRef.current.files).forEach(file =>
        formData.append("upload_files", file)
      );
      fileInputRef.current.value = "";
    }

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let botText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        botText += decoder.decode(value);
        setMessages(prev => {
          const filtered = prev.filter(m => m.sender !== "bot-temp");
          return [...filtered, { text: botText, sender: "bot-temp", id: Date.now() }];
        });
      }

      setBotThinking(false);
      setMessages(prev => {
        const filtered = prev.filter(m => m.sender !== "bot-temp");
        return [...filtered, { text: botText, sender: "bot", id: Date.now() }];
      });
    } catch {
      setBotThinking(false);
      addMessage("❌ Error al conectar con el backend.", "bot");
    }
  };

  const handleFileMenu = (type) => {
    setMenuOpen(false);
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = type === "file" ? ".pdf,.docx" : "image/*";
    type === "camera" && fileInputRef.current.setAttribute("capture", "environment");
    fileInputRef.current.click();
  };

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {showWelcome && (
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <h2 className="text-gray-500 animate-fade-in">{welcomeText}</h2>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 z-10">
        <h1 className="text-xl font-bold">X-AI</h1>
        <button onClick={() => setMenuOpen(!menuOpen)} className="px-3 py-2 bg-gray-700 rounded">📂</button>
      </div>

      {/* Chat Box */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 z-10">
        <TransitionGroup>
          {messages.map(m => (
            <CSSTransition key={m.id} timeout={400} classNames="msg">
              <div className={`max-w-[75%] p-3 rounded-lg ${m.sender === "user" ? "self-end bg-indigo-600" : "self-start bg-gray-700"}`}>
                {m.text}
              </div>
            </CSSTransition>
          ))}
        </TransitionGroup>
        {botThinking && (
          <div className="flex gap-1 self-start">
            <span className="dot animate-bounce-delay"></span>
            <span className="dot animate-bounce-delay delay-150"></span>
            <span className="dot animate-bounce-delay delay-300"></span>
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="flex items-center p-2 bg-gray-900 gap-2 z-10">
        <button onClick={() => handleFileMenu("gallery")} className="px-3 py-2 bg-gray-700 rounded">📎</button>
        <input
          className="flex-1 p-2 bg-gray-800 rounded text-white"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={e => { setInput(e.target.value); if (e.target.value.trim()) setShowWelcome(false); }}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="px-3 py-2 bg-green-600 rounded">➡️</button>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" multiple />

      {/* File menu */}
      {menuOpen && (
        <div className="absolute bottom-16 left-4 flex flex-col bg-gray-800 p-2 rounded-md z-50">
          <button onClick={() => handleFileMenu("gallery")} className="py-1 px-2 hover:bg-gray-700">Galería</button>
          <button onClick={() => handleFileMenu("camera")} className="py-1 px-2 hover:bg-gray-700">Cámara</button>
          <button onClick={() => handleFileMenu("file")} className="py-1 px-2 hover:bg-gray-700">Archivos (PDF/Word)</button>
        </div>
      )}
    </div>
  );
}
