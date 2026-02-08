
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
  createdAt?: number;
}

export interface Chapter {
    id: string;
    href: string;
    html: string;
    label: string;
    textContent: string;
}

export interface ReadingActivity {
    date: string; // YYYY-MM-DD
    seconds: number;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    coverImageUrl: string | null;
    chapters: Chapter[];
    toc: TocItem[];
    progress: number;
    lastScrollTop: number;
    lastOpened?: number;
    readingTime: number; 
    genre?: string;
    
    audioSummaryUrl?: string;
    summaryScript?: string;
    audioDuration?: number;

    epubFile?: File | Blob;
}

export interface ThemeColors {
  'primary': string;
  'secondary': string;
  'background': string;
  'surface': string;
  'primary-text': string;
  'secondary-text': string;
  'muted-text': string;
  'border-color': string;
}

export interface ThemeFont {
  name: string;
  sans: string;
  serif: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  font: ThemeFont;
  fontSize: number;
  lineHeight: number;
  texture: string;
  readingMode: 'scroll' | 'page';
}
