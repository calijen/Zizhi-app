import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TocItem, Quote, Book, Chapter } from './types';
import * as db from './db';
import Library, { BookCardData } from './components/FileUpload';
import QuotesView from './components/QuotesView';
import TextSelectionPopup from './components/TextSelectionPopup';
import Toast from './components/Toast';
import TrailerView from './components/TrailerView';
import { 
  IconMenu, IconClose, IconChevronLeft, IconUpload, IconDownload, Logo
} from './components/icons';
import { GoogleGenAI, Modality } from "@google/genai";


declare global {
  interface Window {
    JSZip: any;
  }
}

const BookStyles = () => {
  const styles = `
    .book-content-view {
      padding: 1rem 1rem 2rem 1rem;
      line-height: 1.7;
      font-size: 1rem;
      font-family: 'Lora', serif;
      color: #333333;
      background-color: #FAFAFA;
      user-select: text;
      overflow-wrap: break-word;
      width: 100%;
      box-sizing: border-box;
    }
    
    /* AGGRESSIVE RESPONSIVE OVERRIDES */
    .book-content-view * {
        max-width: 100% !important;
        min-width: 0 !important;
        width: auto !important;
        height: auto !important;
        box-sizing: border-box !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        /* Disable columns which can break single-column mobile layouts */
        column-count: 1 !important;
        column-width: auto !important;
        column-gap: 0 !important;
    }
    .book-content-view table, .book-content-view pre {
        white-space: pre-wrap !important;
        width: 100% !important;
    }
    .book-content-view table {
         table-layout: fixed !important;
    }
    .book-content-view img, .book-content-view video, .book-content-view svg {
      margin: 1.5em auto !important;
      display: block !important;
      border-radius: 0.25rem;
    }
    .book-content-view style, .book-content-view link[rel=stylesheet] {
        display: none !important;
    }
    
    /* Keep existing typography styles */
    @media (min-width: 768px) {
      .book-content-view {
        padding: 2rem;
        line-height: 1.8;
        font-size: 1.125rem;
      }
    }
    .book-content-view ::selection {
      background-color: #5D8BF4;
      color: #FFFFFF;
    }
    .book-content-view h1, .book-content-view h2, .book-content-view h3, .book-content-view h4, .book-content-view h5, .book-content-view h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      line-height: 1.3;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      color: #1A2B6D;
    }
     @media (min-width: 768px) {
        .book-content-view h1, .book-content-view h2, .book-content-view h3, .book-content-view h4, .book-content-view h5, .book-content-view h6 {
            margin-top: 2em;
        }
     }
    .book-content-view p {
      margin-bottom: 1.2em;
    }
    .book-content-view a {
      color: #1A2B6D;
      text-decoration: underline;
    }
    .book-content-view ul, .book-content-view ol {
      margin-bottom: 1em;
      padding-left: 1.5em;
    }
    .book-content-view blockquote {
        border-left: 3px solid #1A2B6D;
        padding-left: 1em;
        margin-left: 0;
        font-style: italic;
        color: #333333;
    }
  `;
  return <style>{styles}</style>;
};

const App: React.FC = () => {
  const [library, setLibrary] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');

  const [selection, setSelection] = useState<{ text: string; top: number; left: number; right: number; chapterId: string; } | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: { label: string; onClick: () => void; } } | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes'>('library');
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [generatingTrailerForBookId, setGeneratingTrailerForBookId] = useState<string | null>(null);
  const [viewingTrailerForBook, setViewingTrailerForBook] = useState<Book | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);


  const viewerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<{[key: string]: HTMLElement}>({});
  const scrollTimeout = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const selectedBook = library.find(b => b.id === selectedBookId) || null;

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };
  
  const parseEpub = async (file: File): Promise<Book> => {
    if (typeof window.JSZip === 'undefined') {
      throw new Error('JSZip library not found.');
    }

    const getElementsByLocalName = (element: Element | Document, name: string): HTMLCollectionOf<Element> => {
        return element.getElementsByTagNameNS('*', name);
    };

    const pathJoin = (...parts: string[]): string => {
      const newPath = parts.join('/');
      const pathParts = newPath.split('/');
      const resultParts: string[] = [];
      for (const part of pathParts) {
          if (part === '.' || part === '') continue;
          if (part === '..') {
              if (resultParts.length > 0) resultParts.pop();
          } else {
              resultParts.push(part);
          }
      }
      return resultParts.join('/');
    };
    
    const zip = await window.JSZip.loadAsync(file);
    const parser = new DOMParser();
    
    const containerXml = await zip.file('META-INF/container.xml')?.async('string');
    if (!containerXml) throw new Error('META-INF/container.xml not found.');
    
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const opfPathEl = getElementsByLocalName(containerDoc, 'rootfile')[0];
    if (!opfPathEl) throw new Error("Could not find rootfile in container.xml");
    const opfPath = opfPathEl.getAttribute('full-path');
    if (!opfPath) throw new Error("Could not find full-path attribute on rootfile");

    const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/'));
    
    const opfXml = await zip.file(opfPath)?.async('string');
    if (!opfXml) throw new Error(`OPF file not found at ${opfPath}`);

    const opfDoc = parser.parseFromString(opfXml, 'application/xml');
    
    const metadataEl = getElementsByLocalName(opfDoc, 'metadata')[0];
    let title = 'Untitled Book';
    let author = 'Unknown Author';
    if (metadataEl) {
        title = getElementsByLocalName(metadataEl, 'title')[0]?.textContent || 'Untitled Book';
        author = getElementsByLocalName(metadataEl, 'creator')[0]?.textContent || 'Unknown Author';
    }

    const manifestItems = new Map<string, string>();
    Array.from(getElementsByLocalName(opfDoc, 'item')).forEach(item => {
        const id = item.getAttribute('id');
        const href = item.getAttribute('href');
        if (id && href) {
             const fullHref = pathJoin(opfDir, decodeURIComponent(href));
             manifestItems.set(id, fullHref);
        }
    });
    
    let coverImageUrl: string | null = null;
    const coverMeta = Array.from(getElementsByLocalName(opfDoc, 'meta')).find(meta => meta.getAttribute('name') === 'cover');
    if (coverMeta) {
        const coverId = coverMeta.getAttribute('content');
        if (coverId) {
            const coverPath = manifestItems.get(coverId);
            if (coverPath && zip.file(coverPath)) {
                const coverFile = zip.file(coverPath);
                if (coverFile) {
                    const blob = await coverFile.async('blob');
                    coverImageUrl = URL.createObjectURL(blob);
                }
            }
        }
    }

    const spineEl = getElementsByLocalName(opfDoc, 'spine')[0];
    if (!spineEl) throw new Error("Could not find spine in OPF file");
    
    const spineIds = Array.from(getElementsByLocalName(spineEl, 'itemref')).map(item => item.getAttribute('idref'));

    let tocNav: TocItem[] = [];

    // EPUB 3 Nav logic
    const navItem = Array.from(getElementsByLocalName(opfDoc, 'item')).find(item => item.getAttribute('properties') === 'nav');
    if (navItem) {
        const navItemId = navItem.getAttribute('id');
        if (navItemId) {
            const navPath = manifestItems.get(navItemId);
            if (navPath && zip.file(navPath)) {
                const navDir = navPath.substring(0, navPath.lastIndexOf('/'));
                const navXml = await zip.file(navPath)!.async('string');
                const navDoc = parser.parseFromString(navXml, 'application/xhtml+xml');
                const tocNavEl = Array.from(navDoc.getElementsByTagName('nav')).find(nav => nav.getAttribute('epub:type') === 'toc' || nav.getAttribute('role') === 'doc-toc');
                
                if (tocNavEl) {
                    const parseNavList = (listElement: Element): TocItem[] => {
                        return Array.from(listElement.children)
                            .filter((node): node is HTMLLIElement => node.tagName.toLowerCase() === 'li')
                            .map((item, index) => {
                                const link = item.querySelector('a');
                                const sublist = item.querySelector('ol, ul');
                                const href = link?.getAttribute('href') || '';
                                return {
                                    id: `nav-${navPath}-${index}`,
                                    label: link?.textContent?.trim() || '',
                                    href: pathJoin(navDir, decodeURIComponent(href)),
                                    subitems: sublist ? parseNavList(sublist) : [],
                                };
                            })
                            .filter(item => item.label && item.href);
                    };
                    const rootList = tocNavEl.querySelector('ol, ul');
                    if (rootList) {
                        tocNav = parseNavList(rootList);
                    }
                }
            }
        }
    }

    // EPUB 2 NCX fallback
    if (tocNav.length === 0) {
        const ncxId = spineEl.getAttribute('toc');
        if (ncxId) {
            const ncxPath = manifestItems.get(ncxId);
            if (ncxPath && zip.file(ncxPath)) {
                const ncxDir = ncxPath.substring(0, ncxPath.lastIndexOf('/'));
                const ncxXml = await zip.file(ncxPath).async('string');
                const ncxDoc = parser.parseFromString(ncxXml, 'application/xml');
                
                const parseNavPoints = (parent: Element): TocItem[] => {
                    const childNavPoints = Array.from(parent.children).filter(
                        (child): child is Element => child.localName === 'navPoint'
                    );

                    return childNavPoints.map(el => {
                        const navLabelEl = getElementsByLocalName(el, 'navLabel')[0];
                        const navLabel = navLabelEl ? (getElementsByLocalName(navLabelEl, 'text')[0]?.textContent || '') : '';
                        const contentSrc = getElementsByLocalName(el, 'content')[0]?.getAttribute('src') || '';
                        
                        return {
                            id: el.getAttribute('id') || `nav-${Math.random()}`, 
                            label: navLabel, 
                            href: pathJoin(ncxDir, decodeURIComponent(contentSrc)),
                            subitems: parseNavPoints(el)
                        };
                    });
                };
                const navMap = getElementsByLocalName(ncxDoc, 'navMap')[0];
                if (navMap) {
                    tocNav = parseNavPoints(navMap);
                }
            }
        }
    }

    const loadedChapters: Chapter[] = [];
    const tocMap = new Map(tocNav.flatMap(function flatten(item: TocItem): [string, TocItem][] {
        const self: [string, TocItem] = [item.href.split('#')[0], item];
        const children = item.subitems ? item.subitems.flatMap(flatten) : [];
        return [self, ...children];
    }));

    for (const id of spineIds) {
      if (!id) continue;
      const path = manifestItems.get(id);
      if (path && zip.file(path)) {
        const chapterHtml = await zip.file(path).async('string');
        const chapterDoc = parser.parseFromString(chapterHtml, 'application/xhtml+xml');
        
        const resolvePath = (base: string, relative: string) => {
            if (/^(https?|data):/.test(relative)) return relative;
            return pathJoin(base.substring(0, base.lastIndexOf('/')), relative);
        };

        const images = Array.from(chapterDoc.querySelectorAll('img, image'));
        for(const img of images) {
            const srcAttr = img.getAttribute('src') || img.getAttribute('xlink:href');
            if(srcAttr) {
                try {
                    const decodedSrc = decodeURIComponent(srcAttr);
                    const imgPath = resolvePath(path, decodedSrc);
                    if (/^(https?|data):/.test(imgPath)) {
                        img.setAttribute('src', imgPath);
                        continue;
                    }
                    const imgFile = zip.file(imgPath);
                    if (imgFile) {
                        const blob = await imgFile.async('blob');
                        const url = URL.createObjectURL(blob);
                        img.setAttribute('src', url);
                    }
                } catch (e) { console.error(`Could not process image src: ${srcAttr}`, e); }
            }
        }
        chapterDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove());
        
        const contentRoot = chapterDoc.body || chapterDoc.documentElement;
        const finalHtml = contentRoot.innerHTML;
        const textContent = contentRoot.textContent || '';

        const chapterId = path.split('/').pop()?.split('.')[0] || `chap-${Math.random()}`;
        loadedChapters.push({
            id: chapterId, href: path, html: finalHtml, textContent,
            label: tocMap.get(path.split('#')[0])?.label || 'Chapter'
        });
      }
    }
    
    return {
        id: `${file.name}-${file.size}`, title, author, coverImageUrl,
        chapters: loadedChapters, toc: tocNav, progress: 0, lastScrollTop: 0,
        epubFile: file,
    };
  };

  useEffect(() => {
    const loadLibraryFromDB = async () => {
        setIsLoading(true);
        try {
            const booksFromDb = await db.getBooks();
            const loadedBooks: Book[] = [];
            for (const bookData of booksFromDb) {
                if (bookData.epubFile) {
                    const epubFile = new File([bookData.epubFile], bookData.id, { type: 'application/epub+zip' });
                    const parsedData = await parseEpub(epubFile);
                    
                    loadedBooks.push({
                        ...parsedData,
                        id: bookData.id,
                        progress: bookData.progress,
                        lastScrollTop: bookData.lastScrollTop,
                        audioTrailerUrl: bookData.audioTrailerBlob ? URL.createObjectURL(bookData.audioTrailerBlob) : undefined,
                        trailerScript: bookData.trailerScript,
                        epubFile: epubFile,
                        audioTrailerBlob: bookData.audioTrailerBlob
                    });
                }
            }
            setLibrary(loadedBooks);
        } catch (e) {
            console.error("Failed to load library from DB", e);
            setError("Could not load saved books.");
        } finally {
            setIsLoading(false);
        }
    };
    loadLibraryFromDB();
  }, []);

  // Load quotes from local storage
  useEffect(() => {
    try {
      const storedQuotes = localStorage.getItem('zizhi-quotes');
      if (storedQuotes) setQuotes(JSON.parse(storedQuotes));
    } catch (e) {
      console.error("Failed to access localStorage", e);
    }
  }, []);

  // Save quotes to local storage
  useEffect(() => {
    try {
        localStorage.setItem('zizhi-quotes', JSON.stringify(quotes));
    } catch (e) { console.error("Failed to save quotes to localStorage", e); }
  }, [quotes]);

  const showToast = (message: string, action?: { label: string; onClick: () => void; }) => {
    setToast({ message, action });
  };
  
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (selectedFile?.type !== 'application/epub+zip') {
      setError('Invalid file type. Please upload an EPUB file.');
      return;
    }
    const bookId = `${selectedFile.name}-${selectedFile.size}`;
    if (library.some(b => b.id === bookId)) {
        showToast("This book is already in your library.");
        return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const newBook = await parseEpub(selectedFile);
      await db.saveBook(newBook);
      setLibrary(prev => [...prev, newBook]);
    } catch (e: any) {
      console.error(e);
      setError(`Failed to load book: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [library]);

  const handleBookSelect = (bookId: string) => {
    chapterRefs.current = {};
    setSelectedBookId(bookId);
  };
  
  const handleBackToLibrary = () => {
    if (selectedBook && viewerRef.current) {
      const { scrollTop } = viewerRef.current;
      const updatedBook = { ...selectedBook, lastScrollTop: scrollTop };
      setLibrary(lib => lib.map(b => 
          b.id === selectedBook.id ? updatedBook : b
      ));
      db.saveBook(updatedBook);
    }
    setSelectedBookId(null);
    setCurrentLocation('');
    chapterRefs.current = {};
  };

  useEffect(() => {
    if (!selectedBook || !viewerRef.current) return;
  
    const scrollTarget = pendingNavigation;
    if (pendingNavigation) {
      setPendingNavigation(null);
    }
  
    const tryToScroll = (attempt = 0) => {
      if (attempt > 20) {
        if (viewerRef.current) viewerRef.current.scrollTop = selectedBook.lastScrollTop;
        return;
      }
  
      if (scrollTarget) {
        const targetElement = chapterRefs.current[scrollTarget];
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setTimeout(() => tryToScroll(attempt + 1), 100);
        }
      } else {
        if (viewerRef.current) {
          viewerRef.current.scrollTop = selectedBook.lastScrollTop;
        }
      }
    };
  
    setTimeout(tryToScroll, 50);
  
  }, [selectedBook?.id, pendingNavigation]);

  useEffect(() => {
    if (!selectedBook) return;

    const observer = new IntersectionObserver(
        (entries) => {
            const intersectingEntry = entries.find(entry => entry.isIntersecting);
            if (intersectingEntry) {
                const chapter = selectedBook.chapters.find(c => c.id === intersectingEntry.target.id);
                if (chapter) setCurrentLocation(chapter.label.trim());
            }
        },
        { root: viewerRef.current, rootMargin: "0px", threshold: 0.2 }
    );
    const refs = chapterRefs.current;
    Object.keys(refs).forEach(key => {
      const el = refs[key];
      if (el) observer.observe(el);
    });
    return () => {
      Object.keys(refs).forEach(key => {
        const el = refs[key];
        if (el) observer.unobserve(el);
      });
    };
  }, [selectedBook, selectedBook?.id, selectedBook?.chapters]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setSelection(null); // Hide popup immediately on scroll
    if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current);
    scrollTimeout.current = window.setTimeout(() => {
        if (!viewerRef.current || !selectedBookId) return;
        const { scrollTop, scrollHeight, clientHeight } = viewerRef.current;
        const totalScrollable = scrollHeight - clientHeight;
        const progress = totalScrollable > 0 ? scrollTop / totalScrollable : 1;
        
        const currentBook = library.find(b => b.id === selectedBookId);
        if (currentBook) {
            const updatedBook = {
                ...currentBook,
                progress: Math.min(progress, 1),
                lastScrollTop: scrollTop
            };
            setLibrary(lib => lib.map(b => b.id === selectedBookId ? updatedBook : b));
            db.saveBook(updatedBook);
        }
    }, 150);
  }, [selectedBookId, library]);

  const navigateTo = (href: string) => {
    const chapterIdWithAnchor = href.split('/').pop();
    if (!chapterIdWithAnchor) return;
    const [chapterFile, elementId] = chapterIdWithAnchor.split('#');
    const chapterId = chapterFile.split('.')[0];
    const targetElement = elementId 
      ? document.getElementById(elementId) 
      : chapterRefs.current[chapterId];
    targetElement?.scrollIntoView({ behavior: 'smooth' });
    if(window.innerWidth < 1024) setIsSidebarOpen(false);
  };
  
  // Refactored text selection logic for better mobile reliability
  useEffect(() => {
    if (!selectedBook) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    const debounceTimeout = { current: 0 };

    const handleSelectionChange = () => {
        window.clearTimeout(debounceTimeout.current);

        debounceTimeout.current = window.setTimeout(() => {
            const sel = window.getSelection();

            // Condition to SHOW/UPDATE the popup
            if (sel && !sel.isCollapsed && viewer.contains(sel.anchorNode)) {
                const text = sel.toString().trim();
                if (text.length > 0) {
                    const range = sel.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    
                    if (rect.width < 1 && rect.height < 1) {
                        setSelection(null);
                        return;
                    }

                    const viewerRect = viewer.getBoundingClientRect();
        
                    let currentNode: Node | null = sel.anchorNode;
                    let chapterId: string | null = null;
                    while (currentNode && currentNode !== viewer) {
                        if (currentNode.nodeType === Node.ELEMENT_NODE) {
                            const element = currentNode as HTMLElement;
                            if (element.tagName.toLowerCase() === 'section' && element.id && selectedBook.chapters.some(c => c.id === element.id)) {
                                chapterId = element.id;
                                break;
                            }
                        }
                        currentNode = currentNode.parentNode;
                    }
        
                    if (chapterId) {
                        setSelection({
                            text,
                            top: rect.top - viewerRect.top + viewer.scrollTop,
                            left: rect.left - viewerRect.left + rect.width / 2,
                            right: rect.right - viewerRect.left,
                            chapterId: chapterId,
                        });
                    }
                    return;
                }
            }
            
            // Condition to HIDE the popup: selection is collapsed or outside the viewer.
            setSelection(null);
        }, 100); // Debounce to prevent flicker and excessive updates while dragging.
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        window.clearTimeout(debounceTimeout.current);
    };
  }, [selectedBook]);


  const handleCopy = () => {
    if(selection) {
        navigator.clipboard.writeText(selection.text);
        showToast('Copied to clipboard!');
        setSelection(null);
    }
  };
  const handleQuote = () => {
    if(selection && selectedBook) {
        const newQuote: Quote = {
            id: new Date().toISOString(),
            text: selection.text,
            bookTitle: selectedBook.title,
            author: selectedBook.author,
            bookId: selectedBook.id,
            location: selection.chapterId,
        };
        setQuotes(prev => [newQuote, ...prev]);
        showToast('Quote saved!', {
            label: 'View Quote',
            onClick: () => {
                if (selectedBook) {
                    handleBackToLibrary();
                }
                setActiveTab('quotes');
            }
        });
        setSelection(null);
    }
  };

  const generateColorPalette = (imageUrl: string): Promise<{ background: string; gradient: string; textPrimary: string; textSecondary: string; }> => {
    return new Promise((resolve) => {
      const defaultPalette = {
        background: '#FAFAFA',
        gradient: 'rgba(224, 224, 224, 0.4)',
        textPrimary: '#1D1919',
        textSecondary: '#202020',
      };

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(defaultPalette);
          return;
        }
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

        const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
          r /= 255; g /= 255; b /= 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b);
          let h = 0, s: number, l = (max + min) / 2;
          if (max === min) {
            h = s = 0;
          } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case r: h = (g - b) / d + (g < b ? 6 : 0); break;
              case g: h = (b - r) / d + 2; break;
              case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
          }
          return [h, s, l];
        };

        const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
          let r, g, b;
          if (s === 0) {
            r = g = b = l;
          } else {
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1 / 6) return p + (q - p) * 6 * t;
              if (t < 1 / 2) return q;
              if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
              return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
          }
          return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        };
        
        const [h, s] = rgbToHsl(r, g, b);

        const [bgR, bgG, bgB] = hslToRgb(h, s * 0.5, 0.96);
        const [tpR, tpG, tpB] = hslToRgb(h, s, 0.15);
        const [tsR, tsG, tsB] = hslToRgb(h, s, 0.25);
        
        resolve({
          background: `rgb(${bgR}, ${bgG}, ${bgB})`,
          gradient: `rgba(${r}, ${g}, ${b}, 0.2)`,
          textPrimary: `rgb(${tpR}, ${tpG}, ${tpB})`,
          textSecondary: `rgb(${tsR}, ${tsG}, ${tsB})`
        });
      };
      
      img.onerror = () => resolve(defaultPalette);
    });
  };

  const handleGenerateImage = async (quote: Quote) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const book = library.find(b => b.id === quote.bookId);
    
    const scale = 2; // For higher resolution
    const specWidth = 412;
    const specHeight = 645;
    canvas.width = specWidth * scale;
    canvas.height = specHeight * scale;
    ctx.scale(scale, scale);

    const palette = await generateColorPalette(book?.coverImageUrl || '');

    const wrapText = (text: string, maxWidth: number) => {
        const paragraphs = text.split('\n');
        const lines: string[] = [];
        paragraphs.forEach((p) => {
            const words = p.split(' ');
            let currentLine = '';
            for (let j = 0; j < words.length; j++) {
                const testLine = currentLine + words[j] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && j > 0) {
                    lines.push(currentLine.trim());
                    currentLine = words[j] + ' ';
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine.trim());
        });
        return lines;
    };

    // 1. Draw Background (Frame 2)
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, specWidth, specHeight);
    
    const gradient = ctx.createRadialGradient(specWidth / 2, specHeight / 2, 0, specWidth / 2, specHeight / 2, specWidth * 0.45);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, palette.gradient);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, specWidth, specHeight);
    
    // Layout constants from spec
    const outerPadding = 24;
    const innerPadding = 12;
    const contentX = outerPadding + innerPadding;
    const contentY = outerPadding + innerPadding;
    const contentWidth = specWidth - 2 * (outerPadding + innerPadding); // 340
    const gap = 27;

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    };

    let currentY = contentY;

    // 2. Draw Header
    const headerHeight = 96;
    const coverWidth = 78;
    const coverHeight = 96;
    const coverRadius = 8;
    if (book && book.coverImageUrl) {
      try {
        const coverImage = new Image();
        coverImage.crossOrigin = 'anonymous';
        coverImage.src = book.coverImageUrl;
        await new Promise<void>((resolve, reject) => {
          coverImage.onload = () => resolve();
          coverImage.onerror = reject;
        });
        
        ctx.save();
        drawRoundedRect(contentX, currentY, coverWidth, coverHeight, coverRadius);
        ctx.clip();
        ctx.drawImage(coverImage, contentX, currentY, coverWidth, coverHeight);
        ctx.restore();
      } catch (e) {
        ctx.fillStyle = '#E0E0E0';
        drawRoundedRect(contentX, currentY, coverWidth, coverHeight, coverRadius);
        ctx.fill();
      }
    }

    const titleAuthorX = contentX + coverWidth + gap;
    const titleAuthorWidth = contentWidth - coverWidth - gap;

    // Title drawing with wrapping
    ctx.fillStyle = palette.textPrimary;
    ctx.font = `600 18px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const originalTitleLines = wrapText(quote.bookTitle, titleAuthorWidth);
    const titleLines = originalTitleLines.slice(0, 2);
    if (originalTitleLines.length > 2) {
      let lastLine = titleLines[1];
      if (lastLine && lastLine.length > 3) {
        titleLines[1] = lastLine.substring(0, lastLine.length - 3) + '...';
      }
    }

    let authorY = currentY;
    const titleLineHeight = 26;
    titleLines.forEach((line, index) => {
      const lineY = currentY + (index * titleLineHeight);
      ctx.fillText(line, titleAuthorX + titleAuthorWidth, lineY, titleAuthorWidth);
      authorY = lineY + titleLineHeight;
    });

    // Author drawing
    ctx.fillStyle = palette.textSecondary;
    ctx.font = `600 16px Inter, sans-serif`;
    ctx.fillText(quote.author, titleAuthorX + titleAuthorWidth, authorY + 4, titleAuthorWidth);
    
    currentY += headerHeight + gap;

    // 3. Draw Quote Text with dynamic font size
    ctx.fillStyle = palette.textPrimary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const quoteHeight = 360;

    const findBestFitFont = () => {
        let fontSize = 20; // Start with max font size
        const minFontSize = 12; // Minimum font size

        while (fontSize >= minFontSize) {
            const lineHeight = fontSize * 1.8; // line height is 180% of font size
            ctx.font = `600 ${fontSize}px Lora, serif`;
            const lines = wrapText(quote.text, contentWidth);
            const totalHeight = lines.length * lineHeight;

            if (totalHeight <= quoteHeight) {
                return { fontSize, lineHeight, lines }; // Found a good fit
            }
            fontSize -= 1; // Decrease font size and try again
        }
        
        // Fallback: If it still doesn't fit at min font size, truncate.
        const lineHeight = minFontSize * 1.8;
        ctx.font = `600 ${minFontSize}px Lora, serif`;
        const lines = wrapText(quote.text, contentWidth);
        const maxLines = Math.floor(quoteHeight / lineHeight);
        if (lines.length > maxLines) {
            showToast("Quote is very long and has been truncated in the image.");
        }
        return { fontSize: minFontSize, lineHeight, lines: lines.slice(0, maxLines) };
    };

    const { lineHeight: quoteLineHeight, lines: linesToDraw } = findBestFitFont();
    
    const totalTextHeight = linesToDraw.length * quoteLineHeight;
    let quoteDisplayY = currentY;

    if (totalTextHeight < quoteHeight) {
        quoteDisplayY += (quoteHeight - totalTextHeight) / 2;
    }

    linesToDraw.forEach((line, index) => {
        ctx.fillText(line, contentX, quoteDisplayY + index * quoteLineHeight);
    });
    
    currentY += quoteHeight + gap;

    // 4. Draw Logo
    const logoImage = new Image();
    try {
        const svgText = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" zoomAndPan="magnify" viewBox="0 0 375 374.999991" height="500" preserveAspectRatio="xMidYMid meet" version="1.0"><defs><g/></defs><path stroke-linecap="round" transform="matrix(0, 0.75, -0.75, 0, 49.498384, 101.0039)" fill="none" stroke-linejoin="miter" d="M 14.00001 13.997846 L 216.661481 13.997846 " stroke="#071108" stroke-width="28" stroke-opacity="1" stroke-miterlimit="4"/><path stroke-linecap="round" transform="matrix(0.000000001309, 0.75, -0.75, 0.000000001309, 91.115571, 163.063672)" fill="none" stroke-linejoin="miter" d="M 13.998439 13.997846 L 133.920322 13.997846 " stroke="#071108" stroke-width="28" stroke-opacity="1" stroke-miterlimit="4"/><path stroke-linecap="round" transform="matrix(0.252893, 0.706077, -0.706077, 0.252893, 121.425897, 155.549815)" fill="none" stroke-linejoin="miter" d="M 14.001778 13.999631 L 143.73484 13.999655 " stroke="#071108" stroke-width="28" stroke-opacity="1" stroke-miterlimit="4"/><g fill="#071108" fill-opacity="1"><g transform="translate(182.267174, 257.847684)"><g><path d="M 5.9375 0 C 5 0 4.238281 -0.1875 3.65625 -0.5625 C 3.082031 -0.9375 2.691406 -1.445312 2.484375 -2.09375 C 2.285156 -2.75 2.285156 -3.476562 2.484375 -4.28125 C 2.691406 -5.082031 3.113281 -5.914062 3.75 -6.78125 L 25.140625 -35.78125 L 25.140625 -33.484375 L 5.375 -33.484375 C 4.332031 -33.484375 3.539062 -33.742188 3 -34.265625 C 2.457031 -34.796875 2.1875 -35.546875 2.1875 -36.515625 C 2.1875 -37.484375 2.457031 -38.21875 3 -38.71875 C 3.539062 -39.226562 4.332031 -39.484375 5.375 -39.484375 L 28.5625 -39.484375 C 29.488281 -39.484375 30.242188 -39.296875 30.828125 -38.921875 C 31.410156 -38.546875 31.800781 -38.039062 32 -37.40625 C 32.207031 -36.769531 32.207031 -36.039062 32 -35.21875 C 31.800781 -34.394531 31.382812 -33.554688 30.75 -32.703125 L 9.359375 -3.75 L 9.359375 -5.984375 L 29.953125 -5.984375 C 31.003906 -5.984375 31.800781 -5.734375 32.34375 -5.234375 C 32.882812 -4.734375 33.15625 -4 33.15625 -3.03125 C 33.15625 -2.050781 32.882812 -1.300781 32.34375 -0.78125 C 31.800781 -0.257812 31.003906 0 29.953125 0 Z M 5.9375 0 "/></g></g></g><g fill="#071108" fill-opacity="1"><g transform="translate(218.94243, 257.847684)"><g><path d="M 7.890625 0.453125 C 6.734375 0.453125 5.847656 0.125 5.234375 -0.53125 C 4.617188 -1.1875 4.3125 -2.09375 4.3125 -3.25 L 4.3125 -36.234375 C 4.3125 -37.429688 4.617188 -38.34375 5.234375 -38.96875 C 5.847656 -39.601562 6.734375 -39.921875 7.890625 -39.921875 C 9.046875 -39.921875 9.929688 -39.601562 10.546875 -38.96875 C 11.171875 -38.34375 11.484375 -37.429688 11.484375 -36.234375 L 11.484375 -3.25 C 11.484375 -2.09375 11.179688 -1.1875 10.578125 -0.53125 C 9.984375 0.125 9.085938 0.453125 7.890625 0.453125 Z M 7.890625 0.453125 "/></g></g></g><g fill="#071108" fill-opacity="1"><g transform="translate(237.532212, 257.847684)"><g><path d="M 5.9375 0 C 5 0 4.238281 -0.1875 3.65625 -0.5625 C 3.082031 -0.9375 2.691406 -1.445312 2.484375 -2.09375 C 2.285156 -2.75 2.285156 -3.476562 2.484375 -4.28125 C 2.691406 -5.082031 3.113281 -5.914062 3.75 -6.78125 L 25.140625 -35.78125 L 25.140625 -33.484375 L 5.375 -33.484375 C 4.332031 -33.484375 3.539062 -33.742188 3 -34.265625 C 2.457031 -34.796875 2.1875 -35.546875 2.1875 -36.515625 C 2.1875 -37.484375 2.457031 -38.21875 3 -38.71875 C 3.539062 -39.226562 4.332031 -39.484375 5.375 -39.484375 L 28.5625 -39.484375 C 29.488281 -39.484375 30.242188 -39.296875 30.828125 -38.921875 C 31.410156 -38.546875 31.800781 -38.039062 32 -37.40625 C 32.207031 -36.769531 32.207031 -36.039062 32 -35.21875 C 31.800781 -34.394531 31.382812 -33.554688 30.75 -32.703125 L 9.359375 -3.75 L 9.359375 -5.984375 L 29.953125 -5.984375 C 31.003906 -5.984375 31.800781 -5.734375 32.34375 -5.234375 C 32.882812 -4.734375 33.15625 -4 33.15625 -3.03125 C 33.15625 -2.050781 32.882812 -1.300781 32.34375 -0.78125 C 31.800781 -0.257812 31.003906 0 29.953125 0 Z M 5.9375 0 "/></g></g></g><g fill="#071108" fill-opacity="1"><g transform="translate(274.207468, 257.847684)"><g><path d="M 7.890625 0.453125 C 6.734375 0.453125 5.847656 0.125 5.234375 -0.53125 C 4.617188 -1.1875 4.3125 -2.09375 4.3125 -3.25 L 4.3125 -36.234375 C 4.3125 -37.429688 4.617188 -38.34375 5.234375 -38.96875 C 5.847656 -39.601562 6.734375 -39.921875 7.890625 -39.921875 C 9.046875 -39.921875 9.929688 -39.601562 10.546875 -38.96875 C 11.171875 -38.34375 11.484375 -37.429688 11.484375 -36.234375 L 11.484375 -23.015625 L 31.8125 -23.015625 L 31.8125 -36.234375 C 31.8125 -37.429688 32.117188 -38.34375 32.734375 -38.96875 C 33.347656 -39.601562 34.234375 -39.921875 35.390625 -39.921875 C 36.546875 -39.921875 37.429688 -39.601562 38.046875 -38.96875 C 38.660156 -38.34375 38.96875 -37.429688 38.96875 -36.234375 L 38.96875 -3.25 C 38.96875 -2.09375 38.660156 -1.1875 38.046875 -0.53125 C 37.429688 0.125 36.546875 0.453125 35.390625 0.453125 C 34.234375 0.453125 33.347656 0.125 32.734375 -0.53125 C 32.117188 -1.1875 31.8125 -2.09375 31.8125 -3.25 L 31.8125 -17.03125 L 11.484375 -17.03125 L 11.484375 -3.25 C 11.484375 -2.09375 11.179688 -1.1875 10.578125 -0.53125 C 9.984375 0.125 9.085938 0.453125 7.890625 0.453125 Z M 7.890625 0.453125 "/></g></g></g><g fill="#071108" fill-opacity="1"><g transform="translate(320.289412, 257.847684)"><g><path d="M 7.890625 0.453125 C 6.734375 0.453125 5.847656 0.125 5.234375 -0.53125 C 4.617188 -1.1875 4.3125 -2.09375 4.3125 -3.25 L 4.3125 -36.234375 C 4.3125 -37.429688 4.617188 -38.34375 5.234375 -38.96875 C 5.847656 -39.601562 6.734375 -39.921875 7.890625 -39.921875 C 9.046875 -39.921875 9.929688 -39.601562 10.546875 -38.96875 C 11.171875 -38.34375 11.484375 -37.429688 11.484375 -36.234375 L 11.484375 -3.25 C 11.484375 -2.09375 11.179688 -1.1875 10.578125 -0.53125 C 9.984375 0.125 9.085938 0.453125 7.890625 0.453125 Z M 7.890625 0.453125 "/></g></g></g></svg>`;
        const logoSrc = `data:image/svg+xml;base64,${btoa(svgText)}`;
        logoImage.src = logoSrc;
        
        await new Promise<void>((resolve) => {
            logoImage.onload = () => resolve();
            logoImage.onerror = () => {
                console.error("Failed to load logo SVG for canvas.");
                resolve();
            };
        });

        if (logoImage.complete && logoImage.naturalHeight !== 0) {
            ctx.save();
            const logoSize = 57;
            const logoRadius = logoSize / 2;
            ctx.beginPath();
            ctx.arc(contentX + logoRadius, currentY + logoRadius, logoRadius, 0, Math.PI * 2, true);
            ctx.clip();
            ctx.drawImage(logoImage, contentX, currentY, logoSize, logoSize);
            ctx.restore();
        }
    } catch (e) {
        console.warn("Could not load and draw the logo onto the quote image.", e);
    }
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `zizhi-quote-${quote.id.slice(0,8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Image downloaded!");
  };

  const handleShare = async (quote: Quote) => {
    const shareData = {
        title: `Quote from ${quote.bookTitle}`,
        text: `"${quote.text}"\n- ${quote.author}`,
    };
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error("Share failed:", err);
            showToast('Could not share quote.');
        }
    } else {
        navigator.clipboard.writeText(`${shareData.text}\n\nFrom: ${quote.bookTitle}`);
        showToast('Share not supported. Quote copied to clipboard!');
    }
  };

  const handleDeleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
    showToast('Quote deleted.');
  };

  const handleGoToQuote = (quote: Quote) => {
    if (!quote.location || !quote.bookId) {
        showToast("Sorry, location for this quote is not available.");
        return;
    }
    const bookExists = library.some(b => b.id === quote.bookId);
    if (!bookExists) {
        showToast("The book for this quote is no longer in your library.");
        return;
    }
    setPendingNavigation(quote.location);
    handleBookSelect(quote.bookId);
  };

  const handleDeleteBook = async (id: string) => {
    const bookToDelete = library.find(b => b.id === id);
    if (bookToDelete?.coverImageUrl) URL.revokeObjectURL(bookToDelete.coverImageUrl);
    if (bookToDelete?.audioTrailerUrl) URL.revokeObjectURL(bookToDelete.audioTrailerUrl);
    
    setLibrary(prev => prev.filter(b => b.id !== id));
    await db.deleteBook(id);
    showToast('Book deleted.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const pcmToWav = (pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob => {
      const header = new ArrayBuffer(44);
      const view = new DataView(header);
      
      const writeString = (view: DataView, offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
          }
      };

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + pcmData.byteLength, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
      view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
      view.setUint16(34, bitsPerSample, true);
      writeString(view, 36, 'data');
      view.setUint32(40, pcmData.byteLength, true);

      return new Blob([header, pcmData], { type: 'audio/wav' });
  };


  const handleGenerateTrailer = async (bookId: string) => {
      const book = library.find(b => b.id === bookId);
      if (!book) {
          showToast("Book not found.");
          return;
      }

      setGeneratingTrailerForBookId(bookId);
      showToast("Creating cinematic trailer...");

      try {
          let accumulatedText = '';
          for (const chapter of book.chapters) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(chapter.html, 'text/html');
              accumulatedText += (doc.body.textContent || '') + ' ';
              if (accumulatedText.length >= 5000) break;
          }

          const textToSummarize = accumulatedText.replace(/\s+/g, ' ').slice(0, 5000);
          
          if (textToSummarize.length < 100) {
              throw new Error("Book content is too short to generate a trailer.");
          }

          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
          
          const summaryPrompt = `You are a world-class movie trailer scriptwriter. Your task is to write the narration for a short, dramatic, and captivating movie-style trailer based on the following text from a book.

The narration should be concise (around 100-150 words), build suspense, and make someone want to read the book. Use short, impactful sentences. The tone should be cinematic.

Your output must ONLY be the text for the narration. Do NOT include any sound effects, music cues, or descriptions of the voice (like "VOICEOVER:"). Just provide the raw text to be spoken.

Here is the text from the book:
---
${textToSummarize}
---
`;

          const summaryResponse = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: summaryPrompt,
          });

          const script = summaryResponse.text;
          
          if (!script) throw new Error("Could not generate trailer script.");

          const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
            },
          });
          
          const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (!base64Audio) throw new Error("Failed to generate audio data.");
          
          const pcmData = decodeBase64(base64Audio);
          const wavBlob = pcmToWav(pcmData, 24000, 1, 16);
          const audioUrl = URL.createObjectURL(wavBlob);
          
          const updatedBook = { ...book, audioTrailerUrl: audioUrl, trailerScript: script, audioTrailerBlob: wavBlob };
          setLibrary(prev => prev.map(b => b.id === bookId ? updatedBook : b));
          await db.saveBook(updatedBook);
          showToast("Trailer is ready!");

      } catch(e: any) {
          console.error("Trailer generation failed:", e);
          showToast(`Error: ${e.message || 'Could not generate trailer'}`);
      } finally {
          setGeneratingTrailerForBookId(null);
      }
  };

  const handleViewTrailer = (bookId: string) => {
      const book = library.find(b => b.id === bookId);
      if (book) {
          setViewingTrailerForBook(book);
      }
  };

  const handleCloseTrailer = () => {
      setViewingTrailerForBook(null);
  };

  const TocItemComponent: React.FC<{ item: TocItem; onNavigate: (href: string) => void }> = ({ item, onNavigate }) => (
    <li className="my-1">
      <button 
        onClick={() => onNavigate(item.href)}
        className="w-full text-left p-2 rounded-md hover:bg-border-color/20 transition-colors duration-200 text-sm"
      >
        {item.label.trim()}
      </button>
      {item.subitems && item.subitems.length > 0 && (
        <ul className="pl-4 border-l border-border-color ml-2">
          {item.subitems.map(subitem => <TocItemComponent key={subitem.id} item={subitem} onNavigate={onNavigate} />)}
        </ul>
      )}
    </li>
  );
  
  if (!selectedBook) {
    const libraryCards: BookCardData[] = library.map(b => ({
        id: b.id, title: b.title, author: b.author, 
        coverImageUrl: b.coverImageUrl, progress: b.progress,
        audioTrailerUrl: b.audioTrailerUrl,
    }));
    return (
        <div className="flex flex-col h-screen bg-background text-primary-text">
            <header className="flex-shrink-0 p-4 sm:p-6 lg:p-8 flex justify-between items-center">
                <Logo className="h-10 sm:h-12 w-auto" />
                {installPrompt && (
                  <button
                    onClick={handleInstallClick}
                    title="Install Zizhi App"
                    className="flex items-center gap-2 bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition-opacity"
                  >
                    <IconDownload className="w-5 h-5" />
                    <span className="text-sm hidden sm:inline">Install App</span>
                  </button>
                )}
            </header>

            <div className="px-4 sm:px-6 lg:p-8 border-b border-border-color">
                <nav className="flex space-x-4">
                    <button onClick={() => setActiveTab('library')} className={`py-3 px-1 text-sm font-medium transition-colors focus:outline-none ${activeTab === 'library' ? 'text-primary-text border-b-2 border-primary' : 'text-secondary-text hover:text-primary-text'}`}>Library</button>
                    <button onClick={() => setActiveTab('quotes')} className={`py-3 px-1 text-sm font-medium transition-colors focus:outline-none ${activeTab === 'quotes' ? 'text-primary-text border-b-2 border-primary' : 'text-secondary-text hover:text-primary-text'}`}>Quotes</button>
                </nav>
            </div>
            
            <main className="flex-1 overflow-y-auto bg-black/5">
                {activeTab === 'library' ? (
                    <Library 
                        books={libraryCards} 
                        onBookSelect={handleBookSelect}
                        isLoading={isLoading} 
                        error={error} 
                        onDelete={handleDeleteBook}
                        onGenerateTrailer={handleGenerateTrailer}
                        generatingTrailerForBookId={generatingTrailerForBookId}
                        onViewTrailer={handleViewTrailer}
                    />
                ) : (
                    <QuotesView 
                        quotes={quotes} 
                        onDelete={handleDeleteQuote} 
                        onShare={handleShare}
                        onGenerateImage={handleGenerateImage}
                        onGoToQuote={handleGoToQuote}
                    />
                )}
            </main>
            
            {viewingTrailerForBook && (
                <TrailerView book={viewingTrailerForBook} onClose={handleCloseTrailer} />
            )}

            {activeTab === 'library' && (
                <>
                    <button
                        onClick={handleUploadClick}
                        className="fixed bottom-6 right-6 flex items-center justify-center p-4 bg-primary text-white font-semibold rounded-full shadow-lg hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                        disabled={isLoading || !!generatingTrailerForBookId}
                        title="Upload a file"
                    >
                        <IconUpload className="w-6 h-6" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".epub" onChange={handleFileChange} disabled={isLoading} />
                </>
            )}
             {toast && <Toast message={toast.message} action={toast.action} onClose={() => setToast(null)} />}
        </div>
    );
  }
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-primary-text">
      {toast && <Toast message={toast.message} action={toast.action} onClose={() => setToast(null)} />}

      <aside className={`absolute lg:relative z-20 h-full bg-background border-r border-border-color shadow-lg transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isSidebarOpen ? 'w-full sm:w-80' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border-color flex-shrink-0">
          <h2 className="text-lg font-bold truncate">Table of Contents</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-border-color/20">
            <IconClose className="w-6 h-6" />
          </button>
        </div>
        <nav className="overflow-y-auto flex-grow p-2">
          <ul>
            {selectedBook.toc.map(item => <TocItemComponent key={item.id} item={item} onNavigate={navigateTo} />)}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="flex items-center justify-between p-2 md:p-4 bg-background border-b border-border-color z-10 w-full flex-shrink-0">
          <button onClick={handleBackToLibrary} className="flex items-center p-2 rounded-lg hover:bg-border-color/20 text-sm transition-colors">
            <IconChevronLeft className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Back to Library</span>
          </button>
          <div className="text-center mx-2 flex-1 min-w-0">
            <h1 className="font-bold text-sm md:text-lg truncate">
                {selectedBook.title}
            </h1>
            <p className="text-xs md:text-sm text-secondary-text truncate">{currentLocation}</p>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-border-color/20">
            {isSidebarOpen ? <IconClose className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
          </button>
        </header>

        <div 
          className="relative flex-grow overflow-y-auto" 
          ref={viewerRef} 
          onScroll={handleScroll} 
          onContextMenu={(e) => e.preventDefault()}
        >
            <BookStyles />
            {selection && (
                <TextSelectionPopup 
                    top={selection.top}
                    left={selection.left}
                    onCopy={handleCopy}
                    onQuote={handleQuote}
                />
            )}
            <div className="book-content-view max-w-4xl mx-auto">
                {isLoading ? (
                     <div className="mt-8 flex items-center justify-center space-x-2">
                        <div className="w-8 h-8 rounded-full animate-spin border-2 border-solid border-primary border-t-transparent"></div>
                        <span>Parsing Book...</span>
                    </div>
                ) : selectedBook.chapters.map(chapter => (
                    <section
                        key={chapter.id}
                        id={chapter.id}
                        ref={el => { if (el) chapterRefs.current[chapter.id] = el; }}
                        dangerouslySetInnerHTML={{ __html: chapter.html }}
                    />
                ))}
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;