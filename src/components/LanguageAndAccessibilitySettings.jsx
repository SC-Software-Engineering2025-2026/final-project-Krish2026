/**
 * Accessibility and Language Settings Component
 * Provides controls for text-to-speech, language selection,
 * font size, and other accessibility features
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTextToSpeech } from "../utils/accessibility";
import { AVAILABLE_LANGUAGES } from "../i18n/i18n";
import {
  SpeakerWaveIcon,
  LanguageIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import {
  getAriaFormFieldAttributes,
  getAriaModalAttributes,
} from "../utils/accessibility/ariaUtils";

const LanguageAndAccessibilitySettings = ({ profile, onSave }) => {
  const { t, i18n } = useTranslation();
  const {
    speak,
    stop,
    isSpeaking,
    isSupported: ttsSupported,
  } = useTextToSpeech();

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(
    localStorage.getItem("ttsEnabled") === "true",
  );
  const [fontSize, setFontSize] = useState(
    localStorage.getItem("fontSize") || "medium",
  );
  const [highContrastMode, setHighContrastMode] = useState(
    localStorage.getItem("highContrast") === "true",
  );
  const [previewText, setPreviewText] = useState(
    t("accessibility.textToSpeechEnabled"),
  );

  // Apply TTS settings to document
  useEffect(() => {
    if (textToSpeechEnabled) {
      document.body.setAttribute("data-tts-enabled", "true");
    } else {
      document.body.removeAttribute("data-tts-enabled");
    }
    localStorage.setItem("ttsEnabled", textToSpeechEnabled);
  }, [textToSpeechEnabled]);

  // Apply font size
  useEffect(() => {
    const sizeMap = {
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
      extraLarge: "1.25rem",
    };
    document.documentElement.style.fontSize = sizeMap[fontSize];
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  // Apply high contrast mode
  useEffect(() => {
    if (highContrastMode) {
      document.body.classList.add("high-contrast-mode");
    } else {
      document.body.classList.remove("high-contrast-mode");
    }
    localStorage.setItem("highContrast", highContrastMode);
  }, [highContrastMode]);

  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem("userLanguage", newLanguage);

    if (textToSpeechEnabled && isSupported) {
      const languageMap = {
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        it: "it-IT",
        zh: "zh-CN",
        ja: "ja-JP",
      };
      speak(t("common.success"), { language: languageMap[newLanguage] });
    }
  };

  const handleTestTTS = () => {
    if (isSpeaking) {
      stop();
    } else {
      const languageMap = {
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        it: "it-IT",
        zh: "zh-CN",
        ja: "ja-JP",
      };
      const testMessage = t("profile.textToSpeech");
      speak(testMessage, { language: languageMap[selectedLanguage] });
    }
  };

  const handleSaveSettings = () => {
    onSave({
      language: selectedLanguage,
      textToSpeechEnabled,
      fontSize,
      highContrastMode,
    });
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6"
      {...getAriaModalAttributes("accessibility-settings-title")}
    >
      <h2
        id="accessibility-settings-title"
        className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
      >
        <LanguageIcon className="w-6 h-6" />
        {t("profile.accessibility")}
      </h2>

      {/* Language Selection */}
      <div className="space-y-3">
        <label
          htmlFor="language-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("profile.selectLanguage")}
        </label>
        <select
          id="language-select"
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...getAriaFormFieldAttributes("language-select")}
        >
          {Object.entries(AVAILABLE_LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("common.success")} - Language changed!
        </p>
      </div>

      {/* Text-to-Speech */}
      {ttsSupported && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <label
            htmlFor="tts-toggle"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <SpeakerWaveIcon className="w-5 h-5" />
            {t("profile.textToSpeech")}
          </label>

          <div className="flex items-center gap-3">
            <input
              id="tts-toggle"
              type="checkbox"
              checked={textToSpeechEnabled}
              onChange={(e) => setTextToSpeechEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              aria-checked={textToSpeechEnabled}
              {...getAriaFormFieldAttributes("tts-toggle")}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {textToSpeechEnabled
                ? t("profile.enableTextToSpeech")
                : t("profile.textToSpeech")}
            </span>
          </div>

          {textToSpeechEnabled && (
            <button
              onClick={handleTestTTS}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                isSpeaking
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              aria-label={
                isSpeaking
                  ? t("accessibility.stop")
                  : t("accessibility.readAloud")
              }
            >
              {isSpeaking
                ? t("accessibility.stop")
                : t("accessibility.readAloud")}
            </button>
          )}
        </div>
      )}

      {/* Font Size */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <label
          htmlFor="font-size-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("profile.fontSize")}
        </label>
        <div className="flex gap-2">
          <select
            id="font-size-select"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...getAriaFormFieldAttributes("font-size-select")}
          >
            <option value="small">{t("common.less")}</option>
            <option value="medium">{t("common.more")}</option>
            <option value="large">{t("common.more")} +</option>
            <option value="extraLarge">{t("common.more")} ++</option>
          </select>
          <button
            onClick={() => setFontSize("medium")}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
            aria-label={t("common.back")}
            title={t("common.back")}
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("common.success")} - Font size updated!
        </p>
      </div>

      {/* High Contrast Mode */}
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <label
          htmlFor="high-contrast-toggle"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("profile.highContrast")}
        </label>

        <div className="flex items-center gap-3">
          <input
            id="high-contrast-toggle"
            type="checkbox"
            checked={highContrastMode}
            onChange={(e) => setHighContrastMode(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            aria-checked={highContrastMode}
            {...getAriaFormFieldAttributes("high-contrast-toggle")}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {highContrastMode ? t("common.success") : t("profile.highContrast")}
          </span>
        </div>
      </div>

      {/* Save Button */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={handleSaveSettings}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          aria-label={t("common.save")}
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  );
};

export default LanguageAndAccessibilitySettings;
