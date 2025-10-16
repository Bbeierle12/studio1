"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceOverlayProps {
  recipe?: any;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onTimerRequest?: (minutes: number, label: string) => void;
  completedSteps?: Set<number>;
  onToggleStepComplete?: (step: number) => void;
}

export default function VoiceOverlay({
  recipe,
  currentStep = 0,
  onStepChange,
  onTimerRequest,
  completedSteps,
  onToggleStepComplete,
}: VoiceOverlayProps) {
  const [isListening, setIsListening] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const pushToTalkTimeoutRef = useRef<NodeJS.Timeout>();

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
        processCommand(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setIsPushToTalk(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsPushToTalk(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  // Process voice commands
  const processCommand = async (command: string) => {
    setIsProcessing(true);
    const lowerCommand = command.toLowerCase();

    // Handle local commands first for instant response
    let handled = false;
    let responseText = '';

    // Navigation commands
    if (lowerCommand.includes('next step') || lowerCommand.includes('next instruction')) {
      if (recipe && currentStep < recipe.instructions.length - 1) {
        onStepChange?.(currentStep + 1);
        responseText = `Moving to step ${currentStep + 2}`;
        handled = true;
      }
    } else if (lowerCommand.includes('previous step') || lowerCommand.includes('go back')) {
      if (currentStep > 0) {
        onStepChange?.(currentStep - 1);
        responseText = `Going back to step ${currentStep}`;
        handled = true;
      }
    } else if (lowerCommand.includes('repeat') || lowerCommand.includes('what\'s the current step')) {
      if (recipe) {
        responseText = recipe.instructions[currentStep];
        handled = true;
      }
    }

    // Step completion
    else if (lowerCommand.includes('mark complete') || lowerCommand.includes('done with this step')) {
      onToggleStepComplete?.(currentStep);
      responseText = 'Step marked as complete';
      handled = true;
    }

    // Timer commands
    else if (lowerCommand.includes('timer') || lowerCommand.includes('set a timer')) {
      const match = lowerCommand.match(/(\d+)\s*(minute|min)/);
      if (match && onTimerRequest) {
        const minutes = parseInt(match[1]);
        const labelMatch = lowerCommand.match(/for\s+(.+)$/);
        const label = labelMatch ? labelMatch[1] : `${minutes} minute timer`;
        onTimerRequest(minutes, label);
        responseText = `Timer set for ${minutes} minutes`;
        handled = true;
      }
    }

    // Ingredient commands
    else if (lowerCommand.includes('ingredients') || lowerCommand.includes('what do i need')) {
      if (recipe) {
        responseText = `You need: ${recipe.ingredients.slice(0, 5).join(', ')}`;
        if (recipe.ingredients.length > 5) {
          responseText += `, and ${recipe.ingredients.length - 5} more items`;
        }
        handled = true;
      }
    }

    // If not handled locally, send to AI for complex queries
    if (!handled && recipe) {
      try {
        const res = await fetch('/api/cooking-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: command,
            context: {
              recipe: {
                title: recipe.title,
                currentStep: currentStep + 1,
                totalSteps: recipe.instructions.length,
                currentInstruction: recipe.instructions[currentStep],
                ingredients: recipe.ingredients,
              }
            }
          }),
        });

        if (res.ok) {
          const data = await res.json();
          responseText = data.response || data.message;
        }
      } catch (error) {
        console.error('Error processing command:', error);
        responseText = "I couldn't process that command. Try saying 'next step' or 'set timer'.";
      }
    }

    if (responseText) {
      setResponse(responseText);
      if (audioEnabled) {
        speak(responseText);
      }
    }

    setIsProcessing(false);
    setTranscript('');
  };

  // Text-to-speech
  const speak = (text: string) => {
    if (!audioEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Start/stop listening
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript('');
        setResponse('');
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };

  // Push-to-talk handlers
  const handlePushToTalkStart = () => {
    if (!recognitionRef.current || isListening) return;

    setIsPushToTalk(true);
    setShowOverlay(true);
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
      setResponse('');
    } catch (error) {
      console.error('Error starting push-to-talk:', error);
    }
  };

  const handlePushToTalkEnd = () => {
    if (!recognitionRef.current || !isPushToTalk) return;

    // Add small delay to capture the last bit of speech
    pushToTalkTimeoutRef.current = setTimeout(() => {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsPushToTalk(false);
    }, 500);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift+Space for push-to-talk
      if (e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        handlePushToTalkStart();
      }
      // Cmd/Ctrl+M to toggle mic
      else if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        setShowOverlay(true);
        toggleListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        handlePushToTalkEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (pushToTalkTimeoutRef.current) {
        clearTimeout(pushToTalkTimeoutRef.current);
      }
    };
  }, [isPushToTalk]);

  // Floating action button (minimal, non-intrusive)
  const FloatingButton = () => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <Button
        size="lg"
        className={cn(
          "rounded-full h-14 w-14 shadow-lg",
          isListening && "bg-red-500 hover:bg-red-600"
        )}
        onClick={() => {
          setShowOverlay(true);
          toggleListening();
        }}
      >
        {isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      {!showOverlay && (
        <div className="absolute -top-8 right-0 text-xs bg-black/75 text-white px-2 py-1 rounded whitespace-nowrap">
          Hold Shift+Space to talk
        </div>
      )}
    </motion.div>
  );

  // Voice overlay panel
  const OverlayPanel = () => (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 right-6 z-50 w-96"
        >
          <Card className="p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Voice Assistant</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAudioEnabled(!audioEnabled)}
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
                  onClick={() => setShowOverlay(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-3">
              {isListening && (
                <div className="flex items-center gap-2 text-red-500">
                  <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm">Listening...</span>
                </div>
              )}
              {isProcessing && (
                <div className="flex items-center gap-2 text-orange-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-blue-500">
                  <Volume2 className="h-3 w-3" />
                  <span className="text-sm">Speaking...</span>
                </div>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You said:</p>
                <p className="text-sm">{transcript}</p>
              </div>
            )}

            {/* Response */}
            {response && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Assistant:</p>
                <p className="text-sm">{response}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant={isListening ? "destructive" : "default"}
                onClick={toggleListening}
              >
                {isListening ? 'Stop' : 'Start Listening'}
              </Button>
            </div>

            {/* Help text */}
            <p className="text-xs text-muted-foreground mt-3">
              Try: "Next step", "Set timer for 10 minutes", "Read ingredients"
            </p>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <FloatingButton />
      <OverlayPanel />
    </>
  );
}