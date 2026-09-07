/// <reference types="astro/client" />

declare global {
  interface Window {
    posthog?: {
      isFeatureEnabled: (key: string) => boolean | undefined;
      onFeatureFlags: (callback: (flags: Record<string, boolean>) => void) => void;
      init: (...args: any[]) => void;
      [key: string]: any;
    };
  }
}

export {};
