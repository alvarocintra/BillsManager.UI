import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

export type SupportedLanguage = 'pt-BR' | 'en-GB';

interface TextState {
  source: string;
  translated: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly supportedLanguages: SupportedLanguage[] = ['pt-BR', 'en-GB'];
  language: SupportedLanguage = 'en-GB';
  private translations: Record<string, string> = {};
  private observer?: MutationObserver;
  private readonly textStates = new WeakMap<Text, TextState>();
  private readonly attributeStates = new WeakMap<Element, Map<string, TextState>>();
  private started = false;

  constructor(
    private readonly http: HttpClient,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  initialize(): void {
    if (this.started || !isPlatformBrowser(this.platformId)) return;
    this.started = true;
    const saved = localStorage.getItem('bills-manager-language');
    const browserLanguage = navigator.language.toLowerCase();
    const initial: SupportedLanguage = saved === 'pt-BR' || saved === 'en-GB'
      ? saved
      : browserLanguage.startsWith('pt') ? 'pt-BR' : 'en-GB';

    this.observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData' && record.target instanceof Text) {
          this.translateText(record.target);
        } else if (record.type === 'attributes' && record.target instanceof Element && record.attributeName) {
          this.translateAttributes(record.target);
        }
        record.addedNodes.forEach(node => this.translateTree(node));
      }
    });
    this.observer.observe(this.document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label']
    });
    this.setLanguage(initial, false);
  }

  setLanguage(language: SupportedLanguage, persist = true): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.language = language;
    this.http.get<Record<string, string>>(`/i18n/${language}.json`).subscribe({
      next: dictionary => {
        this.translations = dictionary;
        this.document.documentElement.lang = language;
        if (persist) localStorage.setItem('bills-manager-language', language);
        this.translateTree(this.document.body);
      },
      error: error => console.error(`Unable to load ${language} translations`, error)
    });
  }

  private translateTree(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      this.translateText(node as Text);
      return;
    }
    if (node instanceof Element) this.translateAttributes(node);
    const walker = this.document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let text: Node | null;
    while ((text = walker.nextNode())) this.translateText(text as Text);
    if (node instanceof Element) node.querySelectorAll('*').forEach(element => this.translateAttributes(element));
  }

  private translateText(node: Text): void {
    const current = node.data;
    const state = this.textStates.get(node);
    const source = state && current === state.translated ? state.source : current;
    const trimmed = source.trim();
    let translation = this.translations[trimmed];
    if (translation === undefined) {
      for (const [pattern, translatedPattern] of Object.entries(this.translations)) {
        const placeholders = [...pattern.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)];
        if (!placeholders.length) continue;
        const expression = pattern
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\\\{\\\{\s*[^}]+?\s*\\\}\\\}/g, '(.+?)');
        const match = trimmed.match(new RegExp(`^${expression}$`));
        if (!match) continue;
        let index = 1;
        translation = translatedPattern.replace(/\{\{\s*[^}]+?\s*\}\}/g, () => match[index++]);
        break;
      }
    }
    if (translation === undefined) {
      if (state && current === state.translated) node.data = source;
      this.textStates.delete(node);
      return;
    }
    const translated = source.replace(trimmed, translation);
    this.textStates.set(node, { source, translated });
    if (node.data !== translated) node.data = translated;
  }

  private translateAttributes(element: Element): void {
    for (const name of ['placeholder', 'title', 'aria-label']) {
      const current = element.getAttribute(name);
      if (current === null) continue;
      let states = this.attributeStates.get(element);
      if (!states) {
        states = new Map<string, TextState>();
        this.attributeStates.set(element, states);
      }
      const state = states.get(name);
      const source = state && current === state.translated ? state.source : current;
      const translated = this.translations[source.trim()];
      if (translated === undefined) {
        if (state && current === state.translated) element.setAttribute(name, source);
        states.delete(name);
      } else {
        states.set(name, { source, translated });
        if (current !== translated) element.setAttribute(name, translated);
      }
    }
  }
}
