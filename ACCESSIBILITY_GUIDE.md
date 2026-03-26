# Sfera Accessibility & Internationalization Guide

This document provides comprehensive information about the accessibility features and multi-language support implemented in Sfera to help disabled users and users from diverse linguistic backgrounds.

## Table of Contents
1. [Accessibility Features](#accessibility-features)
2. [Multi-Language Support](#multi-language-support)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Reader Support](#screen-reader-support)
5. [Visual Accessibility](#visual-accessibility)
6. [Text-to-Speech](#text-to-speech)
7. [How to Use Accessibility Features](#how-to-use-accessibility-features)

---

## Accessibility Features

### Overview
Sfera is built with accessibility in mind to ensure users with disabilities can navigate and use the platform effectively. We've implemented WCAG 2.1 Level AA standards throughout the application.

### Supported Disabilities
- **Visual Impairments**: Screen reader support, high-contrast mode, adjustable font sizes
- **Motor Disabilities**: Full keyboard navigation, large click targets
- **Hearing Loss**: Text alternatives for audio content
- **Cognitive Disabilities**: Clear language, consistent navigation, high-contrast options
- **Speech Impairments**: Keyboard-only operation

---

## Multi-Language Support

### Supported Languages
Sfera supports the following languages to serve a global user base:

1. **English** (en) - Default language
2. **Spanish** (Español) - es
3. **French** (Français) - fr
4. **Italian** (Italiano) - it
5. **Simplified Chinese** (中文) - zh
6. **Japanese** (日本語) - ja

### Changing Your Language

#### Via Settings Page
1. Navigate to **Settings** from the main navigation
2. Scroll to **Accessibility & Language** section
3. Click the **Language** dropdown
4. Select your preferred language from the list
5. The application will immediately translate to your selected language
6. Your preference is saved automatically

#### Language Persistence
Your language preference is automatically saved in your browser's local storage. When you log back in, Sfera will use your previously selected language.

### How Translation Works
All user-facing text in Sfera is translated through the i18next library. This includes:
- Navigation menus and buttons
- Form labels and placeholders
- Error messages
- Notification text
- Modal and dialog content
- Post and comment text (when applicable)
- Settings descriptions

---

## Keyboard Navigation

### Tab Order
The application maintains a logical tab order that follows the visual flow:
1. Skip to main content link
2. Navigation menu items
3. Main content interactive elements
4. Footer links (if present)

### Keyboard Shortcuts

| Shortcut | Function | Use Case |
|----------|----------|----------|
| `Tab` | Move to next interactive element | Navigate through the page |
| `Shift + Tab` | Move to previous interactive element | Navigate backwards |
| `Enter` / `Space` | Activate buttons or links | Perform actions |
| `Escape` | Close dialogs/modals | Exit popups |
| `Alt + S` | Toggle text-to-speech | Hear page content read aloud |
| `Ctrl + K` / `Cmd + K` | Focus search field | Quickly search |
| `Ctrl + M` / `Cmd + M` | Focus navigation | Jump to navigation |
| `Ctrl + Shift + ?` | Show keyboard help | Display available shortcuts |

### Skip Link
A "Skip to main content" link appears at the top of every page (visible when focused). Press `Tab` immediately after loading a page to access it. This allows users to bypass the navigation and jump directly to page content.

### Focus Indicators
- All interactive elements have clear focus indicators
- In high-contrast mode, focus indicators become even more prominent
- Focus indicators follow keyboard navigation naturally

---

## Screen Reader Support

### ARIA Labels and Roles
All interactive elements have appropriate ARIA attributes:
- Navigation links have `aria-current="page"` when active
- Buttons have descriptive `aria-label` attributes
- Form fields have associated `aria-label` or `aria-labelledby`
- Live regions use `aria-live="polite"` for dynamic updates
- Modals use `aria-modal="true"` and `aria-labelledby`

### Supported Screen Readers
Sfera is tested and compatible with:
- **NVDA** (Windows) - Free and open-source
- **JAWS** (Windows) - Professional screen reader
- **VoiceOver** (macOS/iOS) - Built-in Apple screen reader
- **TalkBack** (Android) - Built-in Android screen reader

### Semantic HTML
The application uses semantic HTML elements:
- `<nav>` for navigation sections
- `<main>` for main content
- `<article>` for individual posts
- `<form>` and proper form elements
- Heading hierarchy (h1, h2, h3, etc.)

---

## Visual Accessibility

### High Contrast Mode
Activates a high-contrast color scheme for better visibility:

**How to Enable:**
1. Go to **Settings** → **Accessibility & Language**
2. Check the **High Contrast Mode** checkbox
3. The page will immediately apply high-contrast colors

**Benefits:**
- Increased contrast ratio between text and background
- More prominent focus indicators
- Reduced eye strain for users with low vision
- Better compatibility with light-sensitive users

### Adjustable Font Size

**Available Sizes:**
- Small (87.5% of default)
- Medium (100%, default)
- Large (112.5%)
- Extra Large (125%)

**How to Change:**
1. Go to **Settings** → **Accessibility & Language**
2. Use the **Font Size** dropdown
3. Select your preferred size
4. Click the reset button to return to default

The font size adjustment persists across sessions and applies to all text in the application.

### Color Contrast
- All text meets WCAG AA standards (4.5:1 contrast ratio for normal text)
- Dark mode is available for users who prefer reduced brightness
- Colors are not used as the only means of conveying information

### Reduced Motion
Users can enable "Reduce motion" in their operating system preferences:
- Animations are automatically disabled
- Transitions are minimized
- Page loads faster without motion effects

---

## Text-to-Speech

### Features
Sfera includes built-in text-to-speech capabilities powered by the Web Speech API:
- Read aloud any page or post
- Multiple language support
- Adjustable speech rate
- Work across all major browsers

### How to Use Text-to-Speech

#### Enabling Text-to-Speech:
1. Go to **Settings** → **Accessibility & Language**
2. Check **Enable Text to Speech**
3. Click **Read Aloud** to start listening

#### Keyboard Shortcut:
- Press `Alt + S` to toggle text-to-speech for main content
- The first 500 characters of the page will be read aloud

#### Testing the Feature:
1. Enable text-to-speech in settings
2. Click the **Read Aloud** button to test your language

### Language Support
Text-to-speech automatically uses your selected language:
- English, Spanish, French, Italian: Full support
- Chinese, Japanese: Supported on compatible browsers

### Browser Compatibility
| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ Full | Full voice and language support |
| Firefox | ✅ Full | Full voice and language support |
| Safari | ✅ Full | Uses system voices |
| Mobile browsers | ✅ Full | Works with device text-to-speech |

---

## How to Use Accessibility Features

### For Users with Visual Impairments

1. **First Time Setup:**
   - Load Sfera in your preferred screen reader
   - Press Tab to activate "Skip to main content"
   - The page will be read chronologically starting from navigation

2. **Navigation:**
   - Use Tab/Shift+Tab to move between interactive elements
   - Your screen reader will announce each element
   - Use arrow keys within lists and menus when opened

3. **Using Posts:**
   - Each post is marked as an `<article>` for screen readers
   - Action buttons (like, comment, share) are clearly labeled
   - Images have alt text (if provided by poster)

4. **Text-to-Speech:**
   - Enable in settings if you want automatic reading
   - Use Alt+S to hear page content read aloud
   - Adjust language in settings for correct pronunciation

### For Users with Motor Disabilities

1. **Keyboard-Only Navigation:**
   - All features are accessible via keyboard
   - No mouse required
   - Tab order is logical and intuitive

2. **Extended Click Targets:**
   - All buttons and links are sized for easy clicking
   - Minimum touch target size: 44x44 pixels
   - Spacing between interactive elements prevents accidental clicks

3. **Customization:**
   - Adjust font size for better visibility
   - Enable high-contrast mode
   - Use keyboard shortcuts for faster navigation

### For Users with Cognitive Disabilities

1. **Clear Language:**
   - Simple, direct language throughout
   - Consistent terminology
   - Short, focused sentences in descriptions

2. **Consistent Design:**
   - Navigation in the same location on every page
   - Predictable button placement
   - Clear visual hierarchy

3. **Language Selection:**
   - Available in 6 languages
   - Text in your native language reduces cognitive load
   - Settings help users find what they need

4. **High Contrast & Large Text:**
   - Reduces mental processing load
   - Makes content easier to focus on
   - High-contrast mode available

### For Users with Hearing Impairments

1. **No Audio-Only Events:**
   - All notifications provide visual alternatives
   - Text representations of all information
   - No sound-only alerts

2. **Captions:**
   - Any user-generated video content should include captions
   - (Platform support for contributor captions recommended)

---

## Accessibility Standards & Compliance

### Standards Met
- **WCAG 2.1 Level AA**: Web Content Accessibility Guidelines
- **Section 508**: U.S. federal accessibility standards
- **ADA Compliance**: Americans with Disabilities Act

### Testing & Validation
- Automated accessibility audits (Axe, Lighthouse)
- Manual testing with assistive technologies
- User testing with people with disabilities
- Keyboard navigation testing
- Screen reader compatibility testing

---

## Tips for Best Experience

### For Screen Reader Users:
- Use Ctrl+Shift+? to view keyboard shortcuts while in-app
- Enable text-to-speech for additional reading feedback
- Use Alt+S as a quick way to hear page content

### For Low Vision Users:
- Combine high-contrast mode with large font for maximum clarity
- Use web browser zoom for additional magnification (Ctrl/Cmd + Plus)
- Consider using your operating system's magnification tool

### For Motor Disability Users:
- Learn keyboard shortcuts for faster navigation
- Use Ctrl+K to quickly access search if available
- Tab through the page to explore all content

### For Deaf/Hard of Hearing Users:
- All essential information is provided in text form
- Notification settings can be adjusted in Settings
- No content relies solely on audio

---

## File Structure

### Accessibility Code Organization
```
src/
├── utils/
│   └── accessibility/
│       ├── index.js                    # Main export file
│       ├── textToSpeechService.js      # Web Speech API wrapper
│       ├── useTextToSpeech.js          # React hook for TTS
│       ├── useFocusManagement.js       # Focus management hook
│       ├── useKeyboardShortcut.js      # Keyboard shortcut hook
│       └── ariaUtils.js                # ARIA helper functions
├── i18n/
│   └── i18n.js                         # i18next configuration
├── locales/
│   ├── en.json                         # English translations
│   ├── es.json                         # Spanish translations
│   ├── fr.json                         # French translations
│   ├── it.json                         # Italian translations
│   ├── zh.json                         # Chinese translations
│   └── ja.json                         # Japanese translations
├── components/
│   ├── GlobalKeyboardHandler.jsx       # Global keyboard shortcut handler
│   ├── LanguageAndAccessibilitySettings.jsx  # Settings component
│   └── NavBar.jsx                      # Enhanced with ARIA
└── index.css                           # Accessibility styles
```

---

## Developer Guide

### Adding Text-to-Speech to Components

```jsx
import { useTextToSpeech } from '../utils/accessibility';

function MyComponent() {
  const { speak, stop, isSpeaking } = useTextToSpeech();
  
  return (
    <button onClick={() => speak('Hello world')}>
      {isSpeaking ? 'Stop' : 'Read Aloud'}
    </button>
  );
}
```

### Using ARIA Utilities

```jsx
import { createAriaLabel, getAriaExpandedAttributes } from '../utils/accessibility';

function AccordionItem({ title, isOpen, toggle }) {
  return (
    <button
      {...createAriaLabel(title)}
      {...getAriaExpandedAttributes('panel-id', isOpen)}
      onClick={toggle}
    >
      {title}
    </button>
  );
}
```

### Adding Translation Keys

1. Add translation keys to all locale files in `src/locales/`
2. Use in components with `useTranslation` hook:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('common.save')}</button>;
}
```

---

## Support & Feedback

### Reporting Accessibility Issues
If you encounter any accessibility barriers while using Sfera:
1. Document the issue (what you were trying to do, what went wrong)
2. Note your browser, assistive technology, and operating system
3. Contact support with details

### Contributing Accessibility Improvements
We welcome contributions to improve accessibility:
- Submit pull requests with ARIA enhancements
- Add translations for new languages
- Improve keyboard navigation
- Enhance focus management

---

## Resources

### Learning More
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility Info](https://webaim.org/)
- [i18next Documentation](https://www.i18next.com/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

### Helpful Tools
- **Axe DevTools**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built-in Chrome accessibility audits
- **NVDA**: Free screen reader
- **Color Contrast Checker**: WebAIM contrast checker

---

## Version History

### v1.0 - Initial Release
- ✅ 6 language support (English, Spanish, French, Italian, Chinese, Japanese)
- ✅ Text-to-speech with Web Speech API
- ✅ ARIA labels and semantic HTML
- ✅ High-contrast mode
- ✅ Adjustable font sizes
- ✅ Full keyboard navigation
- ✅ Keyboard shortcuts
- ✅ Skip links
- ✅ Focus management
- ✅ Screen reader support

---

## Questions?

For accessibility-related questions or concerns:
- Check this guide first
- Review the FAQ section
- Contact support with specifics

Thank you for using Sfera and helping us build a more accessible platform!
