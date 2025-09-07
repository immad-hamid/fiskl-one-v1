import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'high-contrast';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'fiskl-theme';
  private currentThemeSubject = new BehaviorSubject<Theme>('light');
  
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.initTheme();
    this.listenForSystemThemeChanges();
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initTheme(): void {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemPrefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    let theme: Theme = 'light';
    
    if (savedTheme) {
      theme = savedTheme;
    } else if (systemPrefersHighContrast) {
      theme = 'high-contrast';
    } else if (systemPrefersDark) {
      theme = 'dark';
    }
    
    this.setTheme(theme, false); // Don't save to localStorage on init if using system preference
  }

  /**
   * Set the current theme
   * @param theme - The theme to apply
   * @param save - Whether to save to localStorage (default: true)
   */
  setTheme(theme: Theme, save: boolean = true): void {
    console.log('Setting theme to:', theme);
    
    // Apply theme to DOM
    document.documentElement.setAttribute('data-theme', theme);
    console.log('data-theme attribute set on html:', document.documentElement.getAttribute('data-theme'));
    
    // Update state
    this.currentThemeSubject.next(theme);
    
    // Save to localStorage if requested
    if (save) {
      localStorage.setItem(this.STORAGE_KEY, theme);
      console.log('Theme saved to localStorage:', theme);
    }
    
    // Emit custom event for components that need to react to theme changes
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
    
    // Debug: Check if CSS variables are changing
    const rootStyles = getComputedStyle(document.documentElement);
    const bgColor = rootStyles.getPropertyValue('--fiskl-bg-primary').trim();
    const textColor = rootStyles.getPropertyValue('--fiskl-text-primary').trim();
    console.log('CSS Variables after theme change:', { bgColor, textColor });
  }

  /**
   * Get the current theme
   */
  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const current = this.getCurrentTheme();
    const newTheme: Theme = current === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Check if current theme is dark
   */
  isDarkTheme(): boolean {
    return this.getCurrentTheme() === 'dark';
  }

  /**
   * Check if current theme is high contrast
   */
  isHighContrastTheme(): boolean {
    return this.getCurrentTheme() === 'high-contrast';
  }

  /**
   * Listen for system theme changes
   */
  private listenForSystemThemeChanges(): void {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    darkModeQuery.addEventListener('change', (e) => {
      // Only auto-update if user hasn't manually set a preference
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        if (highContrastQuery.matches) {
          this.setTheme('high-contrast', false);
        } else {
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      }
    });
    
    highContrastQuery.addEventListener('change', (e) => {
      // High contrast always takes precedence if no manual preference
      if (!localStorage.getItem(this.STORAGE_KEY) && e.matches) {
        this.setTheme('high-contrast', false);
      }
    });
  }

  /**
   * Clear saved theme preference and use system default
   */
  clearThemePreference(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.initTheme();
  }

  /**
   * Get system theme preference
   */
  getSystemThemePreference(): Theme {
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return 'high-contrast';
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    } else {
      return 'light';
    }
  }

  /**
   * Check if user has manually set a theme preference
   */
  hasManualThemePreference(): boolean {
    return !!localStorage.getItem(this.STORAGE_KEY);
  }
}