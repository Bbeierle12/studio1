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
  RotateCcw
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
}

interface AssistantMessage {
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export function VoiceAssistant({ currentRecipe, onTimerRequest, className = '' }: VoiceAssistantProps) {
  // Context hooks
  const { unit, toggleUnit, setUnit } = useUnit();
  const { addIngredients, getItemsCount, getListAsText } = useShoppingList();
  
  // Core state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
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

  // Process voice commands with AI
  const processVoiceCommand = async (command: string): Promise<string> => {
    const lowerCommand = command.toLowerCase();
    
    // Timer commands
    if (lowerCommand.includes('timer') || lowerCommand.includes('set') && (lowerCommand.includes('minute') || lowerCommand.includes('hour'))) {
      return handleTimerCommand(lowerCommand);
    }
    
    // Recipe reading commands
    if (lowerCommand.includes('read') && (lowerCommand.includes('ingredients') || lowerCommand.includes('recipe'))) {
      return handleRecipeReadingCommand(lowerCommand);
    }
    
    // Unit conversion commands  
    if (lowerCommand.includes('convert') || lowerCommand.includes('how many') || lowerCommand.includes('cups') || lowerCommand.includes('tablespoon')) {
      return handleConversionCommand(lowerCommand);
    }
    
    // Cooking tips and techniques
    if (lowerCommand.includes('how to') || lowerCommand.includes('what is') || lowerCommand.includes('substitute')) {
      return handleCookingQuestionCommand(command);
    }
    
    // Recipe navigation
    if (lowerCommand.includes('next step') || lowerCommand.includes('previous step') || lowerCommand.includes('repeat')) {
      return handleRecipeNavigationCommand(lowerCommand);
    }
    
    // Shopping list commands
    if (lowerCommand.includes('add to') && lowerCommand.includes('shopping') || lowerCommand.includes('shopping list')) {
      return handleShoppingListCommand(command);
    }
    
    // Unit preference commands
    if (lowerCommand.includes('switch to') && (lowerCommand.includes('metric') || lowerCommand.includes('imperial'))) {
      return handleUnitPreferenceCommand(lowerCommand);
    }
    
    // General cooking AI assistance
    return handleGeneralCookingCommand(command);
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

  // Unit conversion handler
  const handleConversionCommand = async (command: string): Promise<string> => {
    // Unit-aware conversions
    const currentSystem = unit;
    
    // Common cooking conversions based on current unit system
    const conversions: Record<string, string> = {
      '1 cup to tablespoons': '1 cup equals 16 tablespoons',
      '1 tablespoon to teaspoons': '1 tablespoon equals 3 teaspoons',
      '1 pound to ounces': '1 pound equals 16 ounces',
      '1 cup flour to grams': currentSystem === 'metric' ? '1 cup of flour equals about 120 grams' : '1 cup of flour equals about 4.25 ounces',
      '1 cup sugar to grams': currentSystem === 'metric' ? '1 cup of sugar equals about 200 grams' : '1 cup of sugar equals about 7 ounces',
      '1 liter to cups': '1 liter equals about 4.2 cups',
      '350 fahrenheit to celsius': '350°F equals 175°C',
      '180 celsius to fahrenheit': '180°C equals 355°F'
    };
    
    // Simple matching for common conversions
    for (const [key, value] of Object.entries(conversions)) {
      if (command.includes(key.split(' to ')[0]) && command.includes(key.split(' to ')[1])) {
        return `${value}. Your current unit system is set to ${currentSystem}.`;
      }
    }
    
    return `I can help with common cooking conversions. Your current unit system is ${currentSystem}. Try asking 'how many tablespoons in a cup' or 'convert 1 cup flour to grams'.`;
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

  if (!isEnabled) {
    return (
      <Card className={`${className} opacity-50`}>
        <CardContent className="p-4 text-center">
          <MicOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Voice assistant not supported in this browser</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`voice-assistant ${className}`}>
      {/* Main Voice Button */}
      <div className="text-center mb-4">
        <Button
          onClick={toggleAssistant}
          size="lg"
          className={`relative w-16 h-16 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : isSpeaking
              ? 'bg-blue-500 hover:bg-blue-600 animate-pulse'
              : 'bg-primary hover:bg-primary/90'
          }`}
          disabled={!isEnabled}
        >
          {isListening ? (
            <Mic className="w-8 h-8 text-white" />
          ) : isSpeaking ? (
            <Volume2 className="w-8 h-8 text-white" />
          ) : (
            <ChefHat className="w-8 h-8 text-white" />
          )}
          
          {/* Animated rings for listening state */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"></div>
              <div className="absolute inset-0 rounded-full bg-red-300 animate-ping opacity-20 animation-delay-100"></div>
            </>
          )}
        </Button>
        
        <div className="mt-2">
          <Badge variant={isListening ? 'destructive' : isSpeaking ? 'default' : 'secondary'}>
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready to Help'}
          </Badge>
        </div>
        
        {currentTranscript && (
          <div className="mt-2 p-2 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-600 italic">"{currentTranscript}"</p>
          </div>
        )}
      </div>

      {/* Quick Command Suggestions */}
      <div className="grid grid-cols-2 gap-2 mb-4">{/* 2 columns, 3 rows for 6 buttons */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleVoiceCommand('read ingredients')}
          className="text-xs"
        >
          <BookOpen className="w-3 h-3 mr-1" />
          Read Recipe
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleVoiceCommand('set timer for 10 minutes')}
          className="text-xs"
        >
          <Clock className="w-3 h-3 mr-1" />
          Set Timer
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleVoiceCommand('convert 1 cup to tablespoons')}
          className="text-xs"
        >
          <Calculator className="w-3 h-3 mr-1" />
          Conversions
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleVoiceCommand('cooking tips')}
          className="text-xs"
        >
          <Lightbulb className="w-3 h-3 mr-1" />
          Tips
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleVoiceCommand("what's on my shopping list")}
          className="text-xs"
        >
          <ShoppingCart className="w-3 h-3 mr-1" />
          Shopping List
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleVoiceCommand(`switch to ${unit === 'imperial' ? 'metric' : 'imperial'}`)}
          className="text-xs"
        >
          <Ruler className="w-3 h-3 mr-1" />
          {unit === 'imperial' ? 'Use Metric' : 'Use Imperial'}
        </Button>
      </div>

      {/* Voice Controls */}
      {(isListening || isSpeaking) && (
        <div className="flex justify-center gap-2 mb-4">
          {isSpeaking && (
            <Button
              onClick={stopSpeaking}
              variant="outline"
              size="sm"
            >
              <Pause className="w-4 h-4 mr-1" />
              Stop Speaking
            </Button>
          )}
          <Button
            onClick={() => {
              setMessages([]);
              setCurrentTranscript('');
            }}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Recent Messages */}
      {messages.length > 0 && (
        <Card className="border-2">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Conversation</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.slice(-5).map((message: AssistantMessage, index: number) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-start' : 'justify-start'}`}
                >
                  <div
                    className={`text-base p-4 rounded-lg shadow-sm max-w-[90%] ${
                      message.type === 'user'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-green-100 text-green-900'
                    }`}
                  >
                    <strong className="block mb-1 text-sm">{message.type === 'user' ? 'You' : 'Assistant'}:</strong> 
                    <span className="block">{message.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Tips */}
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          Try: "Set timer for 15 minutes", "Read ingredients", "Convert 2 cups to tablespoons"
        </p>
      </div>
    </div>
  );
}

export default VoiceAssistant;