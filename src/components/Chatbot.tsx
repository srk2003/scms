import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: 'Hello! I am your Smart Campus Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessages(prev => [...prev, { role: 'ai', content: 'Please log in to use the chatbot.' }]);
        setLoading(false);
        return;
      }

      // Fetch context from backend
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();
      
      if (res.ok) {
        try {
          // Initialize Gemini AI
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userMessage,
            config: {
              systemInstruction: data.context,
            }
          });
          
          setMessages(prev => [...prev, { role: 'ai', content: response.text || 'Sorry, I could not generate a response.' }]);
        } catch (aiError: any) {
          console.error('Gemini AI error:', aiError);
          if (aiError?.message?.includes('API key not valid')) {
            if (process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
              setMessages(prev => [...prev, { role: 'ai', content: 'You have entered the placeholder "MY_GEMINI_API_KEY" in your Secrets panel. Please delete it to use the free key, or enter a real API key.' }]);
            } else {
              setMessages(prev => [...prev, { role: 'ai', content: 'The provided Gemini API key is invalid. Please check your Secrets panel configuration.' }]);
            }
          } else {
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error generating the response.' }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: data.error || 'Sorry, I encountered an error processing your request.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Network error. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full glass-panel flex items-center justify-center bg-gradient-to-tr from-blue-500/50 to-purple-500/50 shadow-lg shadow-purple-500/20 z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare className="text-white" size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] glass-panel bg-slate-900/80 flex flex-col z-50 overflow-hidden shadow-2xl shadow-purple-900/50 border border-white/20"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              <div className="flex items-center gap-2">
                <Bot className="text-purple-300" />
                <h3 className="font-semibold text-white">Smart Campus AI</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-blue-500/30 text-blue-50 rounded-tr-sm border border-blue-500/20' 
                      : 'bg-white/10 text-gray-200 rounded-tl-sm border border-white/10'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-2xl rounded-tl-sm border border-white/10 flex gap-1 items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="w-full glass-input pr-12 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 p-2 text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
