import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TocItem, Quote } from './types';
import Library, { BookCardData } from './components/FileUpload';
import QuotesView from './components/QuotesView';
import TextSelectionPopup from './components/TextSelectionPopup';
import SearchSidebar from './components/SearchSidebar';
import Toast from './components/Toast';
import { 
  IconMenu, IconClose, IconChevronLeft, IconUpload 
} from './components/icons';

declare global {
  interface Window {
    JSZip: any;
  }
}

interface Chapter {
    id: string;
    href: string;
    html: string;
    label: string;
}

interface Book {
    id: string;
    title: string;
    author: string;
    coverImageUrl: string | null;
    chapters: Chapter[];
    toc: TocItem[];
    progress: number; // 0-1 (e.g. 0.5 for 50%)
    lastScrollTop: number;
}

const BookStyles = () => {
  const styles = `
    .book-content-view {
      padding: 1rem 1rem 2rem 1rem;
      line-height: 1.7;
      font-size: 1rem;
      font-family: 'Lora', serif;
      color: #000000;
      background-color: #fdfbf3;
      user-select: text;
    }
    @media (min-width: 768px) {
      .book-content-view {
        padding: 2rem;
        line-height: 1.8;
        font-size: 1.125rem;
      }
    }
    .book-content-view ::selection {
      background-color: #89674A;
      color: #FFFFFF;
    }
    .book-content-view h1, .book-content-view h2, .book-content-view h3, .book-content-view h4, .book-content-view h5, .book-content-view h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      line-height: 1.3;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      color: #000000;
    }
     @media (min-width: 768px) {
        .book-content-view h1, .book-content-view h2, .book-content-view h3, .book-content-view h4, .book-content-view h5, .book-content-view h6 {
            margin-top: 2em;
        }
     }
    .book-content-view p {
      margin-bottom: 1.2em;
    }
    .book-content-view img {
      max-width: 100%;
      height: auto;
      margin: 1.5em auto;
      display: block;
      border-radius: 0.25rem;
    }
    .book-content-view a {
      color: #89674A;
      text-decoration: underline;
    }
    .book-content-view ul, .book-content-view ol {
      margin-bottom: 1em;
      padding-left: 1.5em;
    }
    .book-content-view blockquote {
        border-left: 3px solid #89674A;
        padding-left: 1em;
        margin-left: 0;
        font-style: italic;
        color: #202020;
    }
    .book-content-view style, .book-content-view link[rel=stylesheet] {
        display: none !important;
    }
  `;
  return <style>{styles}</style>;
};

const App: React.FC = () => {
  const [library, setLibrary] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');

  const [selection, setSelection] = useState<{ text: string; top: number; left: number; right: number; chapterId: string; } | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: { label: string; onClick: () => void; } } | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes'>('library');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);


  const viewerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<{[key: string]: HTMLElement}>({});
  const scrollTimeout = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const selectedBook = library.find(b => b.id === selectedBookId) || null;

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
        const finalHtml = new XMLSerializer().serializeToString(chapterDoc.documentElement);
        const chapterId = path.split('/').pop()?.split('.')[0] || `chap-${Math.random()}`;
        loadedChapters.push({
            id: chapterId, href: path, html: finalHtml,
            label: tocMap.get(path.split('#')[0])?.label || 'Chapter'
        });
      }
    }
    
    return {
        id: `${file.name}-${file.size}`, title, author, coverImageUrl,
        chapters: loadedChapters, toc: tocNav, progress: 0, lastScrollTop: 0
    };
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (selectedFile?.type !== 'application/epub+zip') {
      setError('Invalid file type. Please upload an EPUB file.');
      return;
    }
    const bookId = `${selectedFile.name}-${selectedFile.size}`;
    if (library.some(b => b.id === bookId)) {
      setSelectedBookId(bookId);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const newBook = await parseEpub(selectedFile);
      setLibrary(prev => [...prev, newBook]);
      setSelectedBookId(newBook.id);
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
      setLibrary(lib => lib.map(b => 
          b.id === selectedBook.id ? { ...b, lastScrollTop: scrollTop } : b
      ));
    }
    setSelectedBookId(null);
    setCurrentLocation('');
    chapterRefs.current = {};
  };

  useEffect(() => {
    if (!selectedBook || !viewerRef.current) return;
  
    const scrollTarget = pendingNavigation;
    if (pendingNavigation) {
      setPendingNavigation(null); // Consume it
    }
  
    const tryToScroll = (attempt = 0) => {
      // Give up after 2 seconds
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
        // Fallback to restoring last scroll position
        if (viewerRef.current) {
          viewerRef.current.scrollTop = selectedBook.lastScrollTop;
        }
      }
    };
  
    setTimeout(tryToScroll, 50);
  
  }, [selectedBook?.id]);

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
  }, [selectedBook?.id]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setSelection(null);
    if (scrollTimeout.current) window.clearTimeout(scrollTimeout.current);
    scrollTimeout.current = window.setTimeout(() => {
        if (!viewerRef.current || !selectedBookId) return;
        const { scrollTop, scrollHeight, clientHeight } = viewerRef.current;
        const totalScrollable = scrollHeight - clientHeight;
        const progress = totalScrollable > 0 ? scrollTop / totalScrollable : 1;
        
        setLibrary(lib => lib.map(b => 
            b.id === selectedBookId ? { ...b, progress: Math.min(progress, 1), lastScrollTop: scrollTop } : b
        ));
    }, 150);
  }, [selectedBookId]);

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
  
  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !viewerRef.current?.contains(sel.anchorNode)) {
      setSelection(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const viewerRect = viewerRef.current.getBoundingClientRect();

      const anchorNode = sel.anchorNode;
      if (!anchorNode) { setSelection(null); return; }

      let currentNode: Node | null = anchorNode;
      let chapterId: string | null = null;
      while (currentNode && currentNode !== viewerRef.current) {
          if (currentNode.nodeType === Node.ELEMENT_NODE) {
              const element = currentNode as HTMLElement;
              if (element.tagName.toLowerCase() === 'section' && element.id && selectedBook?.chapters.some(c => c.id === element.id)) {
                  chapterId = element.id;
                  break;
              }
          }
          currentNode = currentNode.parentNode;
      }

      if (chapterId) {
        setSelection({
          text,
          top: rect.top - viewerRect.top + viewerRef.current.scrollTop,
          left: rect.left - viewerRect.left + (rect.width / 2),
          right: rect.right - viewerRect.left,
          chapterId: chapterId,
        });
      } else {
        setSelection(null);
      }
    } else {
        setSelection(null);
    }
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
  const handleSearch = () => {
    if (selection) {
      setSearchQuery(selection.text);
      setSelection(null);
    }
  };

  const handleGenerateImage = async (quote: Quote) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const book = library.find(b => b.id === quote.bookId);

    const width = 1080;
    const height = 1080;
    const padding = 80;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#fdfbf3';
    ctx.fillRect(0, 0, width, height);

    // --- HEADER ---
    const headerY = padding;
    const coverSize = 120;
    const textPadding = 24;

    if (book && book.coverImageUrl) {
      try {
        const coverImage = new Image();
        coverImage.crossOrigin = 'anonymous';
        coverImage.src = book.coverImageUrl;
        await new Promise((resolve, reject) => {
          coverImage.onload = resolve;
          coverImage.onerror = (err) => {
            console.error("Failed to load cover image for canvas", err);
            reject(err);
          };
        });
        
        ctx.save();
        ctx.beginPath();
        ctx.rect(padding, headerY, coverSize, coverSize);
        ctx.clip();
        ctx.drawImage(coverImage, padding, headerY, coverSize, coverSize);
        ctx.restore();

      } catch (e) {
        ctx.fillStyle = '#EAEAEA';
        ctx.fillRect(padding, headerY, coverSize, coverSize);
      }
    } else {
        ctx.fillStyle = '#EAEAEA';
        ctx.fillRect(padding, headerY, coverSize, coverSize);
    }
    
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    const titleX = padding + coverSize + textPadding;
    const titleY = headerY + coverSize / 2;

    ctx.font = `bold 40px Inter, sans-serif`;
    ctx.fillText(quote.bookTitle, titleX, titleY - 22, width - titleX - padding);
    
    ctx.font = `32px Inter, sans-serif`;
    ctx.fillStyle = '#202020';
    ctx.fillText(quote.author, titleX, titleY + 22, width - titleX - padding);

    // --- QUOTE TEXT ---
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    
    const maxTextWidth = width - (padding * 2);
    
    let fontSize = 72;
    ctx.font = `600 ${fontSize}px Lora, serif`;
    
    const wrapText = (text: string, maxWidth: number) => {
        let lines: string[] = [];
        if (!text) return lines;
        let words = text.split(' ');
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let testLine = currentLine + " " + word;
            if (ctx.measureText(testLine).width < maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };
    
    let lines = wrapText(quote.text, maxTextWidth);
    let lineHeight = fontSize * 1.4;
    
    while((lines.length * lineHeight > (height / 2.5)) && fontSize > 24) {
        fontSize -= 2;
        lineHeight = fontSize * 1.4;
        ctx.font = `600 ${fontSize}px Lora, serif`;
        lines = wrapText(quote.text, maxTextWidth);
    }
    
    const textBlockHeight = lines.length * lineHeight;
    const startY = (height - textBlockHeight) / 2;

    lines.forEach((line, index) => {
        ctx.fillText(line, padding, startY + (index * lineHeight));
    });

    // --- FOOTER ---
    ctx.font = `bold 32px Inter, sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.fillText('Zizhi', padding, height - padding);

    // Download
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

  const handleDeleteBook = (id: string) => {
    setLibrary(prev => {
        const bookToDelete = prev.find(b => b.id === id);
        if (bookToDelete?.coverImageUrl) {
            // Revoke object URL to avoid memory leaks
            URL.revokeObjectURL(bookToDelete.coverImageUrl);
        }
        return prev.filter(b => b.id !== id);
    });
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
        coverImageUrl: b.coverImageUrl, progress: b.progress
    }));
    return (
        <div className="flex flex-col h-screen bg-background text-primary-text">
            <header className="flex-shrink-0 p-4 sm:p-6 lg:p-8">
                <h1 className="text-4xl sm:text-5xl font-bold font-serif">Zizhi</h1>
            </header>

            <div className="px-4 sm:px-6 lg:p-8 border-b border-border-color">
                <nav className="flex space-x-4">
                    <button onClick={() => setActiveTab('library')} className={`py-3 px-1 text-sm font-medium transition-colors focus:outline-none ${activeTab === 'library' ? 'text-primary-text border-b-2 border-primary' : 'text-secondary-text hover:text-primary-text'}`}>Library</button>
                    <button onClick={() => setActiveTab('quotes')} className={`py-3 px-1 text-sm font-medium transition-colors focus:outline-none ${activeTab === 'quotes' ? 'text-primary-text border-b-2 border-primary' : 'text-secondary-text hover:text-primary-text'}`}>Quotes</button>
                </nav>
            </div>
            
            <main className="flex-1 overflow-y-auto bg-border-color/5">
                {activeTab === 'library' ? (
                    <Library 
                        books={libraryCards} 
                        onBookSelect={handleBookSelect}
                        isLoading={isLoading} 
                        error={error} 
                        onDelete={handleDeleteBook}
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

            {activeTab === 'library' && (
                <>
                    <button
                        onClick={handleUploadClick}
                        className="fixed bottom-6 right-6 flex items-center justify-center p-4 bg-primary text-white font-semibold rounded-full shadow-lg hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed z-10"
                        disabled={isLoading}
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
    <div className="flex h-screen w-screen overflow-hidden bg-background text-primary-text">
      {toast && <Toast message={toast.message} action={toast.action} onClose={() => setToast(null)} />}
      {searchQuery && <SearchSidebar query={searchQuery} onClose={() => setSearchQuery(null)} />}

      <aside className={`absolute lg:relative z-20 h-full bg-background border-r border-border-color shadow-lg transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isSidebarOpen ? 'w-full sm:w-80' : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-4 border-b border-border-color flex-shrink-0">
          <h2 className="text-lg font-bold truncate">Table of Contents</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-border-color/20">
            <IconClose />
          </button>
        </div>
        <nav className="overflow-y-auto flex-grow p-2">
          <ul>
            {selectedBook.toc.map(item => <TocItemComponent key={item.id} item={item} onNavigate={navigateTo} />)}
          </ul>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative">
        <header className="flex items-center justify-between p-2 md:p-4 bg-background border-b border-border-color z-10 w-full flex-shrink-0">
          <button onClick={handleBackToLibrary} className="flex items-center p-2 rounded-lg hover:bg-border-color/20 text-sm transition-colors">
            <IconChevronLeft className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Back to Library</span>
          </button>
          <div className="text-center truncate mx-2">
            <h1 className="font-bold text-sm md:text-lg truncate">{selectedBook.title}</h1>
            <p className="text-xs md:text-sm text-secondary-text truncate">{currentLocation}</p>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-border-color/20">
            {isSidebarOpen ? <IconClose /> : <IconMenu />}
          </button>
        </header>

        <div 
          className="relative flex-grow overflow-y-auto" 
          ref={viewerRef} 
          onScroll={handleScroll} 
          onMouseUp={handleTextSelection} 
          onTouchEnd={handleTextSelection}
          onContextMenu={(e) => e.preventDefault()}
        >
            <BookStyles />
            {selection && (
                <TextSelectionPopup 
                    top={selection.top}
                    left={selection.left}
                    onCopy={handleCopy}
                    onQuote={handleQuote}
                    onSearch={handleSearch}
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