
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

export interface Note {
  id: string;
  text: string; // The selected text from the book
  note: string; // The user's note
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

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  lastUpdatedAt: number;
}

export interface BookMetadata {
    id: string;
    title: string;
    author: string;
    coverImageUrl: string | null;
    progress: number;
    lastScrollTop: number;
    lastOpened?: number;
    readingTime: number; 
    genre?: string;
    hasSummary?: boolean;
    hasAudio?: boolean;
    isPdf?: boolean;
    fileUrl?: string;
    type?: 'pdf' | 'epub';
    storagePath?: string;
    fileName?: string;
}

export interface BookContent {
    id: string;
    chapters: Chapter[];
    toc: TocItem[];
    summaryScript?: string;
    audioSummaryUrl?: string;
    audioDuration?: number;
    pdfData?: Uint8Array;
}

export interface Book extends BookMetadata, BookContent {
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

export interface StickyNote {
  id: string;
  text: string;
  color: 'yellow' | 'pink' | 'blue' | 'green';
  x: number;
  y: number;
  rotation: number;
}

export interface ImageSticker {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  align?: 'left' | 'right' | 'center';
}

export interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  isHighlighter?: boolean;
}

export interface NotebookPageData {
  id: string;
  text: string;
  drawings: DrawingPath[];
  stickyNotes: StickyNote[];
  imageStickers: ImageSticker[];
}

export interface NotebookData {
  bookId: string;
  userId: string;
  drawings: string;
  stickyNotes: string;
  imageStickers?: string;
  pages?: string; // stringified NotebookPageData[]
  updatedAt: number;
}
