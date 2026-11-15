export type ColorMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferences?: {
    language?: 'pt-BR' | 'en-GB';
    colorMode?: ColorMode;
  };
}

export interface UpdateUserProfile {
  firstName?: string;
  lastName?: string;
  language?: 'pt-BR' | 'en-GB';
  colorMode?: ColorMode;
}
