/**
 * Text-to-Speech Service
 * Uses the Web Speech API to provide text-to-speech functionality
 * for accessibility features
 */

class TextToSpeechService {
  constructor() {
    // Get the speech synthesis API
    this.synth = window.speechSynthesis;
    this.isSupported = !!this.synth;
    this.currentUtterance = null;
    this.isSpeaking = false;
  }

  /**
   * Check if text-to-speech is supported in browser
   */
  isAvailable() {
    return this.isSupported;
  }

  /**
   * Speak the provided text
   * @param {string} text - Text to speak
   * @param {object} options - Configuration options
   * @param {string} options.language - Language code (e.g., 'en-US', 'es-ES')
   * @param {number} options.rate - Speech rate (0.1 to 10, default 1)
   * @param {number} options.pitch - Voice pitch (0 to 2, default 1)
   * @param {number} options.volume - Volume (0 to 1, default 1)
   * @param {function} options.onEnd - Callback when speech finishes
   */
  speak(text, options = {}) {
    if (!this.isSupported) {
      console.warn('Text-to-Speech not supported in this browser');
      return false;
    }

    // Stop any ongoing speech
    if (this.isSpeaking) {
      this.stop();
    }

    const {
      language = 'en-US',
      rate = 1,
      pitch = 1,
      volume = 1,
      onEnd = null
    } = options;

    // Create utterance
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = language;
    this.currentUtterance.rate = Math.max(0.1, Math.min(10, rate));
    this.currentUtterance.pitch = Math.max(0, Math.min(2, pitch));
    this.currentUtterance.volume = Math.max(0, Math.min(1, volume));

    // Event handlers
    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.currentUtterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      this.isSpeaking = false;
    };

    // Speak
    this.synth.speak(this.currentUtterance);
    return true;
  }

  /**
   * Stop speaking
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.synth && this.isSpeaking) {
      this.synth.resume();
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices() {
    return this.synth ? this.synth.getVoices() : [];
  }

  /**
   * Get voice for specific language
   */
  getVoiceForLanguage(lang) {
    const voices = this.getAvailableVoices();
    return voices.find(voice => voice.lang.startsWith(lang)) || null;
  }

  /**
   * Check if currently speaking
   */
  isSpeakingNow() {
    return this.isSpeaking;
  }

  /**
   * Speak text when focused on an element (for accessibility)
   */
  speakElement(element, options = {}) {
    if (!element) return;
    const text = element.textContent || element.innerText;
    if (text) {
      this.speak(text, options);
    }
  }

  /**
   * Enable high-speed speech for quick reading
   */
  speakFast(text, options = {}) {
    const highSpeedOptions = {
      rate: 1.5,
      ...options
    };
    this.speak(text, highSpeedOptions);
  }

  /**
   * Enable slow speech for clear pronunciation
   */
  speakSlow(text, options = {}) {
    const slowSpeedOptions = {
      rate: 0.8,
      ...options
    };
    this.speak(text, slowSpeedOptions);
  }
}

// Create singleton instance
const ttsService = new TextToSpeechService();

export default ttsService;
