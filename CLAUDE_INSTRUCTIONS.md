# Claude Instructions for Fiskl Project

## 🚨 MANDATORY STYLING RULES

**When working on this project, you MUST follow these conventions:**

### ❌ NEVER USE:
- Hardcoded colors: `#667eea`, `#333`, `white`, etc.
- Hardcoded spacing: `16px`, `24px`, `margin: 20px`, etc.  
- Direct NG-ZORRO overrides: `.ant-btn-primary { background: #667eea !important; }`

### ✅ ALWAYS USE:
- CSS variables: `var(--fiskl-primary-main)`, `var(--fiskl-text-primary)`
- Theme tokens: `var(--fiskl-spacing-md)`, `var(--fiskl-radius-sm)`
- NG-ZORRO components: They inherit theme automatically

### 📋 Quick Token Reference:

**Colors:**
```css
var(--fiskl-primary-main)    /* #667eea - Main brand color */
var(--fiskl-text-primary)    /* #333333 - Primary text */
var(--fiskl-text-secondary)  /* #666666 - Secondary text */
var(--fiskl-bg-primary)      /* #ffffff - Main background */
var(--fiskl-success)         /* #52c41a - Success green */
var(--fiskl-error)           /* #ff4d4f - Error red */
```

**Spacing:**
```css
var(--fiskl-spacing-xs)      /* 4px */
var(--fiskl-spacing-sm)      /* 8px */
var(--fiskl-spacing-md)      /* 16px */
var(--fiskl-spacing-lg)      /* 24px */
var(--fiskl-spacing-xl)      /* 32px */
```

**Other:**
```css
var(--fiskl-radius-sm)       /* 4px border radius */
var(--fiskl-shadow-md)       /* Standard box shadow */
var(--fiskl-gradient-primary) /* Main gradient */
```

### 🎨 Example Component:
```scss
.my-component {
  background: var(--fiskl-bg-primary);
  color: var(--fiskl-text-primary);
  padding: var(--fiskl-spacing-lg);
  border-radius: var(--fiskl-radius-md);
  box-shadow: var(--fiskl-shadow-sm);
}
```

### 🌙 Theme Support:
- All components must work in light AND dark themes
- Use CSS variables (not Less variables) in component styles
- Test theme switching: `themeService.toggleTheme()`

### 📚 References:
- **Detailed docs**: `frontend/THEME_README.md`
- **AI conventions**: `frontend/AI_STYLING_CONVENTIONS.md` 
- **Theme tokens**: `frontend/src/styles/tokens.css`
- **NG-ZORRO theme**: `frontend/src/theme.less`

### 🔧 Theme Service Usage:
```typescript
// Inject theme service
constructor(private themeService: ThemeService) {}

// Toggle theme
this.themeService.toggleTheme();

// Check current theme
const isDark = this.themeService.isDarkTheme();
```

## 🎯 GOLDEN RULE:
**If you're writing custom CSS with hardcoded values, you're doing it wrong. Use theme tokens and NG-ZORRO components instead.**

---

## Current Project Status:
- ✅ Authentication system with login/logout
- ✅ Complete theme system (light/dark modes)
- ✅ FBR API endpoints moved to backend
- ✅ Header with theme toggle and user info
- ✅ All NG-ZORRO components themed

## Available Services:
- `AuthService` - Authentication & user management
- `ThemeService` - Theme switching (light/dark/high-contrast)
- `FbrLookupService` - FBR API calls (now via backend)

## Authentication:
- Demo credentials: `admin@fiskl.com` / `admin123`
- All routes protected by `authGuard`
- Session stored in sessionStorage
- Login page shows full-screen (no sidebar/header)