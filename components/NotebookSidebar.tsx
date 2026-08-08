import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Group, Stack, Text, ActionIcon, Loader, Tooltip } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Eraser, 
  StickyNote as StickyIcon, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  X, 
  Check, 
  RotateCcw,
  Plus,
  Type,
  Pencil,
  Highlighter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Palette
} from 'lucide-react';
import type { DrawingPath, StickyNote, ImageSticker, NotebookData, NotebookPageData, Theme } from '../types';
import * as db from '../db';
import { NotebookPage } from './NotebookPage';
import { auth, db as firestore } from '../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getBookUniqueKey, ATMOSPHERES } from '../App';

interface NotebookSidebarProps {
  bookId: string;
  bookTitle: string;
  author?: string;
  onClose: () => void;
  isOpen: boolean;
  theme?: Theme;
}

const isLightColor = (color: string) => {
  if (!color || color === 'transparent') return true;
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      return (r * 299 + g * 587 + b * 114) / 1000 > 165;
    }
  }
  const cleanHex = color.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 165;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 165;
  }
  return false;
};

const isColorMatch = (c1: string, c2: string) => {
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  return c1.toLowerCase().trim() === c2.toLowerCase().trim();
};

const GRID_GRAYSCALE = [
  { name: 'Black', color: '#000000' },
  { name: 'Charcoal', color: '#262626' },
  { name: 'Dark Gray', color: '#404040' },
  { name: 'Medium Dark', color: '#525252' },
  { name: 'Slate Gray', color: '#737373' },
  { name: 'Gray', color: '#a3a3a3' },
  { name: 'Light Gray', color: '#d4d4d4' },
  { name: 'Soft Gray', color: '#e5e5e5' },
  { name: 'Off White', color: '#f5f5f5' },
  { name: 'White', color: '#ffffff' },
];

const GRID_VIBRANT = [
  { name: 'Dark Red', color: '#7f1d1d' },
  { name: 'Red', color: '#dc2626' },
  { name: 'Orange', color: '#ea580c' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Green', color: '#16a34a' },
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Royal Blue', color: '#1d4ed8' },
  { name: 'Purple', color: '#9333ea' },
  { name: 'Magenta', color: '#d946ef' },
];

const HIGHLIGHT_GRID = [
  { name: 'Yellow', color: 'rgba(253, 224, 71, 0.5)', solid: '#fde047' },
  { name: 'Orange', color: 'rgba(253, 186, 116, 0.5)', solid: '#fdba74' },
  { name: 'Pink', color: 'rgba(244, 114, 182, 0.5)', solid: '#f472b6' },
  { name: 'Red', color: 'rgba(252, 165, 165, 0.5)', solid: '#fca5a5' },
  { name: 'Green', color: 'rgba(74, 222, 128, 0.5)', solid: '#4ade80' },
  { name: 'Cyan', color: 'rgba(103, 232, 249, 0.5)', solid: '#67e8f9' },
  { name: 'Blue', color: 'rgba(147, 197, 253, 0.5)', solid: '#93c5fd' },
  { name: 'Purple', color: 'rgba(192, 132, 252, 0.5)', solid: '#c084fc' },
  { name: 'Transparent', color: 'transparent', solid: 'transparent' },
];

const TEXT_COLORS = [
  { name: 'Charcoal', color: '#1e293b' },
  { name: 'Royal Blue', color: '#1d4ed8' },
  { name: 'Crimson Red', color: '#b91c1c' },
  { name: 'Emerald Green', color: '#047857' },
  { name: 'Vibrant Purple', color: '#7c3aed' },
];

const DRAW_COLORS = [
  { name: 'Pencil Gray', color: '#4b5563', width: 1.4 },
  { name: 'Ink Black', color: '#1e293b', width: 2.2 },
  { name: 'Ink Blue', color: '#1d4ed8', width: 2.2 },
  { name: 'Ink Red', color: '#b91c1c', width: 2.2 },
  { name: 'Ink Green', color: '#047857', width: 2.2 },
];

const HIGHLIGHT_COLORS = [
  { name: 'Sunny Yellow', color: 'rgba(253, 224, 71, 0.45)' },
  { name: 'Blossom Pink', color: 'rgba(244, 114, 182, 0.45)' },
  { name: 'Mint Green', color: 'rgba(74, 222, 128, 0.45)' },
  { name: 'Sky Blue', color: 'rgba(191, 219, 254, 0.45)' },
  { name: 'No Color', color: 'transparent' },
];

const STICKY_COLORS = [
  { name: 'yellow', bg: '#fef08a', border: '#eab308', text: '#713f12' },
  { name: 'pink', bg: '#fbcfe8', border: '#ec4899', text: '#831843' },
  { name: 'blue', bg: '#bfdbfe', border: '#3b82f6', text: '#1e3a8a' },
  { name: 'green', bg: '#bbf7d0', border: '#22c55e', text: '#064e3b' },
];

const getPlainText = (html: string) => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.innerText || temp.textContent || "";
};

const FONT_OPTIONS = [
  { id: 'serif', name: 'Serif', family: 'var(--font-serif), serif', sample: 'Aa Book' },
  { id: 'hand', name: 'Handwritten', family: 'var(--font-hand), cursive', sample: 'Aa Notes' },
  { id: 'sans', name: 'Sans', family: 'var(--font-sans), sans-serif', sample: 'Aa Clean' },
  { id: 'mono', name: 'Mono', family: 'ui-monospace, monospace', sample: 'Aa Code' },
  { id: 'display', name: 'Display', family: 'var(--font-display), serif', sample: 'Aa Bold' },
];

export const NotebookSidebar: React.FC<NotebookSidebarProps> = ({ bookId, bookTitle, author, onClose, isOpen, theme }) => {
  const [selectedFont, setSelectedFont] = useState<'serif' | 'hand' | 'sans' | 'mono' | 'display'>(() => {
    return (localStorage.getItem('zizhi-notebook-font') as any) || 'serif';
  });

  const [notebookThemeId, setNotebookThemeId] = useState<string>(() => {
    return localStorage.getItem('zizhi-notebook-theme-id') || theme?.id || 'warm';
  });

  const currentNotebookTheme = ATMOSPHERES[notebookThemeId] || theme || ATMOSPHERES.warm;

  const isDarkTheme = currentNotebookTheme.id === 'nocturne' || (currentNotebookTheme.colors?.background && (currentNotebookTheme.colors.background === '#0a0a0b' || currentNotebookTheme.colors.background.startsWith('#1') || currentNotebookTheme.colors.background.startsWith('#0')));
  const pageBgColor = currentNotebookTheme.colors?.background || '#fcfbe3';
  const pageSurfaceColor = currentNotebookTheme.colors?.surface || '#f1f5f9';
  const pageTextColor = currentNotebookTheme.colors?.['primary-text'] || (isDarkTheme ? '#f8fafc' : '#1e293b');
  const pageBorderColor = currentNotebookTheme.colors?.['border-color'] || 'rgba(0,0,0,0.12)';
  const [pages, setPages] = useState<NotebookPageData[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  // Custom Sidebar Resizing State - defaults to approx 1/3 viewport width on desktop
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => 
    typeof window !== 'undefined' ? Math.max(340, Math.min(540, Math.round(window.innerWidth * 0.32))) : 420
  );
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const isNarrowToolbar = isMobile || sidebarWidth < 430;
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard offset listener for mobile soft keyboard
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setKeyboardOffset(offset);
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, [isMobile]);
  
  // Stationery drawer tool configuration
  const [activeTool, setActiveTool] = useState<'type' | 'draw' | 'highlight' | 'eraser'>('type');
  const [textToolColor, setTextToolColor] = useState(isDarkTheme ? '#f8fafc' : '#1e293b');
  const [drawToolColor, setDrawToolColor] = useState(isDarkTheme ? '#f8fafc' : '#1e293b');
  const [highlightToolColor, setHighlightToolColor] = useState('rgba(253, 224, 71, 0.5)');
  const [activeWidth, setActiveWidth] = useState(2.2);

  // Dropdown & Popover States
  const [activeDropdownTool, setActiveDropdownTool] = useState<'type' | 'draw' | 'highlight' | 'theme' | 'font' | null>(null);
  const toolbarContainerRef = useRef<HTMLDivElement>(null);

  // Mobile Popover & Bar States
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Automatically update text and draw colors if dark mode changes
  useEffect(() => {
    if (isDarkTheme) {
      if (['#1e293b', '#000000', '#262626', '#404040', '#000'].includes(textToolColor)) {
        setTextToolColor('#f8fafc');
      }
      if (['#1e293b', '#000000', '#262626', '#404040', '#000'].includes(drawToolColor)) {
        setDrawToolColor('#f8fafc');
      }
    } else {
      if (['#f8fafc', '#ffffff', '#fff', '#fafafa'].includes(textToolColor)) {
        setTextToolColor('#1e293b');
      }
      if (['#f8fafc', '#ffffff', '#fff', '#fafafa'].includes(drawToolColor)) {
        setDrawToolColor('#1e293b');
      }
    }
  }, [isDarkTheme]);

  // Click outside listener to close color dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarContainerRef.current && !toolbarContainerRef.current.contains(e.target as Node)) {
        setActiveDropdownTool(null);
      }
    };
    if (activeDropdownTool) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdownTool]);

  const activeColor = useMemo(() => {
    if (activeTool === 'type') return textToolColor;
    if (activeTool === 'draw') return drawToolColor;
    if (activeTool === 'highlight') return highlightToolColor;
    if (activeTool === 'eraser') return 'eraser';
    return isDarkTheme ? '#f8fafc' : '#1e293b';
  }, [activeTool, textToolColor, drawToolColor, highlightToolColor, isDarkTheme]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Helper to check if notebook object has non-empty user content
  const hasContent = (nb: NotebookData | null): boolean => {
    if (!nb || !nb.pages) return false;
    try {
      const parsedPages: NotebookPageData[] = JSON.parse(nb.pages);
      return parsedPages.some(p => 
        (p.text && p.text.replace(/<[^>]*>/g, '').trim().length > 0) || 
        (p.drawings && p.drawings.length > 0) || 
        (p.stickyNotes && p.stickyNotes.length > 0) || 
        (p.imageStickers && p.imageStickers.length > 0)
      );
    } catch (e) {
      return false;
    }
  };

  // Load local IndexedDB notebook data or synced cloud notebook
  useEffect(() => {
    const loadNotebookData = async () => {
      setIsLoading(true);
      try {
        let localData = await db.getNotebook(bookId);
        const bookKey = getBookUniqueKey(bookTitle, author || '');
        const cleanTitle = bookTitle.trim().toLowerCase();

        // If not found or local has no content, search local DB by bookKey or clean title
        if ((!localData || !hasContent(localData)) && bookTitle) {
          const allLocal = await db.getAllNotebooks();
          const matched = allLocal.find(nb => 
            (nb.bookKey && nb.bookKey === bookKey) || 
            (nb.bookTitle && getBookUniqueKey(nb.bookTitle, nb.author) === bookKey) ||
            (nb.bookTitle && nb.bookTitle.trim().toLowerCase() === cleanTitle)
          );
          if (matched && hasContent(matched)) {
            localData = { ...matched, bookId };
            await db.saveNotebook(localData);
          }
        }

        // Check Firestore if user is logged in and localData is missing or empty
        if ((!localData || !hasContent(localData)) && auth.currentUser) {
          try {
            const userUid = auth.currentUser.uid;
            let cloudNb: NotebookData | null = null;

            // Try doc ID = bookKey
            if (bookKey) {
              const safeKey = bookKey.replace(/\//g, '_');
              const docRef = doc(firestore, 'users', userUid, 'notebooks', safeKey);
              const snap = await getDoc(docRef);
              if (snap.exists()) {
                cloudNb = snap.data() as NotebookData;
              }
            }
            // Try doc ID = bookId
            if (!cloudNb && bookId) {
              const safeId = bookId.replace(/\//g, '_');
              const docRef = doc(firestore, 'users', userUid, 'notebooks', safeId);
              const snap = await getDoc(docRef);
              if (snap.exists()) {
                cloudNb = snap.data() as NotebookData;
              }
            }
            // Try querying collection by bookKey or bookTitle
            if (!cloudNb && (bookKey || bookTitle)) {
              const nbColRef = collection(firestore, 'users', userUid, 'notebooks');
              const q = query(nbColRef, where('bookKey', '==', bookKey));
              const querySnap = await getDocs(q);
              if (!querySnap.empty) {
                cloudNb = querySnap.docs[0].data() as NotebookData;
              } else if (bookTitle) {
                const qTitle = query(nbColRef, where('bookTitle', '==', bookTitle));
                const querySnapTitle = await getDocs(qTitle);
                if (!querySnapTitle.empty) {
                  cloudNb = querySnapTitle.docs[0].data() as NotebookData;
                }
              }
            }

            if (cloudNb && hasContent(cloudNb)) {
              localData = { ...cloudNb, bookId };
              await db.saveNotebook(localData);
            }
          } catch (e) {
            console.error('Failed to fetch cloud notebook:', e);
          }
        }
        
        if (localData) {
          if (localData.pages) {
            // New multi-page structure loaded successfully
            const loadedPages = JSON.parse(localData.pages);
            setPages(loadedPages);
            setActivePageIndex(loadedPages.length > 0 ? 0 : 0);
          } else {
            // BACKWARDS COMPATIBILITY: Migrate old single-page notebook to pages array
            const migratedPage: NotebookPageData = {
              id: 'page_migrated_' + Date.now(),
              text: '',
              drawings: JSON.parse(localData.drawings || '[]'),
              stickyNotes: JSON.parse(localData.stickyNotes || '[]'),
              imageStickers: JSON.parse(localData.imageStickers || '[]'),
            };
            setPages([migratedPage]);
            setActivePageIndex(0);
          }
        } else {
          // Initialize fresh notebook with page 1
          const firstPage: NotebookPageData = {
            id: 'page_1',
            text: '',
            drawings: [],
            stickyNotes: [],
            imageStickers: [],
          };
          setPages([firstPage]);
          setActivePageIndex(0);
        }
      } catch (err) {
        console.error('Failed to load local notebook:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadNotebookData();
    }
  }, [bookId, bookTitle, author, isOpen]);

  // Debounced Auto Save to IndexedDB and Firestore
  const lastSaveTimerRef = useRef<number | null>(null);

  const triggerSave = useCallback((updatedPages: NotebookPageData[]) => {
    if (lastSaveTimerRef.current) {
      window.clearTimeout(lastSaveTimerRef.current);
    }
    setSaveStatus('saving');

    lastSaveTimerRef.current = window.setTimeout(async () => {
      try {
        const user = auth.currentUser;
        const bookKey = getBookUniqueKey(bookTitle, author || '');
        const notebookObj: NotebookData = {
          bookId,
          userId: user ? user.uid : 'local_student',
          drawings: '[]', // retained for retro schemas
          stickyNotes: '[]',
          pages: JSON.stringify(updatedPages),
          updatedAt: Date.now(),
          bookTitle,
          author,
          bookKey
        };
        await db.saveNotebook(notebookObj);
        if (user) {
          const rawDocId = bookKey || bookId;
          const nbDocId = (rawDocId || '').replace(/\//g, '_');
          if (nbDocId) {
            setDoc(doc(firestore, 'users', user.uid, 'notebooks', nbDocId), { ...notebookObj, userId: user.uid }, { merge: true }).catch(() => {});
          }
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('Error saving notebook:', err);
        setSaveStatus('error');
      }
    }, 1200);
  }, [bookId, bookTitle, author]);

  const triggerSaveImmediate = useCallback(async (updatedPages: NotebookPageData[]) => {
    if (lastSaveTimerRef.current) {
      window.clearTimeout(lastSaveTimerRef.current);
      lastSaveTimerRef.current = null;
    }
    try {
      const user = auth.currentUser;
      const bookKey = getBookUniqueKey(bookTitle, author || '');
      const notebookObj: NotebookData = {
        bookId,
        userId: user ? user.uid : 'local_student',
        drawings: '[]',
        stickyNotes: '[]',
        pages: JSON.stringify(updatedPages),
        updatedAt: Date.now(),
        bookTitle,
        author,
        bookKey
      };
      await db.saveNotebook(notebookObj);
      if (user) {
        const nbDocId = bookKey || bookId;
        setDoc(doc(firestore, 'users', user.uid, 'notebooks', nbDocId), { ...notebookObj, userId: user.uid }, { merge: true }).catch(() => {});
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('Error saving notebook immediately:', err);
      setSaveStatus('error');
    }
  }, [bookId, bookTitle, author]);

  // Flush pending save on unmount or tab hide
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  useEffect(() => {
    const handleUnloadOrHide = () => {
      if (lastSaveTimerRef.current && pagesRef.current) {
        triggerSaveImmediate(pagesRef.current);
      }
    };

    window.addEventListener('beforeunload', handleUnloadOrHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleUnloadOrHide();
    });

    return () => {
      window.removeEventListener('beforeunload', handleUnloadOrHide);
      handleUnloadOrHide();
    };
  }, [triggerSaveImmediate]);

  // Listen for custom add-notebook-text events to copy selected text into the active page
  useEffect(() => {
    const handleAddTextEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string }>;
      const text = customEvent.detail?.text;
      if (!text) return;

      const formattedBlock = `<blockquote style="margin:12px 0; padding:10px 14px; border-left:4px solid #06b6d4; background:rgba(236,254,255,0.8); font-family:serif; font-style:italic; font-size:14px; color:#164e63; border-radius:0 6px 6px 0;">"${text}"</blockquote><p><br></p>`;

      setPages((prevPages) => {
        if (prevPages.length === 0) return prevPages;
        const targetIdx = activePageIndex < prevPages.length ? activePageIndex : 0;
        const currentPage = prevPages[targetIdx];

        const updatedPage = {
          ...currentPage,
          text: (currentPage.text || '') + formattedBlock,
        };

        const copy = [...prevPages];
        copy[targetIdx] = updatedPage;
        triggerSave(copy);
        return copy;
      });
    };

    window.addEventListener('add-notebook-text', handleAddTextEvent);
    return () => {
      window.removeEventListener('add-notebook-text', handleAddTextEvent);
    };
  }, [activePageIndex, triggerSave]);
  const handlePageChange = (index: number, updatedPage: NotebookPageData) => {
    setPages((prev) => {
      const copy = [...prev];
      copy[index] = updatedPage;
      triggerSave(copy);
      return copy;
    });
  };

  // Add a new Notebook Page
  const addPage = () => {
    const newPage: NotebookPageData = {
      id: `page_${Date.now()}`,
      text: '',
      drawings: [],
      stickyNotes: [],
      imageStickers: [],
    };
    const updated = [...pages, newPage];
    setPages(updated);
    setActivePageIndex(updated.length - 1);
    triggerSave(updated);

    // Scroll automatically to the newly added page
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  // Delete a specific page (Tear out)
  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      // If it's the last page, clear its content rather than leaving 0 pages
      const clearedPage: NotebookPageData = {
        ...pages[0],
        text: '',
        drawings: [],
        stickyNotes: [],
        imageStickers: [],
      };
      setPages([clearedPage]);
      triggerSave([clearedPage]);
      return;
    }
    const updated = pages.filter((_, idx) => idx !== index);
    setPages(updated);
    setActivePageIndex(Math.max(0, index - 1));
    triggerSave(updated);
  };

  // Drag-to-Resize event handling
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    // Keep width constraints between 300px and 60% of screen width on desktop
    const minW = 300;
    const maxW = Math.round(window.innerWidth * 0.60);
    if (newWidth >= minW && newWidth <= maxW) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Stationery selectors
  const selectStationery = (tool: 'type' | 'draw' | 'highlight' | 'eraser', color: string, width: number) => {
    setActiveTool(tool);
    let targetColor = color;
    if (isDarkTheme && (tool === 'type' || tool === 'draw')) {
      if (['#000000', '#1e293b', '#262626', '#404040', '#000', '#171717', '#0f172a', '#111827', 'black'].includes(color.toLowerCase())) {
        targetColor = '#f8fafc';
      }
    }
    if (tool === 'type') {
      setTextToolColor(targetColor);
    } else if (tool === 'draw') {
      setDrawToolColor(targetColor);
    } else if (tool === 'highlight') {
      setHighlightToolColor(targetColor);
    }
    setActiveWidth(width);

    // Proactively apply color formatting if text is selected inside the editor or active
    if (tool === 'type' && targetColor !== 'eraser') {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        document.execCommand('foreColor', false, targetColor);
      }
    } else if (tool === 'highlight') {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        document.execCommand('backColor', false, targetColor);
      }
    }
  };

  // Clear drawings and text of the current active page
  const handleClearPage = () => {
    const clearedPage: NotebookPageData = {
      ...pages[activePageIndex],
      text: '',
      drawings: [],
      stickyNotes: [],
      imageStickers: [],
    };
    handlePageChange(activePageIndex, clearedPage);
  };

  // Sticky notes creator (adds to active page)
  const handleAddSticky = () => {
    const randomColor = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)].name as any;
    const newSticky: StickyNote = {
      id: 'sticky_' + Date.now(),
      text: '',
      color: randomColor,
      x: 0.35 + Math.random() * 0.15,
      y: 0.35 + Math.random() * 0.15,
      rotation: -4 + Math.random() * 8,
    };
    
    const activePage = pages[activePageIndex];
    const updatedPage = {
      ...activePage,
      stickyNotes: [...activePage.stickyNotes, newSticky],
    };
    handlePageChange(activePageIndex, updatedPage);
  };

  // Image Upload handler (adds image sticker to current page)
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const maxStickerSize = 340;

        if (w > maxStickerSize || h > maxStickerSize) {
          if (w > h) {
            h = Math.round((h * maxStickerSize) / w);
            w = maxStickerSize;
          } else {
            w = Math.round((w * maxStickerSize) / h);
            h = maxStickerSize;
          }
        }

        tempCanvas.width = w;
        tempCanvas.height = h;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = tempCanvas.toDataURL('image/jpeg', 0.75);

          window.dispatchEvent(new CustomEvent('add-notebook-sticker', {
            detail: { url: compressed }
          }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // clear file selector
  };

  // Undo sketch line on the active page
  const handleUndoSketch = () => {
    const activePage = pages[activePageIndex];
    if (activePage.drawings.length === 0) return;

    const updatedPage = {
      ...activePage,
      drawings: activePage.drawings.slice(0, -1),
    };
    handlePageChange(activePageIndex, updatedPage);
  };

  const [isExporting, setIsExporting] = useState(false);

  // High-fidelity PDF export ensuring exact DOM rendering (no cutting, no extra shadows, no bolder ink, precise colors)
  const handleExportPDF = async (pageIdx = activePageIndex) => {
    const pageEl = document.querySelector(`[data-notebook-page-index="${pageIdx}"]`) as HTMLElement;
    if (!pageEl) {
      alert('Could not find notebook page to export.');
      return;
    }

    setIsExporting(true);
    try {
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fcfbe3',
        logging: false,
        windowWidth: pageEl.scrollWidth,
        windowHeight: pageEl.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedPage = clonedDoc.querySelector(`[data-notebook-page-index="${pageIdx}"]`) as HTMLElement;
          if (clonedPage) {
            // Remove tear buttons and interactive overlays from cloned DOM
            const interactiveEls = clonedPage.querySelectorAll('button, .delete-img-btn, .align-left-btn, .align-center-btn, .align-right-btn, .resize-smaller-btn, .resize-larger-btn, .interactive-sticker button');
            interactiveEls.forEach((el) => ((el as HTMLElement).style.display = 'none'));
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${bookTitle.toLowerCase().replace(/\s+/g, '_')}_page_${pageIdx + 1}.pdf`);
    } catch (err) {
      console.error('PDF Export error:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export current page to PNG
  const handleExportPNG = async () => {
    const activePage = pages[activePageIndex];
    const baseW = 400;
    const baseH = 1360;
    const dpr = window.devicePixelRatio || 1;

    // Helper to load an image as a Promise
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image: ' + src));
        img.src = src;
      });
    };

    // Parse HTML of activePage.text to find embedded images
    const temp = document.createElement('div');
    temp.innerHTML = activePage.text;
    const embeddedImgElements = temp.querySelectorAll('img');
    const embeddedUrls = Array.from(embeddedImgElements).map(img => img.src).filter(Boolean);

    // Collect all unique URLs to preload
    const uniqueUrls = Array.from(new Set([
      ...(activePage.imageStickers || []).map(s => s.url),
      ...embeddedUrls
    ]));

    // Preload all images
    const loadedImagesMap: Record<string, HTMLImageElement> = {};
    await Promise.all(
      uniqueUrls.map(async (url) => {
        try {
          const img = await loadImage(url);
          loadedImagesMap[url] = img;
        } catch (err) {
          console.warn('Could not preload image for export:', url, err);
        }
      })
    );

    // Calculate maximum Y coordinate of any content on the page to size the canvas perfectly
    let maxContentY = 200; // minimum height is 200px

    // 1. Calculate text & embedded images layout height
    let simulatedY = 48;
    const extractBlocksForHeight = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains('notebook-embedded-image-wrapper') || el.tagName === 'IMG') {
          const imgUrl = el.querySelector('img')?.src || (el as HTMLImageElement).src;
          const loadedImg = imgUrl ? loadedImagesMap[imgUrl] : null;
          const aspect = loadedImg ? (loadedImg.naturalHeight / loadedImg.naturalWidth || 1) : 1;
          const imgWidth = 150;
          const imgHeight = imgWidth * aspect;
          simulatedY += imgHeight + 12;
          return;
        }
        if (el.tagName === 'DIV' || el.tagName === 'P' || el.tagName === 'LI') {
          const hasImage = el.querySelector('img, .notebook-embedded-image-wrapper');
          if (hasImage) {
            Array.from(el.childNodes).forEach(child => extractBlocksForHeight(child));
          } else {
            simulatedY += 24;
          }
        } else if (el.tagName === 'BR') {
          simulatedY += 24;
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent?.trim()) {
          simulatedY += 24;
        }
      }
    };
    Array.from(temp.childNodes).forEach(node => extractBlocksForHeight(node));
    if (simulatedY > maxContentY) {
      maxContentY = simulatedY;
    }

    // 2. Calculate drawing stroke height
    (activePage.drawings || []).forEach((path) => {
      path.points.forEach((pt) => {
        const ptY = pt.y <= 1.0 ? pt.y * baseH : pt.y;
        if (ptY > maxContentY) {
          maxContentY = ptY;
        }
      });
    });

    // 3. Calculate sticky notes height
    (activePage.stickyNotes || []).forEach((sticky) => {
      const stickyBottomY = (sticky.y * baseH) + 56; // h-28 is 112px, half is 56px
      if (stickyBottomY > maxContentY) {
        maxContentY = stickyBottomY;
      }
    });

    // 4. Calculate image stickers height
    (activePage.imageStickers || []).forEach((sticker) => {
      const img = loadedImagesMap[sticker.url];
      const aspect = img ? (img.naturalHeight / img.naturalWidth || 1) : 1;
      const stickerWidth = (sticker.width || 0.45) * baseW;
      const stickerHeight = stickerWidth * aspect;
      const stickerBottomY = (sticker.y * baseH) + (stickerHeight / 2);
      if (stickerBottomY > maxContentY) {
        maxContentY = stickerBottomY;
      }
    });

    // Add margin padding at bottom
    const exportHeight = Math.min(baseH, Math.max(200, Math.ceil(maxContentY + 40)));

    // Initialize Canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = baseW * dpr;
    exportCanvas.height = exportHeight * dpr;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const w = exportCanvas.width;
    const h = exportCanvas.height;

    // Lined paper background
    ctx.fillStyle = pageBgColor;
    ctx.fillRect(0, 0, w, h);

    // Horizontal lines grid (ruled paper lines)
    ctx.strokeStyle = isDarkTheme ? 'rgba(255, 255, 255, 0.12)' : '#e1e0cb';
    ctx.lineWidth = 1.5 * dpr;
    for (let y = 30 * dpr; y < h; y += 24 * dpr) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Red vertical margin line
    ctx.strokeStyle = '#ffb3b3';
    ctx.lineWidth = 2.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(36 * dpr, 0);
    ctx.lineTo(36 * dpr, h);
    ctx.stroke();

    // Draw text content and embedded inline images sequentially
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${14 * dpr}px sans-serif`;

    let currentY = 48;
    const drawContentBlocks = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains('notebook-embedded-image-wrapper') || el.tagName === 'IMG') {
          const imgUrl = el.querySelector('img')?.src || (el as HTMLImageElement).src;
          const img = imgUrl ? loadedImagesMap[imgUrl] : null;
          if (img) {
            const aspect = img.naturalHeight / img.naturalWidth || 1;
            const imgWidth = 150;
            const imgHeight = imgWidth * aspect;
            const align = el.dataset.align || 'right';
            const imgX = align === 'left' ? 48 : 210;

            ctx.drawImage(img, imgX * dpr, currentY * dpr, imgWidth * dpr, imgHeight * dpr);
            
            // Draw neat black border around embedded image to match notebook aesthetic
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2 * dpr;
            ctx.strokeRect(imgX * dpr, currentY * dpr, imgWidth * dpr, imgHeight * dpr);

            currentY += imgHeight + 12;
          }
          return;
        }

        if (el.tagName === 'DIV' || el.tagName === 'P' || el.tagName === 'LI') {
          const hasImage = el.querySelector('img, .notebook-embedded-image-wrapper');
          if (hasImage) {
            Array.from(el.childNodes).forEach(child => drawContentBlocks(child));
          } else {
            const txt = el.innerText || el.textContent || "";
            if (txt.trim()) {
              ctx.fillText(txt, 48 * dpr, currentY * dpr);
            }
            currentY += 24;
          }
        } else if (el.tagName === 'BR') {
          currentY += 24;
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.textContent?.trim();
        if (txt) {
          ctx.fillText(txt, 48 * dpr, currentY * dpr);
          currentY += 24;
        }
      }
    };
    Array.from(temp.childNodes).forEach(node => drawContentBlocks(node));

    // Render floating image stickers
    (activePage.imageStickers || []).forEach((sticker) => {
      const img = loadedImagesMap[sticker.url];
      if (img) {
        const stickerWidth = (sticker.width || 0.45) * baseW;
        const aspect = img.naturalHeight / img.naturalWidth || 1;
        const stickerHeight = stickerWidth * aspect;
        
        const stickerX = (sticker.x * baseW) - (stickerWidth / 2);
        const stickerY = (sticker.y * baseH) - (stickerHeight / 2);

        ctx.drawImage(img, stickerX * dpr, stickerY * dpr, stickerWidth * dpr, stickerHeight * dpr);
        
        // Draw neat black border around sticker
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(stickerX * dpr, stickerY * dpr, stickerWidth * dpr, stickerHeight * dpr);
      }
    });

    // Render sticky notes
    (activePage.stickyNotes || []).forEach((sticky) => {
      const colorMeta = STICKY_COLORS.find(c => c.name === sticky.color) || STICKY_COLORS[0];
      const stickyWidth = 135 * dpr;
      const stickyHeight = 112 * dpr;
      
      const stickyX = sticky.x * baseW * dpr;
      const stickyY = sticky.y * baseH * dpr;
      
      ctx.save();
      // Translate to sticky center and rotate
      ctx.translate(stickyX, stickyY);
      ctx.rotate((sticky.rotation * Math.PI) / 180);
      
      // Draw background drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(-stickyWidth / 2 + 4 * dpr, -stickyHeight / 2 + 4 * dpr, stickyWidth, stickyHeight);
      
      // Draw sticky note body
      ctx.fillStyle = colorMeta.bg;
      ctx.fillRect(-stickyWidth / 2, -stickyHeight / 2, stickyWidth, stickyHeight);
      
      // Draw sticky note border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2 * dpr;
      ctx.strokeRect(-stickyWidth / 2, -stickyHeight / 2, stickyWidth, stickyHeight);
      
      // Draw top bar
      ctx.fillStyle = colorMeta.border;
      ctx.fillRect(-stickyWidth / 2, -stickyHeight / 2, stickyWidth, 14 * dpr);
      ctx.strokeRect(-stickyWidth / 2, -stickyHeight / 2, stickyWidth, 14 * dpr);
      
      // Draw text
      ctx.fillStyle = colorMeta.text;
      ctx.font = `bold ${11 * dpr}px sans-serif`;
      
      const textX = -stickyWidth / 2 + 8 * dpr;
      let textY = -stickyHeight / 2 + 24 * dpr;
      const maxWidth = stickyWidth - 16 * dpr;
      const lineHeight = 14 * dpr;
      
      const words = (sticky?.text || '').split(' ');
      let currentLine = '';
      
      words.forEach((word) => {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          ctx.fillText(currentLine, textX, textY);
          currentLine = word;
          textY += lineHeight;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) {
        ctx.fillText(currentLine, textX, textY);
      }
      
      ctx.restore();
    });

    // Render drawings on top
    (activePage.drawings || []).forEach((path) => {
      if (path.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color === 'eraser' ? pageBgColor : path.color;
      ctx.lineWidth = path.width * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const getPt = (pt: { x: number; y: number }) => {
        if (pt.x <= 1.0 && pt.y <= 1.0) {
          return { x: pt.x * baseW * dpr, y: pt.y * baseH * dpr };
        }
        return { x: pt.x * dpr, y: pt.y * dpr };
      };

      const p0 = getPt(path.points[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < path.points.length; i++) {
        const p = getPt(path.points[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    });

    // Trigger download
    const link = document.createElement('a');
    link.download = `${bookTitle.toLowerCase().replace(/\s+/g, '_')}_page_${activePageIndex + 1}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={isMobile ? { y: '100%', opacity: 0 } : { width: 0, opacity: 0 }}
          animate={isMobile ? { y: 0, opacity: 1 } : { width: sidebarWidth, opacity: 1 }}
          exit={isMobile ? { y: '100%', opacity: 0 } : { width: 0, opacity: 0 }}
          transition={isResizing ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
          drag={isMobile ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          dragSnapToOrigin
          onDragEnd={(e, info) => {
            if (isMobile && (info.offset.y > 100 || info.velocity.y > 400)) {
              onClose();
            }
          }}
          className={isMobile 
            ? "fixed inset-0 h-[100dvh] w-full flex flex-col z-[1500] shadow-2xl select-none transition-colors overflow-hidden"
            : "relative h-full border-l-4 border-black flex flex-col z-[1100] shrink-0 select-none transition-colors overflow-hidden shadow-[-4px_0_16px_rgba(0,0,0,0.12)]"
          }
          style={isMobile 
            ? { width: '100%', height: '100dvh', backgroundColor: pageBgColor } 
            : { width: `${sidebarWidth}px`, height: '100%', backgroundColor: pageBgColor, borderColor: pageBorderColor }
          }
        >
          {/* Draggable resize handle border on the left edge - ONLY on desktop */}
          {!isMobile && (
            <div 
              onMouseDown={handleResizeStart}
              className={`absolute left-[-5px] top-0 bottom-0 w-2.5 cursor-col-resize z-[1310] transition-colors ${
                isResizing ? 'bg-orange-500 w-2' : 'bg-transparent hover:bg-orange-400/60'
              }`}
              title="Drag left/right to resize notebook side-by-side"
            />
          )}

          {/* UNIVERSAL HEADER */}
          <div 
            className="h-12 border-b-2 border-black flex items-center justify-between px-3 shrink-0 z-[1260] select-none transition-colors shadow-xs"
            style={{
              backgroundColor: pageSurfaceColor,
              borderColor: pageBorderColor,
              color: pageTextColor
            }}
          >
            <div className="flex items-center gap-2">
              <BookSpiralIcon className="w-5 h-5 opacity-90" />
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-black uppercase tracking-widest opacity-90">
                  Notebook
                </span>
                <span className="text-[10px] font-bold opacity-75 line-clamp-1 max-w-[150px]">
                  {bookTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Page Navigator */}
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border-2 border-black px-2 py-0.5 rounded-md text-[10px] font-black shadow-[2px_2px_0_black]">
                <button 
                  disabled={activePageIndex === 0} 
                  onClick={() => setActivePageIndex(p => Math.max(0, p - 1))}
                  className="hover:opacity-100 opacity-60 disabled:opacity-20 p-0.5"
                  title="Previous page"
                >
                  <ChevronLeft size={12} />
                </button>
                <span>{activePageIndex + 1} / {pages.length}</span>
                <button 
                  disabled={activePageIndex >= pages.length - 1} 
                  onClick={() => setActivePageIndex(p => Math.min(pages.length - 1, p + 1))}
                  className="hover:opacity-100 opacity-60 disabled:opacity-20 p-0.5"
                  title="Next page"
                >
                  <ChevronRight size={12} />
                </button>
              </div>

              {/* Save Status Badge */}
              <Tooltip label={saveStatus === 'saved' ? 'All changes saved' : saveStatus === 'saving' ? 'Saving pages...' : 'Writing error!'}>
                <div className="flex items-center">
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-300 text-black px-2 py-0.5 rounded border-2 border-black shadow-[1px_1px_0_black]">
                      <Check size={10} strokeWidth={3.5} /> Saved
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-amber-300 text-black px-2 py-0.5 rounded border-2 border-black shadow-[1px_1px_0_black]">
                      <Loader size={8} className="animate-spin" /> Saving
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-red-300 text-black px-2 py-0.5 rounded border-2 border-black shadow-[1px_1px_0_black]">
                      Error
                    </span>
                  )}
                </div>
              </Tooltip>

              <button
                onClick={onClose}
                className="p-1 rounded-md border-2 border-black bg-white hover:bg-amber-100 dark:bg-zinc-800 text-black dark:text-white transition-all shadow-[2px_2px_0_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                title="Close Notebook"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* TOP ACTIONS STATIONERY TOOLBAR */}
          <div 
            ref={toolbarContainerRef}
            className="px-2.5 py-2 border-b-2 border-black flex flex-col gap-2 shrink-0 z-[2000] select-none text-xs transition-colors relative"
            style={{
              backgroundColor: pageSurfaceColor,
              borderColor: pageBorderColor,
              color: pageTextColor
            }}
          >
            {/* Backdrop for closing popups when clicking outside */}
            {activeDropdownTool && (
              <div className="fixed inset-0 z-[2500]" onClick={() => setActiveDropdownTool(null)} />
            )}

            {/* ROW 1: Stationery Tools & Font Options */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {/* Primary Tools Group */}
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {/* TEXT TOOL BUTTON WITH DROPDOWN */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setActiveTool('type');
                      setActiveWidth(2.2);
                      setActiveDropdownTool(v => v === 'type' ? null : 'type');
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all ${
                      activeTool === 'type'
                        ? 'bg-amber-300 text-black translate-x-[1px] translate-y-[1px] shadow-none'
                        : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-amber-100'
                    }`}
                    title="Text Tool (Click to select & open color picker)"
                  >
                    <Type size={14} strokeWidth={2.5} />
                    {!isNarrowToolbar && <span>Text</span>}
                    <div 
                      className="w-2.5 h-2.5 rounded-full border border-black inline-block shrink-0"
                      style={{ backgroundColor: textToolColor }}
                    />
                    <ChevronDown size={11} className={`opacity-70 transition-transform ${activeDropdownTool === 'type' ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Popover for Text Color */}
                  {activeDropdownTool === 'type' && (
                    <div className="absolute top-full left-0 sm:left-0 -left-12 mt-2 z-[3000] bg-white dark:bg-zinc-900 border-3 border-black rounded-xl p-3 flex flex-col gap-2 min-w-[260px] max-w-[calc(100vw-2rem)] shadow-[6px_6px_0_black]">
                      <div className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white px-1 flex justify-between items-center">
                        <span>Text Color</span>
                        <button onClick={() => setActiveDropdownTool(null)} className="p-0.5 text-black hover:text-amber-600 dark:text-white">
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 overflow-x-auto p-0.5">
                        <div className="grid grid-cols-10 gap-1.5 min-w-[240px]">
                          {GRID_GRAYSCALE.map((item, idx) => {
                            const isSelected = isColorMatch(textToolColor, item.color);
                            const isLight = isLightColor(item.color);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setTextToolColor(item.color);
                                  selectStationery('type', item.color, activeWidth);
                                  setActiveDropdownTool(null);
                                }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center border border-black transition-transform hover:scale-110 active:scale-95 ${
                                  isLight ? 'border-2 border-black' : ''
                                }`}
                                style={{ backgroundColor: item.color }}
                                title={item.name}
                              >
                                {isSelected && (
                                  <Check size={13} strokeWidth={3.5} className={isLight ? 'text-black' : 'text-white'} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-10 gap-1.5 min-w-[240px]">
                          {GRID_VIBRANT.map((item, idx) => {
                            const isSelected = isColorMatch(textToolColor, item.color);
                            const isLight = isLightColor(item.color);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setTextToolColor(item.color);
                                  selectStationery('type', item.color, activeWidth);
                                  setActiveDropdownTool(null);
                                }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center border border-black transition-transform hover:scale-110 active:scale-95 ${
                                  isLight ? 'border-2 border-black' : ''
                                }`}
                                style={{ backgroundColor: item.color }}
                                title={item.name}
                              >
                                {isSelected && (
                                  <Check size={13} strokeWidth={3.5} className={isLight ? 'text-black' : 'text-white'} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* DRAW TOOL BUTTON WITH DROPDOWN */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setActiveTool('draw');
                      setActiveWidth(2.2);
                      setActiveDropdownTool(v => v === 'draw' ? null : 'draw');
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all ${
                      activeTool === 'draw'
                        ? 'bg-cyan-300 text-black translate-x-[1px] translate-y-[1px] shadow-none'
                        : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-cyan-100'
                    }`}
                    title="Draw Tool (Click to select & open color picker)"
                  >
                    <Pencil size={14} strokeWidth={2.5} />
                    {!isNarrowToolbar && <span>Draw</span>}
                    <div 
                      className="w-2.5 h-2.5 rounded-full border border-black inline-block shrink-0"
                      style={{ backgroundColor: drawToolColor }}
                    />
                    <ChevronDown size={11} className={`opacity-70 transition-transform ${activeDropdownTool === 'draw' ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Popover for Draw Color */}
                  {activeDropdownTool === 'draw' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 z-[3000] bg-white dark:bg-zinc-900 border-3 border-black rounded-xl p-3 flex flex-col gap-2 min-w-[260px] max-w-[calc(100vw-2rem)] shadow-[6px_6px_0_black]">
                      <div className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white px-1 flex justify-between items-center">
                        <span>Ink Color</span>
                        <button onClick={() => setActiveDropdownTool(null)} className="p-0.5 text-black hover:text-cyan-600 dark:text-white">
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="flex flex-col gap-2 overflow-x-auto p-0.5">
                        <div className="grid grid-cols-10 gap-1.5 min-w-[240px]">
                          {GRID_GRAYSCALE.map((item, idx) => {
                            const isSelected = isColorMatch(drawToolColor, item.color);
                            const isLight = isLightColor(item.color);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setDrawToolColor(item.color);
                                  selectStationery('draw', item.color, activeWidth);
                                  setActiveDropdownTool(null);
                                }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center border border-black transition-transform hover:scale-110 active:scale-95 ${
                                  isLight ? 'border-2 border-black' : ''
                                }`}
                                style={{ backgroundColor: item.color }}
                                title={item.name}
                              >
                                {isSelected && (
                                  <Check size={13} strokeWidth={3.5} className={isLight ? 'text-black' : 'text-white'} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-10 gap-1.5 min-w-[240px]">
                          {GRID_VIBRANT.map((item, idx) => {
                            const isSelected = isColorMatch(drawToolColor, item.color);
                            const isLight = isLightColor(item.color);
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setDrawToolColor(item.color);
                                  selectStationery('draw', item.color, activeWidth);
                                  setActiveDropdownTool(null);
                                }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center border border-black transition-transform hover:scale-110 active:scale-95 ${
                                  isLight ? 'border-2 border-black' : ''
                                }`}
                                style={{ backgroundColor: item.color }}
                                title={item.name}
                              >
                                {isSelected && (
                                  <Check size={13} strokeWidth={3.5} className={isLight ? 'text-black' : 'text-white'} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* HIGHLIGHT TOOL BUTTON WITH DROPDOWN */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setActiveTool('highlight');
                      setActiveWidth(14);
                      setActiveDropdownTool(v => v === 'highlight' ? null : 'highlight');
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all ${
                      activeTool === 'highlight'
                        ? 'bg-yellow-300 text-black translate-x-[1px] translate-y-[1px] shadow-none'
                        : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-yellow-100'
                    }`}
                    title="Highlight Tool (Click to select & open color picker)"
                  >
                    <Highlighter size={14} strokeWidth={2.5} />
                    {!isNarrowToolbar && <span>Highlight</span>}
                    <div 
                      className="w-2.5 h-2.5 rounded-full border border-black inline-block shrink-0"
                      style={{ backgroundColor: highlightToolColor === 'transparent' ? '#cbd5e1' : highlightToolColor }}
                    />
                    <ChevronDown size={11} className={`opacity-70 transition-transform ${activeDropdownTool === 'highlight' ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Popover for Highlight Color */}
                  {activeDropdownTool === 'highlight' && (
                    <div className="absolute top-full right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 z-[3000] bg-white dark:bg-zinc-900 border-3 border-black rounded-xl p-3 flex flex-col gap-2 min-w-[220px] max-w-[calc(100vw-1.5rem)] shadow-[6px_6px_0_black]">
                      <div className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white px-1 flex justify-between items-center">
                        <span>Highlight Color</span>
                        <button onClick={() => setActiveDropdownTool(null)} className="p-0.5 text-black hover:text-yellow-600 dark:text-white">
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 max-h-[180px] overflow-y-auto p-0.5">
                        {HIGHLIGHT_GRID.map((item, idx) => {
                          const isSelected = isColorMatch(highlightToolColor, item.color);
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                setHighlightToolColor(item.color);
                                selectStationery('highlight', item.color, 14);
                                setActiveDropdownTool(null);
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-black transition-transform hover:scale-110 active:scale-95 relative overflow-hidden shrink-0"
                              style={{ backgroundColor: item.solid === 'transparent' ? '#ffffff' : item.solid }}
                              title={item.name}
                            >
                              {item.color === 'transparent' && (
                                <div className="w-full h-[2px] bg-red-500 rotate-45 absolute" />
                              )}
                              {isSelected && (
                                <Check size={13} strokeWidth={3.5} className="text-black relative z-10" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ERASER TOOL BUTTON */}
                <button
                  onClick={() => {
                    setActiveTool('eraser');
                    setActiveWidth(16);
                    setActiveDropdownTool(null);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all ${
                    activeTool === 'eraser'
                      ? 'bg-pink-300 text-black translate-x-[1px] translate-y-[1px] shadow-none'
                      : 'bg-white dark:bg-zinc-800 text-black dark:text-white hover:bg-pink-100'
                  }`}
                  title="Eraser Tool"
                >
                  <Eraser size={14} strokeWidth={2.5} />
                  {!isNarrowToolbar && <span>Eraser</span>}
                </button>
              </div>

              {/* Widgets & Font Dropdown Group */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                {/* FONT OPTIONS DROPDOWN */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setActiveDropdownTool(v => v === 'font' ? null : 'font')}
                    className="px-2 py-1.5 rounded-lg bg-orange-200 text-black hover:bg-orange-300 text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    title="Font Options"
                  >
                    <Type size={13} strokeWidth={3} />
                    {!isNarrowToolbar && <span>Font ({FONT_OPTIONS.find(f => f.id === selectedFont)?.name})</span>}
                    <ChevronDown size={11} className={`opacity-70 transition-transform ${activeDropdownTool === 'font' ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdownTool === 'font' && (
                    <div className="absolute right-0 top-full mt-2 z-[3000] bg-white dark:bg-zinc-900 border-3 border-black rounded-xl p-2.5 flex flex-col gap-1.5 min-w-[180px] shadow-[6px_6px_0_black]">
                      <div className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white px-1 flex justify-between items-center mb-0.5">
                        <span>Notebook Font</span>
                        <button onClick={() => setActiveDropdownTool(null)} className="p-0.5 text-black hover:text-orange-600 dark:text-white">
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                      {FONT_OPTIONS.map((f) => {
                        const isSelected = selectedFont === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              setSelectedFont(f.id as any);
                              localStorage.setItem('zizhi-notebook-font', f.id);
                              setActiveDropdownTool(null);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold transition-all border-2 ${
                              isSelected ? 'border-black bg-orange-300 text-black shadow-[2px_2px_0_black]' : 'border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-black dark:text-white'
                            }`}
                            style={{ fontFamily: f.family }}
                          >
                            <span className="text-sm">{f.name}</span>
                            <span className="text-[11px] opacity-70">{f.sample}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddSticky}
                  className="px-2 py-1.5 rounded-lg bg-emerald-200 text-black hover:bg-emerald-300 text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  title="Add Sticky Note"
                >
                  <StickyIcon size={13} strokeWidth={2.5} />
                  {!isNarrowToolbar && <span>Sticky</span>}
                </button>

                <button
                  onClick={triggerImageUpload}
                  className="px-2 py-1.5 rounded-lg bg-purple-200 text-black hover:bg-purple-300 text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  title="Add Photo Sticker"
                >
                  <ImageIcon size={13} strokeWidth={2.5} />
                  {!isNarrowToolbar && <span>Photo</span>}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageFile} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            {/* ROW 2: Undo, Download, Theme, Page (Clear Button Removed) */}
            <div className="flex items-center justify-between gap-2 border-t-2 border-black/10 dark:border-white/10 pt-1.5 flex-wrap sm:flex-nowrap">
              {/* Left Group: Undo & Download PDF */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleUndoSketch}
                  className="px-2 py-1.5 bg-white dark:bg-zinc-800 hover:bg-slate-100 text-black dark:text-white rounded-lg font-black text-[11px] flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  title="Undo drawing stroke"
                >
                  <RotateCcw size={14} strokeWidth={2.5} />
                  {!isNarrowToolbar && <span>Undo</span>}
                </button>

                <button
                  onClick={() => handleExportPDF()}
                  disabled={isExporting}
                  className="px-2 py-1.5 bg-white dark:bg-zinc-800 hover:bg-slate-100 text-black dark:text-white rounded-lg font-black text-[11px] flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  title="Download PDF Notes"
                >
                  {isExporting ? <Loader size={12} /> : <Download size={14} strokeWidth={2.5} />}
                  {!isNarrowToolbar && <span>Download</span>}
                </button>
              </div>

              {/* Right Group: Theme & Add Page */}
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="relative">
                  <button
                    onClick={() => setActiveDropdownTool(v => v === 'theme' ? null : 'theme')}
                    className="px-2 py-1.5 rounded-lg bg-lime-200 text-black hover:bg-lime-300 text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    title="Change Notebook Theme"
                  >
                    <Palette size={14} strokeWidth={2.5} />
                    {!isNarrowToolbar && <span>Theme ({currentNotebookTheme.name})</span>}
                    <ChevronDown size={11} className={`opacity-70 transition-transform ${activeDropdownTool === 'theme' ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdownTool === 'theme' && (
                    <div className="absolute right-0 top-full mt-2 z-[3000] bg-white dark:bg-zinc-900 border-3 border-black rounded-xl p-2.5 flex flex-col gap-1.5 min-w-[170px] shadow-[6px_6px_0_black]">
                      <div className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white px-1 flex justify-between items-center mb-0.5">
                        <span>Notebook Theme</span>
                        <button onClick={() => setActiveDropdownTool(null)} className="p-0.5 text-black hover:text-lime-600 dark:text-white">
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                      {Object.values(ATMOSPHERES).map((atm) => {
                        const isSelected = currentNotebookTheme.id === atm.id;
                        return (
                          <button
                            key={atm.id}
                            onClick={() => {
                              setNotebookThemeId(atm.id);
                              localStorage.setItem('zizhi-notebook-theme-id', atm.id);
                              setActiveDropdownTool(null);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold transition-all border-2 ${
                              isSelected ? 'border-black bg-lime-300 text-black shadow-[2px_2px_0_black]' : 'border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800 text-black dark:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-black shrink-0" 
                                style={{ backgroundColor: atm.colors.background }}
                              />
                              <span>{atm.name}</span>
                            </div>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={addPage}
                  className="px-2.5 py-1.5 bg-amber-400 text-black hover:bg-amber-500 rounded-lg text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-[2px_2px_0_black] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  title="Add New Page"
                >
                  <Plus size={14} strokeWidth={3} />
                  {!isNarrowToolbar && <span>+ Page</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Hidden file input for mobile photo sticker upload */}
          {isMobile && (
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageFile} 
              accept="image/*" 
              className="hidden" 
            />
          )}

          {/* Scrollable Container with multi-page notebook stack */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto flex flex-col gap-0 scroll-smooth no-scrollbar select-none p-0 transition-colors"
            style={{ 
              backgroundColor: pageBgColor,
              backgroundImage: 'none',
            }}
          >
            {isLoading ? (
              <Box className="flex-1 flex flex-col items-center justify-center p-8 bg-black/5 dark:bg-white/5 rounded max-w-sm mx-auto my-12 border border-black/10">
                <Loader size="lg" />
                <Text className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-4">
                  Opening Notebook...
                </Text>
              </Box>
            ) : (
              <>
                {pages.map((pageData, index) => (
                  <div
                    key={pageData.id}
                    onClickCapture={() => setActivePageIndex(index)}
                    className="relative w-full"
                  >
                    <NotebookPage
                      pageData={pageData}
                      pageNumber={index + 1}
                      activeTool={activeTool}
                      activeColor={activeColor}
                      activeWidth={activeWidth}
                      onChange={(updated) => handlePageChange(index, updated)}
                      onDelete={pages.length > 1 ? () => deletePage(index) : undefined}
                      isActive={index === activePageIndex}
                      isMobile={isMobile}
                      theme={currentNotebookTheme}
                      fontFamily={selectedFont}
                    />
                  </div>
                ))}

                {/* Add Page layout footer button */}
                <div 
                  className="py-8 flex flex-col items-center justify-center border-t transition-colors pb-20"
                  style={{
                    backgroundColor: pageBgColor,
                    borderColor: pageBorderColor,
                    color: pageTextColor
                  }}
                >
                  <button
                    onClick={addPage}
                    className="px-5 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-black/15 dark:border-white/20 transition-all active:scale-95"
                    style={{ color: pageTextColor }}
                  >
                    <Plus size={14} strokeWidth={3} />
                    Add New Page
                  </button>
                  <Text className="text-[10px] font-bold uppercase tracking-widest mt-3 opacity-60" style={{ color: pageTextColor }}>
                    Total: {pages.length} Pages
                  </Text>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const BookSpiralIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
    <path d="M6 14h10" />
    <path d="M4 19.5h16" />
  </svg>
);
