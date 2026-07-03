import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Group, Stack, Text, ActionIcon, Loader, Tooltip } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronRight
} from 'lucide-react';
import type { DrawingPath, StickyNote, ImageSticker, NotebookData, NotebookPageData } from '../types';
import * as db from '../db';
import { NotebookPage } from './NotebookPage';

interface NotebookSidebarProps {
  bookId: string;
  bookTitle: string;
  onClose: () => void;
  isOpen: boolean;
}

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

export const NotebookSidebar: React.FC<NotebookSidebarProps> = ({ bookId, bookTitle, onClose, isOpen }) => {
  const [pages, setPages] = useState<NotebookPageData[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  // Custom Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = useState<number>(440);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Stationery drawer tool configuration
  const [activeTool, setActiveTool] = useState<'type' | 'draw' | 'highlight' | 'eraser'>('type');
  const [textToolColor, setTextToolColor] = useState('#1e293b');
  const [drawToolColor, setDrawToolColor] = useState('#1e293b');
  const [highlightToolColor, setHighlightToolColor] = useState('rgba(253, 224, 71, 0.45)');
  const [activeWidth, setActiveWidth] = useState(2.2);

  const activeColor = useMemo(() => {
    if (activeTool === 'type') return textToolColor;
    if (activeTool === 'draw') return drawToolColor;
    if (activeTool === 'highlight') return highlightToolColor;
    if (activeTool === 'eraser') return 'eraser';
    return '#1e293b';
  }, [activeTool, textToolColor, drawToolColor, highlightToolColor]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Load local IndexedDB notebook data
  useEffect(() => {
    const loadNotebookData = async () => {
      setIsLoading(true);
      try {
        const localData = await db.getNotebook(bookId);
        
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
  }, [bookId, isOpen]);

  // Debounced Auto Save to IndexedDB
  const lastSaveTimerRef = useRef<number | null>(null);

  const triggerSave = useCallback((updatedPages: NotebookPageData[]) => {
    if (lastSaveTimerRef.current) {
      window.clearTimeout(lastSaveTimerRef.current);
    }
    setSaveStatus('saving');

    lastSaveTimerRef.current = window.setTimeout(async () => {
      try {
        const notebookObj: NotebookData = {
          bookId,
          userId: 'local_student',
          drawings: '[]', // retained for retro schemas
          stickyNotes: '[]',
          pages: JSON.stringify(updatedPages),
          updatedAt: Date.now(),
        };
        await db.saveNotebook(notebookObj);
        setSaveStatus('saved');
      } catch (err) {
        console.error('Error saving notebook:', err);
        setSaveStatus('error');
      }
    }, 1200);
  }, [bookId]);



  // Handle updates to individual pages
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

  // Delete a specific page
  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      alert("Your notebook needs to keep at least one active page!");
      return;
    }
    if (window.confirm(`Are you sure you want to tear out and delete Page ${index + 1}?`)) {
      const updated = pages.filter((_, idx) => idx !== index);
      setPages(updated);
      setActivePageIndex(Math.max(0, index - 1));
      triggerSave(updated);
    }
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
    // Keep width constraints between 320px and 85% of screen width
    if (newWidth > 320 && newWidth < window.innerWidth * 0.85) {
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
    if (tool === 'type') {
      setTextToolColor(color);
    } else if (tool === 'draw') {
      setDrawToolColor(color);
    } else if (tool === 'highlight') {
      setHighlightToolColor(color);
    }
    setActiveWidth(width);

    // Proactively apply color formatting if text is selected inside the editor
    if (tool === 'type' && color !== 'eraser') {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        document.execCommand('foreColor', false, color);
      }
    } else if (tool === 'highlight') {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        document.execCommand('backColor', false, color);
      }
    }
  };

  // Clear drawings and text of the current active page
  const handleClearPage = () => {
    if (window.confirm(`Clear all sketches, text, and sticky notes on Page ${activePageIndex + 1}?`)) {
      const clearedPage: NotebookPageData = {
        ...pages[activePageIndex],
        text: '',
        drawings: [],
        stickyNotes: [],
        imageStickers: [],
      };
      handlePageChange(activePageIndex, clearedPage);
    }
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

  // Export current page to PNG
  const handleExportPNG = async () => {
    const activePage = pages[activePageIndex];
    const baseW = 400;
    const baseH = 680;
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
        const ptY = pt.y * baseH;
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
    ctx.fillStyle = '#fcfbe3';
    ctx.fillRect(0, 0, w, h);

    // Horizontal lines grid (ruled paper lines)
    ctx.strokeStyle = '#e1e0cb';
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
      
      const words = sticky.text.split(' ');
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
      ctx.strokeStyle = path.color === 'eraser' ? '#fcfbe3' : path.color;
      ctx.lineWidth = path.width * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const p0 = path.points[0];
      ctx.moveTo(p0.x * baseW * dpr, p0.y * baseH * dpr);
      for (let i = 1; i < path.points.length; i++) {
        const p = path.points[i];
        ctx.lineTo(p.x * baseW * dpr, p.y * baseH * dpr);
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
          initial={isMobile ? { y: '100%', x: 0 } : { x: '100%', y: 0 }}
          animate={isMobile ? { y: 0, x: 0 } : { x: 0, y: 0 }}
          exit={isMobile ? { y: '100%', x: 0 } : { x: '100%', y: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 170 }}
          className={isMobile 
            ? "fixed bottom-0 left-0 right-0 h-[70vh] bg-[#fcfbe3] border-t-4 border-black flex flex-col z-[1250] shadow-[0_-8px_24px_rgba(0,0,0,0.15)]"
            : "bg-[#1e293b]/5 backdrop-blur-md border-l-4 border-black flex flex-col h-full z-[1250] shrink-0 relative shadow-[[-8px_0_0_rgba(0,0,0,0.15)]]"
          }
          style={isMobile ? { width: '100%', height: '70vh' } : { width: `${sidebarWidth}px` }}
        >
          {/* Draggable resize handle border on the left edge - ONLY on desktop */}
          {!isMobile && (
            <div 
              onMouseDown={handleResizeStart}
              className={`absolute left-[-5px] top-0 bottom-0 w-2 cursor-col-resize z-[1310] transition-colors ${
                isResizing ? 'bg-orange-500 w-1.5' : 'bg-transparent hover:bg-orange-400/50'
              }`}
              title="Drag to resize notebook drawer"
            />
          )}

          {/* Decorative Drag Handle for mobile drawer */}
          {isMobile && (
            <div className="w-full flex justify-center py-2 bg-orange-100 border-b border-black/5 shrink-0">
              <div className="w-12 h-1.5 bg-black/20 rounded-full" />
            </div>
          )}

          {/* Notebook Title Bar & Controls */}
          <div className="h-16 border-b-4 border-black bg-orange-100 flex items-center justify-between px-4 shrink-0 z-[1260] shadow-sm select-none">
            <Group gap="xs">
              <BookSpiralIcon className="w-6 h-6 text-orange-800" />
              <Stack gap={0}>
                <Text className="text-[11px] font-black uppercase tracking-widest text-orange-950">
                  Student Notebook
                </Text>
                <Text className="text-[10px] font-bold text-orange-800 uppercase tracking-wider line-clamp-1 max-w-[180px]">
                  {bookTitle}
                </Text>
              </Stack>
            </Group>

            <Group gap="xs">
              {/* Local Storage Auto Sync Badge */}
              <Tooltip label={saveStatus === 'saved' ? 'All changes successfully written to Local Storage' : saveStatus === 'saving' ? 'Saving pages...' : 'Writing error!'}>
                <div className="flex items-center">
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 border border-emerald-400">
                      <Check size={10} strokeWidth={4} /> Saved
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-yellow-100 text-yellow-800 px-2 py-0.5 border border-yellow-400">
                      <Loader size={8} className="animate-spin text-yellow-800" /> Saving
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-800 px-2 py-0.5 border border-red-400">
                      Error
                    </span>
                  )}
                </div>
              </Tooltip>

              <ActionIcon 
                variant="filled" 
                color="orange" 
                size="lg"
                onClick={onClose}
                className="border-2 border-black rounded-none shadow-[3px_3px_0_black] bg-orange-400 text-black hover:bg-orange-300 active:translate-y-0.5 active:shadow-none transition-all"
                title="Hide Notebook Drawer"
              >
                <X size={20} strokeWidth={3} className="text-black" />
              </ActionIcon>
            </Group>
          </div>

          {/* Wooden Pencil Case Drawer / Stationery Drawer Layout */}
          <div className="p-3 bg-amber-50 border-b-4 border-black flex flex-col gap-2.5 shrink-0 z-[1260] shadow-[inset_0_-4px_8px_rgba(139,92,26,0.1)]">
            {/* Primary Simplified Tools Row */}
            <div className="grid grid-cols-4 gap-2 select-none">
              {/* 1. Text Tool */}
              <button
                onClick={() => {
                  setActiveTool('type');
                  setActiveWidth(2.2);
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 border-2 relative transition-all ${
                  activeTool === 'type' 
                    ? 'bg-amber-200 border-black shadow-[3px_3px_0_black] -translate-y-0.5' 
                    : 'bg-white border-black/20 hover:border-black hover:-translate-y-0.5'
                }`}
                style={{ borderRadius: '4px' }}
                title="Keyboard Typing Tool"
              >
                <Type size={16} className="text-slate-800 mb-1" strokeWidth={2.5} />
                <Text className="text-[9px] font-black uppercase tracking-tight leading-none">
                  Text
                </Text>
                {activeTool === 'type' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />}
              </button>

              {/* 2. Draw Tool */}
              <button
                onClick={() => {
                  setActiveTool('draw');
                  setActiveWidth(2.2);
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 border-2 relative transition-all ${
                  activeTool === 'draw' 
                    ? 'bg-amber-200 border-black shadow-[3px_3px_0_black] -translate-y-0.5' 
                    : 'bg-white border-black/20 hover:border-black hover:-translate-y-0.5'
                }`}
                style={{ borderRadius: '4px' }}
                title="Freehand Sketch Tool"
              >
                <Pencil size={16} className="text-slate-800 mb-1" strokeWidth={2.5} />
                <Text className="text-[9px] font-black uppercase tracking-tight leading-none">
                  Draw
                </Text>
                {activeTool === 'draw' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />}
              </button>

              {/* 3. Highlight Tool */}
              <button
                onClick={() => {
                  setActiveTool('highlight');
                  setActiveWidth(14);
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 border-2 relative transition-all ${
                  activeTool === 'highlight' 
                    ? 'bg-amber-200 border-black shadow-[3px_3px_0_black] -translate-y-0.5' 
                    : 'bg-white border-black/20 hover:border-black hover:-translate-y-0.5'
                }`}
                style={{ borderRadius: '4px' }}
                title="Text Highlight Tool"
              >
                <Highlighter size={16} className="text-slate-800 mb-1" strokeWidth={2.5} />
                <Text className="text-[9px] font-black uppercase tracking-tight leading-none">
                  Highlight
                </Text>
                {activeTool === 'highlight' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />}
              </button>

              {/* 4. Eraser Tool */}
              <button
                onClick={() => {
                  setActiveTool('eraser');
                  setActiveWidth(16);
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 border-2 relative transition-all ${
                  activeTool === 'eraser' 
                    ? 'bg-amber-200 border-black shadow-[3px_3px_0_black] -translate-y-0.5' 
                    : 'bg-white border-black/20 hover:border-black hover:-translate-y-0.5'
                }`}
                style={{ borderRadius: '4px' }}
                title="Eraser Tool"
              >
                <Eraser size={16} className="text-pink-600 mb-1" strokeWidth={2.5} />
                <Text className="text-[9px] font-black uppercase tracking-tight leading-none">
                  Eraser
                </Text>
                {activeTool === 'eraser' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45" />}
              </button>
            </div>

            {/* Dynamic Color Palette Row */}
            {(activeTool === 'type' || activeTool === 'draw' || activeTool === 'highlight') && (
              <div className="flex flex-col gap-1 border-t border-amber-200/50 pt-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-amber-900/60">
                    Select {activeTool === 'type' ? 'Text' : activeTool === 'draw' ? 'Ink' : 'Highlight'} Color:
                  </span>
                  {activeTool === 'highlight' && (
                    <span className="text-[7.5px] font-bold text-amber-800/80 uppercase">
                      Drag over words to highlight
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  {activeTool === 'type' && TEXT_COLORS.map((tc, idx) => {
                    const isSelected = activeColor === tc.color;
                    return (
                      <button
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevent losing contentEditable focus
                          selectStationery('type', tc.color, 2.2);
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 border-2 transition-all shrink-0 ${
                          isSelected 
                            ? 'bg-amber-200 border-black shadow-[2px_2px_0_black] -translate-y-0.5' 
                            : 'bg-white border-black/20 hover:border-black hover:-translate-y-0.5'
                        }`}
                        style={{ borderRadius: '4px' }}
                        title={tc.name}
                      >
                        <div className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: tc.color }} />
                        <span className="text-[8.5px] font-bold text-slate-800">{tc.name}</span>
                      </button>
                    );
                  })}

                  {activeTool === 'draw' && DRAW_COLORS.map((dc, idx) => {
                    const isSelected = activeColor === dc.color && activeWidth === dc.width;
                    return (
                      <button
                        key={idx}
                        onClick={() => selectStationery('draw', dc.color, dc.width)}
                        className={`flex items-center gap-1.5 px-2 py-1 border-2 transition-all shrink-0 ${
                          isSelected 
                            ? 'bg-amber-200 border-black shadow-[2px_2px_0_black] -translate-y-0.5' 
                            : 'bg-white border-black/20 hover:border-black hover:-translate-y-0.5'
                        }`}
                        style={{ borderRadius: '4px' }}
                        title={dc.name}
                      >
                        <div className="w-3 h-3 rounded-full border border-black/30" style={{ backgroundColor: dc.color }} />
                        <span className="text-[8.5px] font-bold text-slate-800">{dc.name}</span>
                      </button>
                    );
                  })}

                  {activeTool === 'highlight' && HIGHLIGHT_COLORS.map((hc, idx) => {
                    const isSelected = activeColor === hc.color;
                    return (
                      <button
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevent losing contentEditable focus
                          selectStationery('highlight', hc.color, 14);
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 border-2 transition-all shrink-0 ${
                          isSelected 
                            ? 'bg-amber-200 border-black shadow-[2px_2px_0_black] -translate-y-0.5' 
                            : 'bg-white border-black/20 hover:border-black hover:-translate-y-0.5'
                        }`}
                        style={{ borderRadius: '4px' }}
                        title={hc.name}
                      >
                        {hc.color === 'transparent' ? (
                          <div className="w-3 h-3 border border-dashed border-red-500 relative flex items-center justify-center">
                            <div className="w-4 h-[1px] bg-red-500 rotate-45 absolute" />
                          </div>
                        ) : (
                          <div className="w-4 h-2.5 rounded-sm border border-black/30" style={{ backgroundColor: hc.color }} />
                        )}
                        <span className="text-[8.5px] font-bold text-slate-800">{hc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sticky widgets & canvas controls */}
            <div className="flex items-center justify-between border-t border-amber-200/60 pt-2 gap-1.5 flex-wrap select-none">
              <Group gap={6}>
                {/* Sticky Note Creator */}
                <button
                  onClick={handleAddSticky}
                  className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 border-2 border-black text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[2px_2px_0_black] active:translate-y-0.5 active:shadow-none transition-all"
                  title="Insert sticky note on current page"
                >
                  <StickyIcon size={11} strokeWidth={2.5} />
                  + Sticky
                </button>

                {/* Image sticker insertor */}
                <button
                  onClick={triggerImageUpload}
                  className="px-2 py-1 bg-cyan-100 hover:bg-cyan-200 border-2 border-black text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[2px_2px_0_black] active:translate-y-0.5 active:shadow-none transition-all"
                  title="Upload picture sticker on current page"
                >
                  <ImageIcon size={11} strokeWidth={2.5} />
                  + Photo
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageFile} 
                  accept="image/*" 
                  className="hidden" 
                />
              </Group>

              {/* Central canvas tools */}
              <Group gap={4}>
                {/* Undo Sketch */}
                <Tooltip label="Undo last drawing stroke" position="bottom">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={handleUndoSketch}
                    className="border-2 border-black bg-white hover:bg-gray-100 text-black rounded-none shadow-[2px_2px_0_black] active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <RotateCcw size={11} strokeWidth={2.5} />
                  </ActionIcon>
                </Tooltip>

                {/* Export PNG */}
                <Tooltip label="Export active notebook page as PNG picture" position="bottom">
                  <ActionIcon
                    variant="subtle"
                    color="cyan"
                    onClick={handleExportPNG}
                    className="border-2 border-black bg-white hover:bg-cyan-100 text-black rounded-none shadow-[2px_2px_0_black] active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Download size={11} strokeWidth={2.5} />
                  </ActionIcon>
                </Tooltip>

                {/* Tear/Erase page contents */}
                <Tooltip label="Erase active page content entirely" position="bottom">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={handleClearPage}
                    className="border-2 border-black bg-white hover:bg-red-100 text-red-600 rounded-none shadow-[2px_2px_0_black] active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    <Trash2 size={11} strokeWidth={2.5} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </div>
          </div>

          {/* Scrollable Container with multi-page notebook stack */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto flex flex-col gap-0 scroll-smooth no-scrollbar select-none p-0"
            style={{ 
              backgroundColor: '#fcfbe3', // Blends perfectly with notebook paper color
              backgroundImage: 'none',
            }}
          >
            {isLoading ? (
              <Box className="flex-1 flex flex-col items-center justify-center p-8 bg-orange-50/90 rounded border-2 border-black max-w-sm mx-auto my-12 shadow-md">
                <Loader color="orange" size="lg" />
                <Text className="text-[10px] font-black uppercase tracking-widest text-orange-950 mt-4">
                  Opening Student Notebook...
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
                    />
                  </div>
                ))}

                {/* Add Page layout footer button */}
                <div className="py-8 flex flex-col items-center justify-center bg-[#fcfbe3] border-t border-black/10">
                  <button
                    onClick={addPage}
                    className="px-6 py-2 bg-amber-100 hover:bg-amber-200 border-2 border-black rounded-none text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[4px_4px_0_black] active:translate-y-0.5 active:shadow-none transition-all text-orange-950"
                  >
                    <Plus size={14} strokeWidth={3} />
                    Add New Page
                  </button>
                  <Text className="text-[10px] font-black text-orange-950/60 uppercase tracking-widest mt-3">
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
