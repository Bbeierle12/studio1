'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare,
  X,
  Send,
  Mic, 
  MicOff,
  Loader2,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  ChefHat,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface AIChatAssistantProps {
  weather?: {
    temperature: number;
    condition: string;
    humidity?: number;
  } | null;
}

export function AIChatAssistant({ weather }: AIChatAssistantProps) {
  // UI State - Controls the display state of the chat interface
  const [isOpen, setIsOpen] = useState(false); // false = floating button, true = chat window
  const [isMinimized, setIsMinimized] = useState(false); // true = minimized header only
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      text: 'Hi! I\'m your AI cooking assistant. I can help you with recipes, meal planning, cooking tips, and more. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  
  // Input State
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice State
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          handleSendMessage(transcript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
      
      // Initialize speech synthesis
      if ('speechSynthesis' in window) {
        synthesisRef.current = window.speechSynthesis;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);
  
  // Toggle voice listening
  const toggleVoiceListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
      }
    }
  };
  
  // Speak text
  const speakText = (text: string) => {
    if (!audioEnabled || !synthesisRef.current) return;
    
    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    synthesisRef.current?.cancel();
    setIsSpeaking(false);
  };
  
  // Handle sending message
  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const response = generateAIResponse(messageText);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        text: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      
      // Speak response if audio is enabled
      if (audioEnabled) {
        speakText(response);
      }
    }, 1000);
  };
  
  // Generate AI response (placeholder - replace with actual AI API)
  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Timer requests
    if (lowerMessage.includes('timer') || lowerMessage.includes('set a timer')) {
      const minutes = lowerMessage.match(/(\d+)\s*(minute|min)/i);
      if (minutes) {
        return `I've set a timer for ${minutes[1]} minutes. I'll let you know when it's done!`;
      }
      return "How long should I set the timer for?";
    }
    
    // Recipe suggestions
    if (lowerMessage.includes('recipe') || lowerMessage.includes('cook') || lowerMessage.includes('make')) {
      if (weather && weather.temperature > 75) {
        return "Since it's warm today, how about a refreshing summer salad or some grilled chicken? I can help you find the perfect recipe!";
      }
      return "I'd love to help you find a recipe! What type of food are you in the mood for? Italian, Mexican, Asian, or something else?";
    }
    
    // Cooking tips
    if (lowerMessage.includes('how to') || lowerMessage.includes('tip')) {
      return "I'm here to help! Could you be more specific about what cooking technique or tip you'd like to know about?";
    }
    
    // Weather-based suggestions
    if (lowerMessage.includes('weather') || lowerMessage.includes('today')) {
      if (weather) {
        return `It's ${Math.round(weather.temperature)}°F and ${weather.condition.toLowerCase()} today. ${
          weather.temperature > 75 
            ? "Perfect weather for light meals like salads, grilled dishes, or cold pasta!"
            : "Great day for comfort food like soups, stews, or casseroles!"
        }`;
      }
      return "I can suggest recipes based on the weather! What type of meal are you planning?";
    }
    
    // Default response
    return "I'm here to help with recipes, cooking tips, meal planning, and more! What would you like to know?";
  };
  
  // Handle input key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Floating chat button (when closed)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white relative"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
        </Button>
        <div className="absolute -top-12 right-0 bg-black/75 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
          Chat with AI Assistant
        </div>
      </div>
    );
  }
  
  // Minimized chat window
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="shadow-2xl border-2 border-orange-500/50">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              <span className="font-semibold text-sm">AI Assistant</span>
              {isSpeaking && (
                <Volume2 className="h-3 w-3 animate-pulse" />
              )}
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0 hover:bg-white/20 text-white"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 hover:bg-white/20 text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  // Full chat window
  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <Card className="shadow-2xl border-2 border-orange-500/50 flex flex-col h-[600px] max-h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">AI Cooking Assistant</h3>
              <p className="text-xs opacity-90">Always here to help</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="h-8 w-8 p-0 hover:bg-white/20 text-white"
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 p-0 hover:bg-white/20 text-white"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-white/20 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Weather bar */}
        {weather && (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-b text-sm flex items-center justify-between">
            <span className="text-muted-foreground">
              🌤️ {Math.round(weather.temperature)}°F - {weather.condition}
            </span>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Weather-Aware
            </Badge>
          </div>
        )}
        
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 shadow-sm",
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input area */}
        <div className="p-4 border-t space-y-2">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening..." : "Type your message..."}
              className="flex-1"
              disabled={isListening}
            />
            <Button
              size="icon"
              onClick={toggleVoiceListening}
              variant={isListening ? "destructive" : "outline"}
              className={cn(isListening && "animate-pulse")}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isListening}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Press Enter to send</span>
            {voiceMode && (
              <Badge variant="secondary" className="text-xs">
                <Mic className="h-3 w-3 mr-1" />
                Voice Mode
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AIChatAssistant;
