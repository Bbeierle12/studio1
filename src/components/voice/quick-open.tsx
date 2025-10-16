"use client";

import { createRoot } from 'react-dom/client';
import { useEffect, useState, useRef } from 'react';
import { X, Mic, MicOff, Loader2, Search, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface QuickOpenOptions {
  mode: 'ptt' | 'full';
  context?: any;
}

let currentInstance: any = null;

export function openVoiceOverlay(options: QuickOpenOptions) {
  // If there's already an instance, close it
  if (currentInstance) {
    currentInstance.close();
  }

  // Create portal container
  const container = document.createElement('div');
  container.id = 'voice-quick-open';
  container.className = 'fixed inset-0 z-[100]';
  document.body.appendChild(container);

  // Create React root and render
  const root = createRoot(container);

  const cleanup = () => {
    root.unmount();
    container.remove();
    currentInstance = null;
  };

  currentInstance = { close: cleanup };

  root.render(<QuickVoiceOverlay {...options} onClose={cleanup} />);
}

function QuickVoiceOverlay({ mode, context, onClose }: QuickOpenOptions & { onClose: () => void }) {
  const [isListening, setIsListening] = useState(mode === 'ptt');
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(mode === 'full');

  const router = useRouter();
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick actions available in the command palette
  const quickActions = [
    {
      id: 'cook-mode',
      label: 'Enter Cook Mode',
      icon: ChefHat,
      action: () => {
        router.push('/cook');
        onClose();
      }
    },
    {
      id: 'browse-recipes',
      label: 'Browse Recipes',
      icon: Search,
      action: () => {
        router.push('/recipes');
        onClose();
      }
    },
    {
      id: 'voice-search',
      label: 'Voice Search Recipe',
      icon: Mic,
      action: () => {
        setShowCommandPalette(false);
        startListening();
      }
    }
  ];

  // Filter actions based on search
  const filteredActions = quickActions.filter(action =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);

      if (event.results[current].isFinal) {
        handleVoiceCommand(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // For push-to-talk mode, close after command
      if (mode === 'ptt') {
        setTimeout(onClose, 1500);
      }
    };

    recognitionRef.current = recognition;

    // Auto-start for push-to-talk
    if (mode === 'ptt') {
      startListening();
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  // Focus input on mount
  useEffect(() => {
    if (mode === 'full' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    const lowerCommand = command.toLowerCase();

    // Handle navigation commands
    if (lowerCommand.includes('cook mode') || lowerCommand.includes('start cooking')) {
      router.push('/cook');
      onClose();
    } else if (lowerCommand.includes('browse recipes') || lowerCommand.includes('show recipes')) {
      router.push('/recipes');
      onClose();
    } else if (lowerCommand.includes('search for') || lowerCommand.includes('find recipe')) {
      // Extract search term and navigate to recipes with search
      const searchTerm = command.replace(/search for|find recipe/gi, '').trim();
      router.push(`/recipes?search=${encodeURIComponent(searchTerm)}`);
      onClose();
    } else {
      // Send to AI for general queries
      try {
        const res = await fetch('/api/cooking-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: command,
            context: {
              location: context?.currentPath,
            }
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Show response briefly then close
          setTranscript(data.response || data.message);
          setTimeout(onClose, 3000);
        }
      } catch (error) {
        console.error('Error processing command:', error);
      }
    }

    setIsProcessing(false);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && searchQuery && filteredActions.length > 0) {
        filteredActions[0].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, filteredActions]);

  // Handle Shift key release for push-to-talk
  useEffect(() => {
    if (mode !== 'ptt') return;

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey && e.code === 'Space') {
        if (isListening) {
          stopListening();
        }
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, [mode, isListening]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <Card className="w-full max-w-lg p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {mode === 'ptt' ? 'Listening...' : 'Quick Actions'}
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Command Palette Mode */}
            {showCommandPalette && mode === 'full' && (
              <>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    placeholder="Type a command or search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {filteredActions.map(action => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <action.icon className="h-5 w-5 text-muted-foreground" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCommandPalette(false);
                      startListening();
                    }}
                    className="gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Use Voice Instead
                  </Button>
                </div>
              </>
            )}

            {/* Voice Mode */}
            {(!showCommandPalette || mode === 'ptt') && (
              <div className="text-center space-y-4">
                <div className="relative h-24 flex items-center justify-center">
                  {isListening && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 bg-red-500 rounded-full animate-pulse opacity-50" />
                    </div>
                  )}
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center",
                    isListening ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"
                  )}>
                    {isListening ? (
                      <MicOff className="h-6 w-6 text-white" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </div>
                </div>

                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                )}

                {transcript && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm">{transcript}</p>
                  </div>
                )}

                {mode === 'full' && (
                  <>
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      variant={isListening ? "destructive" : "default"}
                    >
                      {isListening ? 'Stop Listening' : 'Start Listening'}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                      Try: "Start cook mode", "Search for chicken recipes", "Browse recipes"
                    </p>
                  </>
                )}

                {mode === 'ptt' && (
                  <p className="text-xs text-muted-foreground">
                    Release Shift+Space when done speaking
                  </p>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}