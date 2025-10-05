'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUnit } from '@/context/unit-context';
import { useShoppingList } from '@/context/shopping-list-context';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ChefHat, 
  Clock, 
  Calculator,
  BookOpen,
  Lightbulb,
  ShoppingCart,
  Ruler,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  X,
  Minimize2
} from 'lucide-react';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  currentRecipe?: {
    id: string;
    title: string;
    ingredients: string;
    instructions: string;
  } | null;
  onTimerRequest?: (minutes: number, label: string) => void;
  className?: string;
  weather?: {
    temperature: number;
    condition: string;
    humidity?: number;
  } | null;
}

interface AssistantMessage {
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export function VoiceAssistant({ currentRecipe, onTimerRequest, className = '', weather }: VoiceAssistantProps) {
  // Context hooks
  const { unit, toggleUnit, setUnit } = useUnit();
  const { addIngredients, getItemsCount, getListAsText } = useShoppingList();
  
  // Core state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  
  // Web API references
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Voice settings
  const [voiceSettings, setVoiceSettings] = useState({
    voice: null as SpeechSynthesisVoice | null,
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8
  });

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          console.log('🎤 Voice recognition started');
          setIsListening(true);
        };
        
        recognition.onend = () => {
          console.log('🎤 Voice recognition ended');
          setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
          console.error('🚫 Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setCurrentTranscript(interimTranscript);
          
          if (finalTranscript) {
            handleVoiceCommand(finalTranscript.trim());
          }
        };
        
        recognitionRef.current = recognition;
      }
      
      // Initialize speech synthesis
      if ('speechSynthesis' in window) {
        synthesisRef.current = window.speechSynthesis;
        
        // Load voices
        const loadVoices = () => {
          const voices = synthesisRef.current?.getVoices() || [];
          const preferredVoice = voices.find((voice: SpeechSynthesisVoice) => 
            voice.name.includes('Samantha') || // macOS
            voice.name.includes('Microsoft Zira') || // Windows
            voice.name.includes('Google US English Female') // Chrome
          ) || voices.find((voice: SpeechSynthesisVoice) => voice.lang.startsWith('en')) || voices[0];
          
          setVoiceSettings((prev: typeof voiceSettings) => ({ ...prev, voice: preferredVoice }));
        };
        
        if (synthesisRef.current.getVoices().length > 0) {
          loadVoices();
        } else {
          synthesisRef.current.onvoiceschanged = loadVoices;
        }
      }
      
      setIsEnabled(true);
    }
  }, []);

  // Handle voice commands
  const handleVoiceCommand = useCallback(async (command: string) => {
    console.log('🗣️ Voice command:', command);
    
    addMessage('user', command);
    setCurrentTranscript('');
    
    // Stop listening while processing
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    try {
      const response = await processVoiceCommand(command);
      addMessage('assistant', response);
      speak(response);
    } catch (error) {
      console.error('Command processing error:', error);
      const errorMsg = "Sorry, I couldn't process that command. Could you try again?";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    }
  }, [isListening, currentRecipe, unit, addIngredients, getItemsCount, getListAsText, setUnit]);

  // Process voice commands with AI - Enhanced routing system
  const processVoiceCommand = async (command: string): Promise<string> => {
    const lowerCommand = command.toLowerCase();
    
    // Priority command routing system
    const commandRoutes = [
      { 
        patterns: ['what should i cook', 'recipe suggestion', 'what to make', 'what should i make'], 
        handler: () => handleWeatherBasedSuggestion() 
      },
      { 
        patterns: ['timer', 'set'], 
        condition: () => lowerCommand.includes('minute') || lowerCommand.includes('hour'), 
        handler: () => handleTimerCommand(lowerCommand) 
      },
      { 
        patterns: ['read'], 
        condition: () => lowerCommand.includes('ingredients') || lowerCommand.includes('recipe') || lowerCommand.includes('instructions'), 
        handler: () => handleRecipeReadingCommand(lowerCommand) 
      },
      { 
        patterns: ['convert', 'how many cups', 'tablespoon', 'teaspoon', 'gram', 'ounce', 'fahrenheit', 'celsius'], 
        handler: () => handleConversionCommand(lowerCommand) 
      },
      { 
        patterns: ['next step', 'previous step', 'repeat step', 'repeat instruction'], 
        handler: () => handleRecipeNavigationCommand(lowerCommand) 
      },
      { 
        patterns: ['shopping list', 'add to shopping', 'add to list'], 
        handler: () => handleShoppingListCommand(command) 
      },
      { 
        patterns: ['switch to metric', 'switch to imperial', 'change units', 'use metric', 'use imperial'], 
        handler: () => handleUnitPreferenceCommand(lowerCommand) 
      },
    ];

    // Check command routes with priority
    for (const route of commandRoutes) {
      const matchesPattern = route.patterns.some(pattern => lowerCommand.includes(pattern));
      const meetsCondition = !route.condition || route.condition();
      
      if (matchesPattern && meetsCondition) {
        return await route.handler();
      }
    }

    // For complex cooking questions, use AI
    if (lowerCommand.includes('how to') || 
        lowerCommand.includes('how do i') ||
        lowerCommand.includes('what is') || 
        lowerCommand.includes('why') ||
        lowerCommand.includes('substitute') ||
        lowerCommand.includes('can i use') ||
        lowerCommand.includes('instead of') ||
        lowerCommand.length > 40) { // Longer questions likely need AI
      return handleCookingQuestionCommand(command);
    }
    
    // Default: AI-powered general response
    return handleGeneralCookingCommand(command);
  };

  // Weather-based suggestion handler
  const handleWeatherBasedSuggestion = (): string => {
    if (!weather) {
      return "I don't have weather information right now, but I can suggest some popular recipes! Try asking me about specific dishes or ingredients you'd like to cook with.";
    }

    const temp = weather.temperature;
    const condition = weather.condition.toLowerCase();

    // Hot weather suggestions
    if (temp > 80) {
      return `It's ${Math.round(temp)}°F outside! Perfect weather for light, refreshing meals. I recommend cold salads, gazpacho, fresh fruit desserts, or grilled dishes. What sounds good to you?`;
    }
    
    // Cold weather suggestions
    if (temp < 50) {
      return `It's ${Math.round(temp)}°F - perfect comfort food weather! How about warm soups, stews, casseroles, or freshly baked bread? I can help you find the perfect cozy recipe.`;
    }
    
    // Rainy weather
    if (condition.includes('rain') || condition.includes('storm')) {
      return `It's rainy outside - ideal for comfort cooking! I suggest hearty soups, slow-cooked meals, or baking projects. Want me to find something specific?`;
    }
    
    // Sunny weather
    if (condition.includes('sun') || condition.includes('clear')) {
      return `Beautiful sunny day! Great for grilling, BBQ, fresh salads, or outdoor cooking. What would you like to prepare?`;
    }
    
    // Moderate weather
    return `It's ${Math.round(temp)}°F - nice weather for cooking! I can help you find recipes for any meal. What are you in the mood for?`;
  };

  // Timer command handler
  const handleTimerCommand = (command: string): string => {
    const numberMatch = command.match(/(\d+)/);
    if (numberMatch) {
      const minutes = parseInt(numberMatch[1]);
      const label = command.includes('pasta') ? 'Pasta Timer' :
                   command.includes('oven') ? 'Oven Timer' :
                   command.includes('boil') ? 'Boiling Timer' :
                   'Cooking Timer';
      
      onTimerRequest?.(minutes, label);
      return `Timer set for ${minutes} minutes. I'll let you know when it's done!`;
    }
    return "I couldn't understand the timer duration. Try saying 'set timer for 10 minutes'.";
  };

  // Recipe reading handler  
  const handleRecipeReadingCommand = (command: string): string => {
    if (!currentRecipe) {
      return "No recipe is currently selected. Choose a recipe first, then I can read it to you.";
    }
    
    if (command.includes('ingredients')) {
      const ingredients = currentRecipe.ingredients.split('\n').filter(i => i.trim());
      return `Here are the ingredients for ${currentRecipe.title}: ${ingredients.join(', ')}`;
    }
    
    const instructions = currentRecipe.instructions.split('\n').filter(i => i.trim());
    return `Here are the cooking instructions: ${instructions[0]}. Say 'next step' for the next instruction.`;
  };

  // Unit conversion handler - Enhanced with AI fallback
  const handleConversionCommand = async (command: string): Promise<string> => {
    const currentSystem = unit;
    
    // Extract numbers and units
    const numberMatch = command.match(/(\d+\.?\d*)/);
    const num = numberMatch ? parseFloat(numberMatch[1]) : 1;
    
    // Common cooking conversions based on current unit system
    const conversionMap: Record<string, { ratio: number, result: string }> = {
      'cup_tablespoon': { ratio: 16, result: 'tablespoons' },
      'tablespoon_teaspoon': { ratio: 3, result: 'teaspoons' },
      'pound_ounce': { ratio: 16, result: 'ounces' },
      'cup_flour_gram': { ratio: 120, result: 'grams' },
      'cup_sugar_gram': { ratio: 200, result: 'grams' },
      'liter_cup': { ratio: 4.227, result: 'cups' },
      'quart_liter': { ratio: 0.946, result: 'liters' },
      'ounce_gram': { ratio: 28.35, result: 'grams' },
    };
    
    // Try matching known conversions
    for (const [key, { ratio, result }] of Object.entries(conversionMap)) {
      const [from, to] = key.split('_');
      if (command.toLowerCase().includes(from) && command.toLowerCase().includes(to)) {
        const converted = (num * ratio).toFixed(2);
        return `${num} ${from}${num !== 1 ? 's' : ''} equals about ${converted} ${result}. Your current system is ${currentSystem}.`;
      }
    }
    
    // Temperature conversions
    if (command.toLowerCase().includes('fahrenheit') || command.toLowerCase().includes('celsius')) {
      if (command.toLowerCase().includes('fahrenheit') && command.toLowerCase().includes('celsius')) {
        const celsius = ((num - 32) * 5 / 9).toFixed(1);
        return `${num}°F equals ${celsius}°C.`;
      } else if (command.toLowerCase().includes('celsius') && command.toLowerCase().includes('fahrenheit')) {
        const fahrenheit = ((num * 9 / 5) + 32).toFixed(1);
        return `${num}°C equals ${fahrenheit}°F.`;
      }
    }
    
    // Use AI for complex conversions
    try {
      const response = await fetch('/api/cooking-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: `Convert cooking measurement: ${command}. Current unit system: ${currentSystem}. Be precise and concise.`,
          context: 'Provide a cooking conversion'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.answer;
      }
    } catch (error) {
      console.error('AI conversion error:', error);
    }
    
    return `I can help with cooking conversions. Your current system is ${currentSystem}. Try asking 'how many tablespoons in a cup' or 'convert 350 fahrenheit to celsius'.`;
  };

  // Cooking questions handler
  const handleCookingQuestionCommand = async (command: string): Promise<string> => {
    // This would integrate with OpenAI API for intelligent responses
    try {
      const response = await fetch('/api/cooking-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: command,
          context: currentRecipe ? `Currently cooking: ${currentRecipe.title}` : null 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.answer;
      }
    } catch (error) {
      console.error('AI assistant error:', error);
    }
    
    // Fallback responses
    if (command.includes('substitute')) {
      return "Common substitutions: 1 cup milk can be replaced with 1 cup plant milk, 1 egg can be replaced with 1/4 cup applesauce for baking.";
    }
    
    return "I'm here to help with cooking questions. Ask me about techniques, substitutions, or cooking tips!";
  };

  // Recipe navigation handler
  const handleRecipeNavigationCommand = (command: string): string => {
    // This would track current step and navigate through recipe
    return "Recipe navigation is coming soon. For now, I can read the full recipe to you.";
  };

  // General cooking command handler
  const handleGeneralCookingCommand = async (command: string): Promise<string> => {
    try {
      const response = await fetch('/api/cooking-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: command,
          context: currentRecipe ? `Currently cooking: ${currentRecipe.title}` : null 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.answer;
      }
    } catch (error) {
      console.error('AI assistant error:', error);
    }

    return "I'm your cooking assistant! I can help with timers, reading recipes, unit conversions, and cooking tips. What would you like help with?";
  };

  // Shopping list command handler
  const handleShoppingListCommand = (command: string): string => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('read') || lowerCommand.includes('what') || lowerCommand.includes('list')) {
      const { total, unchecked } = getItemsCount();
      if (total === 0) {
        return "Your shopping list is empty.";
      }
      const listText = getListAsText();
      return `You have ${unchecked} items on your shopping list: ${listText}`;
    }
    
    // Extract items to add (look for "add [item] to shopping list")
    const addMatch = command.match(/add (.+) to shopping/i);
    if (addMatch) {
      const items = addMatch[1].split(/,| and /).map(item => item.trim()).filter(Boolean);
      addIngredients(items);
      return `Added ${items.join(', ')} to your shopping list.`;
    }
    
    return "I can help you add items to your shopping list or read what's on it. Try saying 'add milk to shopping list' or 'what's on my shopping list?'";
  };

  // Unit preference command handler  
  const handleUnitPreferenceCommand = (command: string): string => {
    if (command.includes('metric')) {
      setUnit('metric');
      return "Switched to metric units. I'll now use grams, liters, and Celsius.";
    } else if (command.includes('imperial')) {
      setUnit('imperial'); 
      return "Switched to imperial units. I'll now use cups, ounces, and Fahrenheit.";
    }
    return `Current unit system is ${unit}. Say 'switch to metric' or 'switch to imperial' to change.`;
  };

  // Add message to conversation
  const addMessage = (type: 'user' | 'assistant', text: string) => {
    setMessages((prev: AssistantMessage[]) => [...prev, { type, text, timestamp: new Date() }]);
  };

  // Text-to-speech function
  const speak = useCallback((text: string) => {
    if (!synthesisRef.current || !voiceSettings.voice) return;
    
    // Stop any current speech
    synthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voiceSettings.voice;
    utterance.rate = voiceSettings.rate;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Resume listening after speaking
      if (isEnabled) {
        startListening();
      }
    };
    utterance.onerror = () => setIsSpeaking(false);
    
    currentUtteranceRef.current = utterance;
    synthesisRef.current.speak(utterance);
  }, [voiceSettings, isEnabled]);

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [isListening, isSpeaking]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthesisRef.current && isSpeaking) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  // Toggle assistant
  const toggleAssistant = () => {
    if (isListening) {
      stopListening();
    } else if (isSpeaking) {
      stopSpeaking();
    } else {
      startListening();
    }
  };

  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
    if (isMinimized && !isEnabled) {
      setIsEnabled(true);
    }
  };

  // Floating button and minimized state
  if (!isEnabled || isMinimized) {
    return (
      <>
        {/* Floating Action Button */}
        {showFloatingButton && (
          <div className="fixed top-20 left-6 z-50">
            <Button
              onClick={toggleMinimized}
              className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white transition-all duration-300 hover:scale-110"
            >
              <MessageSquare className="h-8 w-8" />
            </Button>
            
            {/* Pulsing indicator when listening */}
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-75" />
            )}
            
            {/* Badge for weather-aware mode */}
            {weather && (
              <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white border-2 border-white">
                {Math.round(weather.temperature)}°
              </Badge>
            )}
          </div>
        )}

        {/* Minimized Widget */}
        {!isMinimized && (
          <div className="fixed top-20 left-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 w-80 border-2 border-orange-500">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                Cooking Assistant
              </h3>
              <div className="flex gap-1">
                <Button
                  className="h-8 w-8 p-0"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setIsEnabled(false);
                    setIsMinimized(true);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {weather && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🌤️ {Math.round(weather.temperature)}°F - {weather.condition}
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              I'm your cooking assistant! I can help with timers, reading recipes, unit conversions, and cooking tips.
              {weather && " I can also suggest recipes based on today's weather!"}
            </p>
            
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setIsEnabled(true);
                  setIsMinimized(false);
                  startListening();
                }}
                className="w-full"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Voice Assistant
              </Button>
              
              {weather && (
                <Button
                  onClick={() => {
                    setIsEnabled(true);
                    setIsMinimized(false);
                    handleVoiceCommand("what should i cook today");
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  🌤️ Get Weather Recipe Ideas
                </Button>
              )}
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Try: "Set timer for 15 minutes", "Read ingredients", "Convert 2 cups to tablespoons", "What should I cook today?"
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed top-20 left-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-orange-500">
      <div className="w-96 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <h3 className="font-semibold text-lg">Cooking Assistant</h3>
          </div>
          <div className="flex gap-1">
            <Button
              className="h-8 w-8 p-0"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              className="h-8 w-8 p-0"
              onClick={() => {
                setIsEnabled(false);
                setIsMinimized(true);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Weather Info Bar */}
        {weather && (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-blue-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              🌤️ {Math.round(weather.temperature)}°F - {weather.condition}
              <Badge className="ml-2 bg-orange-500 text-white text-xs">Weather-Aware</Badge>
            </p>
          </div>
        )}

        {/* Conversation Display */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Conversation
          </div>
          {messages.slice(-5).map((message: AssistantMessage, index: number) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-sm max-w-[90%] ${
                message.type === 'user'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 ml-0'
                  : 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 ml-0'
              }`}
            >
              <p className="text-sm font-medium mb-1">
                {message.type === 'user' ? 'You' : 'Assistant'}
              </p>
              <p className="text-base">{message.text}</p>
            </div>
          ))}
          {currentTranscript && (
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 max-w-[90%] ml-0">
              <p className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">You (listening...)</p>
              <p className="text-base text-gray-600 dark:text-gray-400">{currentTranscript}</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking}
              className={`flex-1 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
            
            <Button
              onClick={stopSpeaking}
              disabled={!isSpeaking}
              className="px-3"
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Quick Commands */}
          {weather && (
            <Button
              onClick={() => handleVoiceCommand("what should i cook today")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              🌤️ Get Recipe Suggestions
            </Button>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p className="font-semibold mb-1">Try saying:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>"Set timer for 15 minutes"</li>
              <li>"Read ingredients"</li>
              <li>"Convert 2 cups to tablespoons"</li>
              {weather && <li>"What should I cook today?"</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceAssistant;