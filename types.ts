
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
  location?: string; // e.g. chapter ID
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
    coverImageUrl: string | null;
    chapters: Chapter[];
    toc: TocItem[];
    progress: number; // 0-1 (e.g. 0.5 for 50%)
    lastScrollTop: number;
    audioTrailerUrl?: string;
    trailerScript?: string;
}
