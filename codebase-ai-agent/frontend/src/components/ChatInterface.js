import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, FileText, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatInterface = ({ selectedRepository }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedRepository) {
      loadSuggestions();
      // Start fresh conversation when repository changes
      setMessages([]);
      setSessionId(null);
    }
  }, [selectedRepository]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`/api/chat/suggestions?repository=${selectedRepository}`);
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.data.suggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const sendMessage = async (message = inputValue) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: message,
          sessionId: sessionId,
          repository: selectedRepository
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.data.response,
          sources: data.data.sources,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setSessionId(data.data.sessionId);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderMessage = (message) => {
    const isUser = message.type === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-blue-600' : message.error ? 'bg-red-500' : 'bg-gray-600'
            }`}>
              {isUser ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
          
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-lg px-4 py-2 ${
              isUser 
                ? 'bg-blue-600 text-white' 
                : message.error 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-white border border-gray-200'
            }`}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={tomorrow}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimestamp(message.timestamp)}
            </div>
            
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 max-w-md">
                <p className="text-xs text-gray-600 mb-1">Sources:</p>
                <div className="space-y-1">
                  {message.sources.slice(0, 3).map((source, index) => (
                    <div key={index} className="flex items-center text-xs bg-gray-50 rounded px-2 py-1">
                      <FileText className="w-3 h-3 mr-1 text-gray-400" />
                      <span className="truncate">{source.fileName}</span>
                      <span className="ml-auto text-gray-400">
                        {Math.round(source.score * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {selectedRepository ? `Chat with ${selectedRepository}` : 'Codebase AI Assistant'}
            </h1>
            <p className="text-sm text-gray-600">
              Ask questions about the codebase, setup, architecture, and more
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && !selectedRepository && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to Codebase AI Agent
            </h3>
            <p className="text-gray-600 mb-4">
              Please select a repository from the sidebar to start chatting
            </p>
          </div>
        )}

        {messages.length === 0 && selectedRepository && suggestions.length > 0 && (
          <div className="max-w-2xl mx-auto py-8">
            <div className="text-center mb-6">
              <Bot className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Hi! I'm ready to help with {selectedRepository}
              </h3>
              <p className="text-gray-600">
                Here are some questions you can ask to get started:
              </p>
            </div>
            
            <div className="grid gap-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm text-gray-700">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(renderMessage)}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedRepository ? "Ask about the codebase..." : "Please select a repository first"}
              disabled={!selectedRepository || isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || !selectedRepository || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
