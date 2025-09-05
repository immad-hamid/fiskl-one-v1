# AI Styling Conventions for Fiskl Project

## 🤖 For AI Tools: MANDATORY Styling Rules

**IMPORTANT**: When any AI tool (Claude, ChatGPT, etc.) works on this project, they MUST follow these conventions:

### ❌ NEVER DO

```scss
// ❌ FORBIDDEN: Never hardcode colors
.component {
  background: #667eea;
  color: #333333;
  border: 1px solid #dddddd;
}

// ❌ FORBIDDEN: Never hardcode spacing
.component {
  padding: 16px 24px;
  margin: 20px;
}

// ❌ FORBIDDEN: Never override NG-ZORRO directly
.ant-btn-primary {
  background: #667eea !important;
}

// ❌ FORBIDDEN: Never create component-specific branding
.my-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### ✅ ALWAYS DO

```scss
// ✅ REQUIRED: Always use CSS variables
.component {
  background: var(--fiskl-primary-main);
  color: var(--fiskl-text-primary);
  border: 1px solid var(--fiskl-border-base);
}

// ✅ REQUIRED: Always use spacing tokens
.component {
  padding: var(--fiskl-spacing-md) var(--fiskl-spacing-lg);
  margin: var(--fiskl-spacing-lg);
}

// ✅ REQUIRED: Use utility classes when possible
<div class="fiskl-p-lg fiskl-rounded-md fiskl-shadow-sm">
```

### 🎨 Available Design Tokens

**Colors:**
- `--fiskl-primary-main`, `--fiskl-primary-dark`, `--fiskl-primary-light`
- `--fiskl-success`, `--fiskl-warning`, `--fiskl-error`
- `--fiskl-text-primary`, `--fiskl-text-secondary`, `--fiskl-text-tertiary`
- `--fiskl-bg-primary`, `--fiskl-bg-secondary`, `--fiskl-bg-layout`
- `--fiskl-border-base`, `--fiskl-border-light`, `--fiskl-border-focus`

**Spacing:**
- `--fiskl-spacing-xs` (4px) to `--fiskl-spacing-xxl` (40px)

**Typography:**
- `--fiskl-font-size-xs` (12px) to `--fiskl-font-size-xxl` (28px)
- `--fiskl-font-weight-normal` to `--fiskl-font-weight-bold`

**Other:**
- `--fiskl-radius-sm` to `--fiskl-radius-xl`
- `--fiskl-shadow-sm` to `--fiskl-shadow-lg`
- `--fiskl-gradient-primary`, `--fiskl-gradient-subtle`

### 📏 Component Creation Rules

**When creating new components:**

1. **Use theme tokens only**:
```scss
.new-component {
  background: var(--fiskl-bg-primary);
  color: var(--fiskl-text-primary);
  padding: var(--fiskl-spacing-lg);
  border-radius: var(--fiskl-radius-md);
  box-shadow: var(--fiskl-shadow-sm);
}
```

2. **Let NG-ZORRO handle the theming**:
```html
<!-- NG-ZORRO components automatically use theme -->
<button nz-button nzType="primary">Themed Button</button>
<nz-card>Themed Card</nz-card>
```

3. **Add utility classes for quick styling**:
```html
<div class="fiskl-p-lg fiskl-m-md fiskl-rounded-lg fiskl-shadow-md">
  Content with theme utilities
</div>
```

### 🌙 Theme Support Rules

**All components must support theme switching:**

1. **Use CSS variables** (not Less/SCSS variables in components)
2. **Test both light and dark themes**
3. **Never hardcode theme-specific values**

### 🚫 Absolute Prohibitions

1. **NO hardcoded hex colors** (`#667eea`, `#333`, etc.)
2. **NO hardcoded pixel values** for spacing (`16px`, `24px`, etc.)
3. **NO !important overrides** on NG-ZORRO components
4. **NO component-specific gradients** (use utilities instead)
5. **NO theme-specific CSS** in component files

### 📋 Checklist for AI Tools

Before completing any styling task, verify:

- [ ] Used CSS variables instead of hardcoded values
- [ ] Used theme tokens for all colors, spacing, typography
- [ ] Tested component in both light and dark themes
- [ ] Used NG-ZORRO components where possible
- [ ] Added utility classes instead of custom CSS when appropriate
- [ ] No !important declarations on theme properties
- [ ] Component works with theme switching

### 🔧 How to Add New Design Tokens

If new colors/spacing/etc. are needed:

1. **Add to `src/theme.less`**:
```less
@fiskl-new-token: #value;
@ng-zorro-variable: @fiskl-new-token;
```

2. **Add to `src/styles/tokens.css`**:
```css
:root {
  --fiskl-new-token: #value;
}

[data-theme="dark"] {
  --fiskl-new-token: #dark-value;
}
```

3. **Document in this file** for future AI reference

### 🎯 Quick Reference for AI

**Instead of writing custom CSS, ask:**
1. "Can I use an existing NG-ZORRO component?"
2. "Can I use utility classes instead?"
3. "Are there existing theme tokens for this?"
4. "Does this work in dark theme?"

### ⚠️ Emergency Override Protocol

**ONLY if absolutely necessary and approved by human developer:**

```scss
.emergency-override {
  // Clearly document WHY this override is needed
  // Include ticket/issue reference
  property: value !important; // TODO: Remove after NG-ZORRO update
}
```

### 📖 References

- Main theme file: `src/theme.less`
- CSS variables: `src/styles/tokens.css`
- Documentation: `THEME_README.md`
- Utility classes: Available in `tokens.css`

---

## 🎯 Summary for AI Tools

**Golden Rule**: If you're writing custom CSS with hardcoded values, you're doing it wrong. Use theme tokens and NG-ZORRO components instead.

**Theme switching must work flawlessly** - this is non-negotiable.

**When in doubt**, use existing NG-ZORRO components and utility classes rather than creating custom styles.