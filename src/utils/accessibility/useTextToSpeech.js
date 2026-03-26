/**
 * Custom Hook for Text-to-Speech
 * Provides easy integration of text-to-speech functionality in React components
 */

import { useState, useCallback, useEffect } from 'react';
import ttsService from './textToSpeechService';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(ttsService.isAvailable());
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (!isSupported) return;
    
    const defaultOptions = {
      language: 'en-US',
      onEnd: () => setIsSpeaking(false),
      ...options
    };

    const success = ttsService.speak(text, defaultOptions);
    if (success) {
      setIsSpeaking(true);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    ttsService.stop();
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    ttsService.pause();
  }, []);

  const resume = useCallback(() => {
    ttsService.resume();
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported
  };
}
