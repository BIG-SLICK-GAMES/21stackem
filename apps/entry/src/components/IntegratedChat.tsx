import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Users, Minimize2, Maximize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface IntegratedChatProps {
  userId: string;
}

export default function IntegratedChat({ userId }: IntegratedChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages for demonstration
  useEffect(() => {
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        username: 'ProGamer123',
        message: 'Anyone up for a game of Hold\'em?',
        timestamp: new Date(Date.now() - 300000),
        isOwn: false
      },
      {
        id: '2',
        username: 'ChipMaster',
        message: 'Just won big on Stack\'em! 🎉',
        timestamp: new Date(Date.now() - 240000),
        isOwn: false
      },
      {
        id: '3',
        username: 'You',
        message: 'Nice! I\'m trying to build up my bankroll',
        timestamp: new Date(Date.now() - 180000),
        isOwn: true
      },
      {
        id: '4',
        username: 'LuckyPlayer',
        message: 'The new Poker\'oply game looks interesting',
        timestamp: new Date(Date.now() - 120000),
        isOwn: false
      }
    ];
    setMessages(mockMessages);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      username: 'You',
      message: newMessage,
      timestamp: new Date(),
      isOwn: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl shadow-xl shadow-orange-500/10 overflow-hidden">
      {/* Modern Glass Header */}
      <div className="relative h-16 bg-gradient-to-r from-gray-800/60 via-gray-700/40 to-gray-800/60 backdrop-blur-xl border-b border-white/10 rounded-t-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg">Friends Chat</h3>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10"></div>
        {/* Subtle chat indicators */}
        <div className="absolute top-4 right-6 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping"></div>
      </div>
      
      <div className="flex items-center justify-between p-4 border-b border-orange-500/20">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs">4 online</span>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 text-gray-400 hover:text-white transition-colors touch-manipulation"
        >
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div className="h-64 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.isOwn
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                      : 'bg-gray-700/50 text-white'
                  }`}
                >
                  {!message.isOwn && (
                    <div className="text-xs text-orange-400 font-semibold mb-1">
                      {message.username}
                    </div>
                  )}
                  <div className="text-sm">{message.message}</div>
                  <div className={`text-xs mt-1 ${message.isOwn ? 'text-orange-200' : 'text-gray-400'}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-orange-500/20">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500/50 text-sm shadow-inner"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-2 rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-400/20 touch-manipulation"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}