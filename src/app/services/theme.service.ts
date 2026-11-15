import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core';
import { ColorMode } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  mode: ColorMode = 'system';
  get isDark(): boolean { return this.document.documentElement.dataset['theme'] === 'dark'; }
  private timer?: ReturnType<typeof setTimeout>;
  private readonly mediaQuery?: MediaQueryList;
  private readonly mediaListener = () => this.applyTheme();
  private readonly visibilityListener = () => {
    if (this.document.visibilityState === 'visible') this.applyTheme();
  };

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.mediaListener);
      this.document.addEventListener('visibilitychange', this.visibilityListener);
      const saved = localStorage.getItem('bills-manager-color-mode');
      this.mode = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
      this.applyTheme();
    }
  }

  setMode(mode: ColorMode, persist = true): void {
    this.mode = mode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('bills-manager-color-mode', mode);
      this.applyTheme();
    }
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.mediaListener);
    this.document.removeEventListener('visibilitychange', this.visibilityListener);
    if (this.timer) clearTimeout(this.timer);
  }

  private applyTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const hour = new Date().getHours();
    const isDark = this.mode === 'dark' || (this.mode === 'system' && (hour < 7 || hour >= 19));
    this.document.documentElement.dataset['theme'] = isDark ? 'dark' : 'light';
    if (this.timer) clearTimeout(this.timer);
    if (this.mode === 'system') {
      const nextHour = new Date();
      nextHour.setHours(hour < 7 ? 7 : hour < 19 ? 19 : 31, 0, 0, 0);
      this.timer = setTimeout(() => this.applyTheme(), Math.max(1000, nextHour.getTime() - Date.now()));
    }
  }
}
