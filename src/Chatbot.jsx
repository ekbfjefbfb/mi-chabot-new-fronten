import React, { useState, useEffect, useRef } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "./chatAnimations.css";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [botThinking, setBotThinking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeText, setWelcomeText] = useState("");
  const fileInputRef = useRef(null);

  const welcomeMessages = [
    "Hoy es un gran día para aprender algo nuevo!",
    "Bienvenido, ¿qué vas a crear hoy?",
    "Prepárate para explorar nuevas ideas.",
    "Cada día es una oportunidad para mejorar.",
    "Listo para generar documentos y más!",
    "Inspírate y crea algo asombroso hoy.",
    "¡Hora de ser productivo y creativo!"
  ];

  // -------------------------
  // Mostrar frase de fondo
  // -------------------------
  useEffect(() => {
    const dayIndex = new Date().getDate() % welcomeMessages.length;
    setWelcomeText(welcomeMessages[dayIndex]);
  }, []);

  // -------------------------
  // Agregar mensaje
  // -------------------------
  const addMessage = (text, sender = "bot") => {
    setMessages(prev => [...prev, { text, sender, id: Date.now() + Math.random() }]);
  };

  // -------------------------
  // Enviar mensaje
  // -------------------------
  const sendMessage = async () => {
    if (!input && (!fileInputRef.current || fileInputRef.current.files.length === 0)) return;
    if (input) addMessage(input, "user");

    setInput("");
    setBotThinking(true);
    setShowWelcome(false); // Desaparece frase de fondo al enviar mensaje

    const formData = new FormData();
    formData.append("command", input);
    if (fileInputRef.current) {
      for (let i = 0; i < fileInputRef.current.files.length; i++) {
        formData.append("upload_files", fileInputRef.current.files[i]);
      }
      fileInputRef.current.value = "";
    }

    try {
      const res = await fetch("https://mi-chatbot-backend-6vjk.onrender.com/assistant/stream", {
        method: "POST",
        body: formData,
        headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
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

    } catch (err) {
      console.error(err);
      setBotThinking(false);
      addMessage("❌ Error al conectar con el backend.", "bot");
    }
  };

  // -------------------------
  // Manejo menú de archivos
  // -------------------------
  const handleMenuOption = (type) => {
    setMenuOpen(false);
    if (!fileInputRef.current) return;

    if (type === "gallery") {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.removeAttribute("capture");
    } else if (type === "camera") {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.setAttribute("capture", "environment");
    } else if (type === "file") {
      fileInputRef.current.accept = ".pdf,.docx";
      fileInputRef.current.removeAttribute("capture");
    }
    fileInputRef.current.click();
  };

  return (
    <div className="relative flex flex-col h-screen bg-gray-900 text-white">

      {/* Frase de fondo */}
      {showWelcome && (
        <div className="absolute inset-0 flex justify-center items-center z-0 pointer-events-none">
          <h2 className="text-gray-600 text-center text-xl animate-fade-in">{welcomeText}</h2>
        </div>
      )}

      {/* Título X-AI y menú */}
      <div className="flex justify-between items-center p-4 bg-gray-800 z-10">
        <h1 className="text-2xl font-bold animate-fade-in">X-AI</h1>
        <button onClick={() => setMenuOpen(!menuOpen)} className="px-3 py-2 bg-gray-700 rounded">📂</button>
      </div>

      {/* Chat */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto z-10">
        <TransitionGroup>
          {messages.map(m => (
            <CSSTransition key={m.id} timeout={400} classNames="msg">
              <div className={`max-w-[70%] p-2 rounded-lg ${m.sender==="user" ? "self-end bg-indigo-600" : "self-start bg-gray-700"}`}>
                {m.text}
              </div>
            </CSSTransition>
          ))}
        </TransitionGroup>

        {botThinking && (
          <div className="flex gap-1 self-start mt-1">
            <span className="dot animate-bounce-delay"></span>
            <span className="dot animate-bounce-delay delay-150"></span>
            <span className="dot animate-bounce-delay delay-300"></span>
          </div>
        )}
      </div>

      {/* Footer input */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 z-10">
        <button onClick={() => setMenuOpen(!menuOpen)} className="px-3 py-2 bg-gray-700 rounded">📎</button>
        <input
          type="text"
          className="flex-1 p-2 rounded bg-gray-700 text-white focus:outline-none"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={(e) => { setInput(e.target.value); if(e.target.value) setShowWelcome(false); }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="px-3 py-2 bg-green-600 rounded">➡️</button>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" multiple />

      {/* Menú de archivos */}
      {menuOpen && (
        <div className="absolute bottom-16 left-4 flex flex-col gap-2 bg-gray-700 p-2 rounded shadow-lg z-50">
          <button onClick={() => handleMenuOption("gallery")} className="px-3 py-1 bg-indigo-600 rounded">Galería</button>
          <button onClick={() => handleMenuOption("camera")} className="px-3 py-1 bg-indigo-600 rounded">Cámara</button>
          <button onClick={() => handleMenuOption("file")} className="px-3 py-1 bg-indigo-600 rounded">Archivo</button>
        </div>
      )}

    </div>
  );
}
