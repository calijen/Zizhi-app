
export interface GenerationStatus {
  stage: string;
  progress: number;
  currentAction: string;
}

export interface TocItem {
  id: string;
  href: string;
  label: string;
  subitems?: TocItem[];
}

export interface Quote {
  id: string;
  text: string;
  bookTitle: string;
  author: string;
  bookId: string;
  location?: string;
}

export interface Chapter {
    id: string;
    href: string;
    html: string;
    label: string;
    textContent: string;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    coverImageUrl: string | null; // This will now store Base64 strings for persistence
    chapters: Chapter[];
    toc: TocItem[];
    progress: number;
    lastScrollTop: number;
    lastOpened?: number;
    readingTime: number; // Cumulative seconds spent reading this book
    
    // Summary fields
    audioSummaryUrl?: string;
    summaryScript?: string;
    audioDuration?: number;

    // For persistence (optional local file reference)
    epubFile?: File | Blob;
}

export interface ThemeColors {
  'primary': string;
  'secondary':string;
  'background': string;
  'primary-text': string;
  'secondary-text': string;
  'border-color': string;
}

export interface ThemeFont {
  name: string;
  sans: string;
  serif: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  font: ThemeFont;
  fontSize: number;
  lineHeight: number;
  texture: string;
}
