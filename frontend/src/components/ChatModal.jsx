import { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatModal({ meeting, onClose }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await api.post(`/meetings/${meeting._id}/chat`, { query: userMessage });
            setMessages(prev => [...prev, { role: 'bot', content: res.data.answer }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', content: 'Whoops. The AI service crashed or is unavailable.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white border-4 border-black shadow-neo w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b-4 border-black flex justify-between items-center bg-neo-yellow z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black border-2 border-black">
                            <Bot className="h-6 w-6 text-neo-yellow" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-black uppercase tracking-tight truncate pr-4">
                                Automator AI
                            </h3>
                            <p className="text-xs font-bold text-black/80 uppercase truncate">
                                Context: {meeting.title}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-black border-2 border-transparent hover:bg-black hover:text-neo-yellow transition-colors focus:outline-none"
                    >
                        <X className="h-6 w-6" strokeWidth={3} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-6 overflow-y-auto bg-neo-bg flex flex-col gap-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-black/50">
                            <Bot className="h-12 w-12 mb-4" strokeWidth={1.5} />
                            <p className="text-sm font-bold uppercase text-center max-w-sm">Ask me anything about the "{meeting.title}" transcript.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`shrink-0 h-10 w-10 border-2 border-black flex items-center justify-center ${msg.role === 'user' ? 'bg-neo-blue' : 'bg-neo-pink'}`}>
                                        {msg.role === 'user' ? <User className="h-5 w-5 text-black" strokeWidth={2.5} /> : <Bot className="h-5 w-5 text-black" strokeWidth={2.5} />}
                                    </div>
                                    <div className={`px-4 py-3 border-2 border-black shadow-neo-sm text-sm font-medium ${msg.role === 'user' ? 'bg-neo-blue text-black' : 'bg-white text-black'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="shrink-0 h-10 w-10 border-2 border-black bg-neo-pink flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 text-black animate-spin" strokeWidth={2.5} />
                                </div>
                                <div className="px-4 py-3 border-2 border-black shadow-neo-sm bg-white text-black text-sm font-bold uppercase flex items-center">
                                    Thinking...
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t-4 border-black">
                    <form onSubmit={handleSend} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 border-4 border-black py-3 px-4 text-black shadow-neo-sm focus:outline-none focus:ring-0 focus:translate-x-1 focus:translate-y-1 focus:shadow-none transition-all font-medium sm:text-base"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="flex items-center justify-center bg-neo-green border-4 border-black px-6 shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-black"
                        >
                            <Send className="h-6 w-6" strokeWidth={2.5} />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
