import React, { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { CHAT_API_URL } from '../config';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './ui/ToastContainer';
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface UserInfo {
  name: string;
  phone: string;
  email: string;
}

const MessengerPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    phone: '',
    email: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
const { toasts, warning } = useToast();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUserInfoSubmit = () => {
    if (!userInfo.name || !userInfo.email) {
     warning('Please provide your name and email');
      return;
    }
    setShowUserForm(false);
    setMessages([
      {
        id: Date.now().toString(),
        text: `Hi ${userInfo.name}! How can I help you today?`,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${CHAT_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: text,
          user_id: userInfo.email
        })
      });

      const data = await response.json();
      // console.log('Chatbot response:', data); // Debug log
      
      if (response.ok && data.answer) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.answer,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response from chatbot');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-[100vw]">
      {/* Messenger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Popup Dialog */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[92vw] sm:w-96 bg-white rounded-lg shadow-xl max-h-[70vh] sm:max-h-[500px] flex flex-col">
          <div className="bg-primary-500 p-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">AOIN Chat Assistant</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {showUserForm ? (
              // User Information Form
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="bg-gray-100 p-3 rounded-lg mb-4">
                  <p className="font-semibold">AOIN</p>
                  <p className="text-sm text-gray-600">
                    Welcome to AOIN! Please provide your information to start chatting.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Name *"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-primary-500"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-primary-500"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2 border-b border-gray-300 focus:outline-none focus:border-primary-500"
                />
                <button
                  onClick={handleUserInfoSubmit}
                  className="w-full py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Start Chat
                </button>
              </div>
            ) : (
              // Chat Interface
              <>
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
                >
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <p className="text-sm">Typing...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 sm:p-4 border-t">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 p-2 border rounded-lg focus:outline-none focus:border-primary-500"
                    />
                    <button
                      onClick={() => sendMessage(inputMessage)}
                      disabled={isLoading || !inputMessage.trim()}
                      className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default MessengerPopup; 