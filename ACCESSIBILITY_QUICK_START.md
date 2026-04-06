# Accessibility Quick Start Guide

## For End Users

### 🌍 Change Your Language

1. Click **Settings** in the navigation
2. Scroll to **Accessibility & Language**
3. Select your language from the dropdown
4. Your choice is saved automatically!

**Supported Languages:**

- English, Spanish, French, Italian, Chinese, Japanese

### 🔊 Enable Text-to-Speech

1. Go to **Settings** → **Accessibility & Language**
2. Check the **Enable Text to Speech** checkbox
3. Click **Read Aloud** to hear content
4. Use keyboard shortcut: **Alt + S**

### 🎨 Adjust Your Display

- **Font Size**: Choose from Small to Extra Large
- **High Contrast**: Enable for better visibility
- Settings are saved to your browser

### ⌨️ Keyboard Shortcuts

| Key                | Action                       |
| ------------------ | ---------------------------- |
| `Tab`              | Navigate to next element     |
| `Shift + Tab`      | Navigate to previous element |
| `Alt + S`          | Toggle text-to-speech        |
| `Ctrl + K`         | Focus search                 |
| `Ctrl + M`         | Focus navigation             |
| `Ctrl + Shift + ?` | Show help                    |

### ♿ Screen Reader Tips

1. Press `Tab` immediately on page load to activate skip link
2. All interactive elements have descriptive labels
3. Current page is marked with `aria-current="page"`
4. Focus indicators are clearly visible

---

## For Developers

### Using Text-to-Speech in Components

```jsx
import { useTextToSpeech } from "../utils/accessibility";

function MyComponent() {
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  return (
    <button onClick={() => speak("Hello world")} aria-label="Read text aloud">
      {isSpeaking ? "Stop" : "Read Aloud"}
    </button>
  );
}
```

### Adding Translations

1. **Add to all locale files** (`src/locales/*.json`):

   ```json
   {
     "common": {
       "myNewString": "English text"
     }
   }
   ```

2. **Use in components**:

   ```jsx
   import { useTranslation } from "react-i18next";

   function MyComponent() {
     const { t } = useTranslation();
     return <button>{t("common.myNewString")}</button>;
   }
   ```

### Adding ARIA Labels

```jsx
import { createAriaLabel, getAriaExpandedAttributes } from '../utils/accessibility';

// For buttons
<button {...createAriaLabel('Save settings')}>
  Save
</button>

// For expandable content
<button {...getAriaExpandedAttributes('content-id', isOpen)}>
  Expand
</button>
```

### Focus Management Hook

```jsx
import { useFocusManagement } from "../utils/accessibility";

function MyFocusableComponent() {
  const { containerRef, focusFirst, focusNext } = useFocusManagement();

  return (
    <div ref={containerRef}>
      {/* Tab/Shift+Tab automatically manages focus */}
      <button>First button</button>
      <button>Second button</button>
    </div>
  );
}
```

---

## Important Files

```
src/
├── i18n/
│   └── i18n.js                     # Configuration
├── locales/                        # Translation files
│   ├── en.json, es.json, etc.
├── utils/accessibility/           # Accessibility code
│   ├── textToSpeechService.js
│   ├── useTextToSpeech.js
│   ├── useFocusManagement.js
│   ├── useKeyboardShortcut.js
│   └── ariaUtils.js
├── components/
│   ├── GlobalKeyboardHandler.jsx   # Keyboard shortcuts
│   ├── LanguageAndAccessibilitySettings.jsx
│   └── NavBar.jsx                  # Enhanced with ARIA
└── App.jsx                         # Has i18n provider + main region
```

---

## Testing Accessibility

### With Screen Reader (NVDA/JAWS)

1. Enable screen reader
2. Press `Tab` to activate skip link
3. Navigate through page with arrow keys
4. Listen for aria-labels and descriptions

### With Keyboard Only

1. Close touchpad/mouse
2. Navigate using Tab/Shift+Tab
3. Use Enter/Space to activate buttons
4. Test all keyboard shortcuts

### With Visual Testing

1. Enable high-contrast mode in Settings
2. Test with multiple font sizes
3. Verify focus indicators are visible
4. Test dark/light modes

---

## Common Issues & Solutions

| Issue                             | Solution                                      |
| --------------------------------- | --------------------------------------------- |
| Text-to-Speech not working        | Check browser compatibility, may need refresh |
| Language not changing             | Clear localStorage, reload page               |
| Focus indicator not visible       | Check CSS, ensure focus styles applied        |
| Screen reader not reading content | Verify ARIA labels are present                |

---

## Resources

- [Full Accessibility Guide](./ACCESSIBILITY_GUIDE.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [i18next Docs](https://www.i18next.com/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

## Need Help?

1. Check the [Accessibility Guide](./ACCESSIBILITY_GUIDE.md) for detailed info
2. Review code examples in this document
3. Check developer console for errors
4. Test with accessibility tools (Axe, Lighthouse)

Happy coding! ♿🌍
