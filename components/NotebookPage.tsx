import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Group, Text, ActionIcon, Tooltip, Portal } from '@mantine/core';
import { Trash2, X, Palette, GripHorizontal, Bold, Italic, Underline, Strikethrough, Highlighter } from 'lucide-react';
import type { DrawingPath, StickyNote, ImageSticker, NotebookPageData, Theme } from '../types';

interface NotebookPageProps {
  pageData: NotebookPageData;
  pageNumber: number;
  activeTool: 'type' | 'draw' | 'highlight' | 'eraser';
  activeColor: string;
  activeWidth: number;
  onChange: (updated: NotebookPageData) => void;
  onDelete?: () => void;
  isActive?: boolean;
  isMobile?: boolean;
  theme?: Theme;
  fontFamily?: string;
}

interface NotebookTextSelectionPopupProps {
  rect: DOMRect;
  onAction: (cmd: string, val?: string) => void;
  activeTool?: string;
}

const NotebookTextSelectionPopup: React.FC<NotebookTextSelectionPopupProps> = ({ rect, onAction, activeTool }) => {
  const [showHighlightPalette, setShowHighlightPalette] = useState(activeTool === 'highlight');

  const positionStyle = useMemo(() => {
    const barWidth = 270;
    const barHeight = 44;
    
    // Position above selection with a small offset
    let top = rect.top - barHeight - 12;
    let left = rect.left + (rect.width / 2) - (barWidth / 2);
 
    // If too close to top of screen, show below selection
    if (top < 80) {
      top = rect.bottom + 12;
    }
 
    // Keep within horizontal bounds
    left = Math.max(16, Math.min(window.innerWidth - barWidth - 16, left));
    
    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${barWidth}px`,
    };
  }, [rect]);

  const HIGHLIGHT_OPTS = [
    { color: 'rgba(253, 224, 71, 0.45)', name: 'Sunny Yellow' },
    { color: 'rgba(244, 114, 182, 0.45)', name: 'Blossom Pink' },
    { color: 'rgba(74, 222, 128, 0.45)', name: 'Mint Green' },
    { color: 'rgba(191, 219, 254, 0.45)', name: 'Sky Blue' },
    { color: 'transparent', name: 'No Color' },
  ];

  const SIZES = [
    { label: 'S', val: '2', title: 'Small' },
    { label: 'M', val: '3', title: 'Medium' },
    { label: 'L', val: '4', title: 'Large' },
    { label: 'XL', val: '5', title: 'Extra Large' },
  ];

  return (
    <div
      style={positionStyle}
      className="fixed z-[1300] flex flex-col bg-white text-slate-800 rounded-md shadow-[0_12px_30px_rgba(0,0,0,0.12)] border border-slate-200/90 p-1.5 select-none animate-pop-in"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="flex items-center justify-between gap-1.5">
        {/* Formatting actions pill */}
        <div className="flex items-center gap-0.5 bg-slate-100/80 border border-slate-200/50 rounded-md p-0.5">
          <button
            onClick={() => onAction('bold')}
            className="p-1.5 hover:bg-white hover:shadow-xs rounded transition-all text-slate-700 hover:text-slate-900 active:scale-95"
            title="Bold text"
          >
            <Bold size={13} strokeWidth={3} />
          </button>
          <button
            onClick={() => onAction('italic')}
            className="p-1.5 hover:bg-white hover:shadow-xs rounded transition-all text-slate-700 hover:text-slate-900 active:scale-95"
            title="Italic text"
          >
            <Italic size={13} strokeWidth={3} />
          </button>
          <button
            onClick={() => onAction('underline')}
            className="p-1.5 hover:bg-white hover:shadow-xs rounded transition-all text-slate-700 hover:text-slate-900 active:scale-95"
            title="Underline text"
          >
            <Underline size={13} strokeWidth={3} />
          </button>
          <button
            onClick={() => onAction('strikethrough')}
            className="p-1.5 hover:bg-white hover:shadow-xs rounded transition-all text-slate-700 hover:text-slate-900 active:scale-95"
            title="Strikethrough"
          >
            <Strikethrough size={13} strokeWidth={3} />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-slate-200" />

        {/* Font Sizes pill */}
        <div className="flex items-center gap-0.5 bg-slate-100/80 border border-slate-200/50 rounded-md p-0.5">
          {SIZES.map((sz) => (
            <button
              key={sz.val}
              onClick={() => onAction('fontSize', sz.val)}
              className="w-6 h-6 flex items-center justify-center text-[10px] font-black hover:bg-white hover:shadow-xs rounded transition-all text-slate-700 hover:text-slate-900 active:scale-95"
              title={sz.title}
            >
              {sz.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const STICKY_COLORS = [
  { name: 'yellow', bg: '#fef08a', border: '#eab308', text: '#713f12' },
  { name: 'pink', bg: '#fbcfe8', border: '#ec4899', text: '#831843' },
  { name: 'blue', bg: '#bfdbfe', border: '#3b82f6', text: '#1e3a8a' },
  { name: 'green', bg: '#bbf7d0', border: '#22c55e', text: '#064e3b' },
];

export const NotebookPage: React.FC<NotebookPageProps> = ({
  pageData,
  pageNumber,
  activeTool,
  activeColor,
  activeWidth,
  onChange,
  onDelete,
  isActive = false,
  isMobile = false,
  theme,
  fontFamily = 'serif',
}) => {
  const isDarkTheme = theme?.id === 'nocturne' || (theme?.colors?.background && (theme.colors.background === '#0a0a0b' || theme.colors.background.startsWith('#1') || theme.colors.background.startsWith('#0')));
  const pageBgColor = theme?.colors?.background || '#fcfbe3';
  const pageTextColor = theme?.colors?.['primary-text'] || (isDarkTheme ? '#f8fafc' : '#1e293b');
  const lineGradient = isDarkTheme 
    ? 'rgba(255, 255, 255, 0.35)' 
    : 'rgba(96, 165, 250, 0.70)';
  const marginLineColor = isDarkTheme ? 'rgba(239, 68, 68, 0.6)' : '#ff8080';
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageContentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);

  const handleSelectionChange = useCallback(() => {
    // Hide popup selection menu on mobile or when highlighting
    if (isMobile || activeTool === 'highlight') {
      setSelectionRect(null);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) {
      setSelectionRect(null);
      return;
    }

    // Ensure selection is inside this page's editor
    if (!editorRef.current.contains(selection.anchorNode)) {
      setSelectionRect(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setSelectionRect(null);
    } else {
      setSelectionRect(rect);
    }
  }, [isMobile, activeTool]);

  const lastRangeRef = useRef<Range | null>(null);
  const lastSyncedTextRef = useRef<string>('');
  const lastSyncedPageIdRef = useRef<string>('');

  useEffect(() => {
    if (!isActive) {
      setSelectionRect(null);
      return;
    }
    const onSelectionChange = () => {
      handleSelectionChange();

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current) {
        const range = sel.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          lastRangeRef.current = range.cloneRange();
        }
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [isActive, handleSelectionChange]);

  const handleSelectionAction = (cmd: string, val?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();

    if (cmd === 'bold') {
      document.execCommand('bold');
    } else if (cmd === 'italic') {
      document.execCommand('italic');
    } else if (cmd === 'underline') {
      document.execCommand('underline');
    } else if (cmd === 'strikethrough') {
      document.execCommand('strikeThrough');
    } else if (cmd === 'fontSize') {
      document.execCommand('fontSize', false, val || '3');
    } else if (cmd === 'backColor') {
      document.execCommand('backColor', false, val || 'transparent');
    }

    const newText = editorRef.current.innerHTML;
    lastSyncedTextRef.current = newText;
    onChange({
      ...pageData,
      text: newText,
    });

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelectionRect(null);
  };

  // Listen for custom add-notebook-sticker events (to insert at caret/cursor position)
  useEffect(() => {
    if (!isActive) return;

    const handleAddStickerEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ url: string }>;
      const url = customEvent.detail?.url;
      if (!url) return;

      if (!editorRef.current) return;

      let range: Range | null = null;
      const selection = window.getSelection();

      // Prioritize last saved range inside this editor
      if (lastRangeRef.current && editorRef.current.contains(lastRangeRef.current.commonAncestorContainer)) {
        range = lastRangeRef.current.cloneRange();
      } else if (selection && selection.rangeCount > 0) {
        const selRange = selection.getRangeAt(0);
        if (editorRef.current.contains(selRange.commonAncestorContainer)) {
          range = selRange;
        }
      }

      if (range) {
        editorRef.current.focus();
        
        // Re-get selection and range after focus
        const selection = window.getSelection();
        const freshRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : range;

        const wrapper = document.createElement('div');
        wrapper.className = 'notebook-embedded-image-wrapper';
        wrapper.contentEditable = 'false';
        wrapper.style.float = 'right';
        wrapper.style.width = '45%';
        wrapper.style.margin = '8px 0 8px 16px';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.userSelect = 'none';
        wrapper.dataset.url = url;
        wrapper.dataset.align = 'right';
        wrapper.dataset.width = '45';

        // Completely minified to eliminate whitespace text-node generation by the browser
        wrapper.innerHTML = `<div class="relative border-2 border-black bg-white p-1 shadow-[4px_4px_0_black] group"><img src="${url}" class="w-full h-auto select-none pointer-events-none block" style="display:block !important;height:auto !important;margin:0 !important;" /><div class="absolute top-1 right-1 flex gap-1 bg-black/85 p-0.5 rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-50"><button class="p-0.5 text-white hover:text-orange-300 align-left-btn" title="Align Left"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 6h16M4 12h10M4 18h14"/></svg></button><button class="p-0.5 text-white hover:text-orange-300 align-center-btn" title="Align Center"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 6h16M8 12h8M6 18h12"/></svg></button><button class="p-0.5 text-white hover:text-orange-300 align-right-btn" title="Align Right"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 6h16M10 12h10M6 18h14"/></svg></button><button class="p-0.5 text-red-400 hover:text-red-300 delete-img-btn" title="Delete"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div><button class="absolute bottom-0 left-0 w-3.5 h-3.5 bg-orange-500 border border-black flex items-center justify-center opacity-0 group-hover:opacity-100 z-50 resize-smaller-btn" title="Make Smaller"><span class="text-white text-[9px] font-bold leading-none">-</span></button><button class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-orange-500 border border-black flex items-center justify-center opacity-0 group-hover:opacity-100 z-50 resize-larger-btn" title="Make Larger"><span class="text-white text-[9px] font-bold leading-none">+</span></button></div>`;

        freshRange.deleteContents();
        freshRange.insertNode(wrapper);

        // Move cursor after the wrapper
        freshRange.setStartAfter(wrapper);
        freshRange.setEndAfter(wrapper);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(freshRange);
        }

        // Update lastRangeRef
        lastRangeRef.current = freshRange.cloneRange();

        const newText = editorRef.current.innerHTML;
        lastSyncedTextRef.current = newText;
        onChange({
          ...pageData,
          text: newText,
        });
        return;
      }

      // Fallback: append at the end of the text editor
      let currentHTML = editorRef.current.innerHTML || "";
      if (currentHTML === "<br>") currentHTML = "";

      const wrapper = document.createElement('div');
      wrapper.className = 'notebook-embedded-image-wrapper';
      wrapper.contentEditable = 'false';
      wrapper.style.float = 'right';
      wrapper.style.width = '45%';
      wrapper.style.margin = '8px 0 8px 16px';
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      wrapper.style.userSelect = 'none';
      wrapper.dataset.url = url;
      wrapper.dataset.align = 'right';
      wrapper.dataset.width = '45';

      // Completely minified to eliminate whitespace text-node generation by the browser
      wrapper.innerHTML = `<div class="relative border-2 border-black bg-white p-1 shadow-[4px_4px_0_black] group"><img src="${url}" class="w-full h-auto select-none pointer-events-none block" style="display:block !important;height:auto !important;margin:0 !important;" /><div class="absolute top-1 right-1 flex gap-1 bg-black/85 p-0.5 rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-50"><button class="p-0.5 text-white hover:text-orange-300 align-left-btn" title="Align Left"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 6h16M4 12h10M4 18h14"/></svg></button><button class="p-0.5 text-white hover:text-orange-300 align-center-btn" title="Align Center"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 6h16M8 12h8M6 18h12"/></svg></button><button class="p-0.5 text-white hover:text-orange-300 align-right-btn" title="Align Right"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M4 6h16M10 12h10M6 18h14"/></svg></button><button class="p-0.5 text-red-400 hover:text-red-300 delete-img-btn" title="Delete"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div><button class="absolute bottom-0 left-0 w-3.5 h-3.5 bg-orange-500 border border-black flex items-center justify-center opacity-0 group-hover:opacity-100 z-50 resize-smaller-btn" title="Make Smaller"><span class="text-white text-[9px] font-bold leading-none">-</span></button><button class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-orange-500 border border-black flex items-center justify-center opacity-0 group-hover:opacity-100 z-50 resize-larger-btn" title="Make Larger"><span class="text-white text-[9px] font-bold leading-none">+</span></button></div>`;

      editorRef.current.appendChild(wrapper);
      const newText = editorRef.current.innerHTML;
      lastSyncedTextRef.current = newText;
      onChange({
        ...pageData,
        text: newText,
      });
    };

    window.addEventListener('add-notebook-sticker', handleAddStickerEvent);
    return () => {
      window.removeEventListener('add-notebook-sticker', handleAddStickerEvent);
    };
  }, [isActive, pageData, onChange]);

  // Sync contentEditable innerHTML with state text (which holds HTML formatting)
  useEffect(() => {
    if (editorRef.current) {
      const textChanged = pageData.text !== lastSyncedTextRef.current;
      const pageChanged = pageData.id !== lastSyncedPageIdRef.current;

      if (pageChanged || (textChanged && document.activeElement !== editorRef.current)) {
        editorRef.current.innerHTML = pageData.text;
        lastSyncedTextRef.current = pageData.text;
        lastSyncedPageIdRef.current = pageData.id;
      }
    }
  }, [pageData.text, pageData.id]);

    // Set typing color dynamically when activeColor changes ONLY if user has a text selection
  useEffect(() => {
    if (!isActive || activeTool !== 'type' || !editorRef.current) return;
    
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && editorRef.current.contains(sel.anchorNode)) {
      document.execCommand('foreColor', false, activeColor);
    }
  }, [activeColor, isActive, activeTool]);

  // Drag states for sticky notes & stickers
  const isDraggingRef = useRef<boolean>(false);
  const activeDragIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Render/Draw Paths on Canvas
  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    const drawPath = (path: DrawingPath) => {
      if (path.points.length === 0) return;
      ctx.beginPath();
      
      let strokeColor = path.color;
      if (isDarkTheme && strokeColor !== 'eraser' && !path.isHighlighter) {
        if (['#000000', '#1e293b', '#262626', '#404040', '#000'].includes(strokeColor)) {
          strokeColor = '#f8fafc';
        }
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (path.color === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = path.width * 4; // bigger eraser
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      // Convert normalized ratio points (legacy 0..1) to pixel points if needed
      const getPt = (pt: { x: number; y: number }) => {
        if (pt.x <= 1.0 && pt.y <= 1.0) {
          const refW = w || 800;
          const refH = h || 1200;
          return { x: pt.x * refW, y: pt.y * refH };
        }
        return { x: pt.x, y: pt.y };
      };

      const p0 = getPt(path.points[0]);
      ctx.moveTo(p0.x, p0.y);

      for (let i = 1; i < path.points.length; i++) {
        const p = getPt(path.points[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    };

    pageData.drawings.forEach(drawPath);
    ctx.globalCompositeOperation = 'source-over'; // restore default
  }, [pageData.drawings, isDarkTheme]);

  // Set Canvas Resolution (High DPI / Retina Support) using ResizeObserver on the container
  useEffect(() => {
    const container = pageContentRef.current || containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      drawAll();
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, [drawAll]);

  useEffect(() => {
    drawAll();
  }, [pageData.drawings, drawAll]);

  // Get Relative Canvas Pixel Coordinates
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x: Math.max(0, x), y: Math.max(0, y) };
  };

  // Canvas Drawing Events
  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw' && activeTool !== 'eraser') return; // let text editor click/drag select
    if ((e.target as HTMLElement).closest('.interactive-sticker')) {
      return; // let stickers handle clicks
    }
    
    e.preventDefault();
    const coords = getCanvasCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    
    const newPath: DrawingPath = {
      points: [coords],
      color: activeTool === 'eraser' ? 'eraser' : activeColor,
      width: activeWidth,
      isHighlighter: false
    };

    onChange({
      ...pageData,
      drawings: [...pageData.drawings, newPath],
    });
  };

  const handleDrawMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing || pageData.drawings.length === 0) return;
    e.preventDefault();
    
    const coords = getCanvasCoords(e);
    if (!coords) return;

    const copy = [...pageData.drawings];
    const active = { ...copy[copy.length - 1] };
    active.points = [...active.points, coords];
    copy[copy.length - 1] = active;

    onChange({
      ...pageData,
      drawings: copy,
    });
  }, [isDrawing, pageData, onChange]);

  const handleStopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
  }, [isDrawing]);

  // Global event bindings for smooth drawing
  useEffect(() => {
    if (isDrawing) {
      window.addEventListener('mousemove', handleDrawMove, { passive: false });
      window.addEventListener('mouseup', handleStopDrawing);
      window.addEventListener('touchmove', handleDrawMove, { passive: false });
      window.addEventListener('touchend', handleStopDrawing);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrawMove);
      window.removeEventListener('mouseup', handleStopDrawing);
      window.removeEventListener('touchmove', handleDrawMove);
      window.removeEventListener('touchend', handleStopDrawing);
    };
  }, [isDrawing, handleDrawMove, handleStopDrawing]);

  // Drag and drop of widgets
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string, type: 'sticky' | 'sticker') => {
    e.stopPropagation();
    const container = pageContentRef.current || containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const currentItem = type === 'sticky' 
      ? pageData.stickyNotes.find(n => n.id === id) 
      : pageData.imageStickers.find(s => s.id === id);
      
    if (!currentItem) return;

    const itemPixelX = currentItem.x * rect.width;
    const itemPixelY = currentItem.y * rect.height;

    dragOffsetRef.current = {
      x: (clientX - rect.left) - itemPixelX,
      y: (clientY - rect.top) - itemPixelY
    };

    activeDragIdRef.current = id;
    isDraggingRef.current = true;
  };

  const handleGlobalDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !activeDragIdRef.current) return;
    const container = pageContentRef.current || containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const relativeX = (clientX - rect.left) - dragOffsetRef.current.x;
    const relativeY = (clientY - rect.top) - dragOffsetRef.current.y;

    const ratioX = Math.max(0.02, Math.min(0.98, relativeX / rect.width));
    const ratioY = Math.max(0.02, Math.min(0.98, relativeY / rect.height));

    const id = activeDragIdRef.current;
    if (id.startsWith('sticky_')) {
      const updatedStickies = pageData.stickyNotes.map(n => n.id === id ? { ...n, x: ratioX, y: ratioY } : n);
      onChange({ ...pageData, stickyNotes: updatedStickies });
    } else {
      const updatedStickers = pageData.imageStickers.map(s => s.id === id ? { ...s, x: ratioX, y: ratioY } : s);
      onChange({ ...pageData, imageStickers: updatedStickers });
    }
  }, [pageData, onChange]);

  const handleGlobalDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    activeDragIdRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalDragMove);
    window.addEventListener('mouseup', handleGlobalDragEnd);
    window.addEventListener('touchmove', handleGlobalDragMove);
    window.addEventListener('touchend', handleGlobalDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleGlobalDragMove);
      window.removeEventListener('mouseup', handleGlobalDragEnd);
      window.removeEventListener('touchmove', handleGlobalDragMove);
      window.removeEventListener('touchend', handleGlobalDragEnd);
    };
  }, [handleGlobalDragMove, handleGlobalDragEnd]);

  // Edit / Delete features
  const updateStickyText = (id: string, text: string) => {
    const updated = pageData.stickyNotes.map(n => n.id === id ? { ...n, text } : n);
    onChange({ ...pageData, stickyNotes: updated });
  };

  const deleteSticky = (id: string) => {
    const updated = pageData.stickyNotes.filter(n => n.id !== id);
    onChange({ ...pageData, stickyNotes: updated });
  };

  const cycleStickyColor = (id: string) => {
    const updated = pageData.stickyNotes.map(n => {
      if (n.id === id) {
        const curIdx = STICKY_COLORS.findIndex(c => c.name === n.color);
        const nextColor = STICKY_COLORS[(curIdx + 1) % STICKY_COLORS.length].name as any;
        return { ...n, color: nextColor };
      }
      return n;
    });
    onChange({ ...pageData, stickyNotes: updated });
  };

  const deleteSticker = (id: string) => {
    const updated = (pageData.imageStickers || []).filter(s => s.id !== id);
    onChange({ ...pageData, imageStickers: updated });
  };

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerHTML;
    lastSyncedTextRef.current = newText;
    onChange({
      ...pageData,
      text: newText,
    });
  };

  const handleSelectionHighlight = () => {
    if (activeTool !== 'highlight') return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !editorRef.current) return;

    if (editorRef.current.contains(selection.anchorNode)) {
      if (activeColor === 'transparent') {
        document.execCommand('backColor', false, 'transparent');
      } else {
        document.execCommand('backColor', false, activeColor);
      }
      const newText = editorRef.current.innerHTML;
      lastSyncedTextRef.current = newText;
      onChange({
        ...pageData,
        text: newText,
      });
    }
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Check if we clicked any of the alignment/delete/resize buttons inside the wrapper
    const wrapper = target.closest('.notebook-embedded-image-wrapper') as HTMLDivElement | null;
    if (!wrapper) return;

    // Align Left
    if (target.closest('.align-left-btn')) {
      e.stopPropagation();
      e.preventDefault();
      wrapper.style.float = 'left';
      wrapper.style.margin = '8px 16px 8px 0';
      wrapper.style.display = 'inline-block';
      wrapper.style.clear = 'none';
      wrapper.dataset.align = 'left';
      const newText = editorRef.current?.innerHTML || "";
      lastSyncedTextRef.current = newText;
      onChange({ ...pageData, text: newText });
    }
    // Align Center
    else if (target.closest('.align-center-btn')) {
      e.stopPropagation();
      e.preventDefault();
      wrapper.style.float = 'none';
      wrapper.style.margin = '16px auto';
      wrapper.style.display = 'block';
      wrapper.style.clear = 'both';
      wrapper.dataset.align = 'center';
      const newText = editorRef.current?.innerHTML || "";
      lastSyncedTextRef.current = newText;
      onChange({ ...pageData, text: newText });
    }
    // Align Right
    else if (target.closest('.align-right-btn')) {
      e.stopPropagation();
      e.preventDefault();
      wrapper.style.float = 'right';
      wrapper.style.margin = '8px 0 8px 16px';
      wrapper.style.display = 'inline-block';
      wrapper.style.clear = 'none';
      wrapper.dataset.align = 'right';
      const newText = editorRef.current?.innerHTML || "";
      lastSyncedTextRef.current = newText;
      onChange({ ...pageData, text: newText });
    }
    // Delete
    else if (target.closest('.delete-img-btn')) {
      e.stopPropagation();
      e.preventDefault();
      wrapper.remove();
      const newText = editorRef.current?.innerHTML || "";
      lastSyncedTextRef.current = newText;
      onChange({ ...pageData, text: newText });
    }
    // Resize Smaller
    else if (target.closest('.resize-smaller-btn')) {
      e.stopPropagation();
      e.preventDefault();
      const currentWidth = parseInt(wrapper.dataset.width || '45', 10);
      const newWidth = Math.max(15, currentWidth - 5);
      wrapper.style.width = `${newWidth}%`;
      wrapper.dataset.width = String(newWidth);
      const newText = editorRef.current?.innerHTML || "";
      lastSyncedTextRef.current = newText;
      onChange({ ...pageData, text: newText });
    }
    // Resize Larger
    else if (target.closest('.resize-larger-btn')) {
      e.stopPropagation();
      e.preventDefault();
      const currentWidth = parseInt(wrapper.dataset.width || '45', 10);
      const newWidth = Math.min(95, currentWidth + 5);
      wrapper.style.width = `${newWidth}%`;
      wrapper.dataset.width = String(newWidth);
      const newText = editorRef.current?.innerHTML || "";
      lastSyncedTextRef.current = newText;
      onChange({ ...pageData, text: newText });
    }
  };

  return (
    <div 
      ref={containerRef}
      data-notebook-page-index={pageNumber - 1}
      className="w-full relative flex-shrink-0 border-b border-black/10 transition-colors rounded-none overflow-hidden"
      style={{ 
        height: '1360px',
        backgroundColor: pageBgColor,
      }}
    >
      {/* Page number at bottom left */}
      <div 
        className="absolute bottom-4 left-[48px] text-[12px] font-black select-none z-30 opacity-40 transition-colors"
        style={{ color: pageTextColor }}
      >
        {pageNumber}
      </div>

      {/* Scrollable container holding page content, canvas, and sticky notes */}
      <div 
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto notebook-editor-scroll no-scrollbar z-[15]"
        style={{ scrollbarWidth: 'none' }}
        onClick={(e) => {
          if (activeTool !== 'type' || !editorRef.current) return;
          
          const target = e.target as HTMLElement;
          // Don't override click behavior if clicking on a button, sticker, or image resize wrapper
          if (target.closest('.interactive-sticker') || target.closest('.image-sticker-wrapper') || target.closest('button')) {
            return; 
          }

          // Calculate click coordinates relative to the scrollable editor content
          const container = e.currentTarget;
          const rect = container.getBoundingClientRect();
          // Adjust for scroll position to find absolute y within the page
          const clickY = e.clientY - rect.top + container.scrollTop;
          
          const clickedLine = Math.max(0, Math.floor((clickY - 56) / 28));
          
          // Only pad if they click below the existing text lines
          const currentText = editorRef.current.innerText || "";
          const lines = currentText.split('\n');
          
          if (clickedLine >= 0 && clickedLine >= lines.length) {
            const neededNewlines = clickedLine - lines.length + 1;
            let currentHTML = editorRef.current.innerHTML || "";
            if (currentHTML === "<br>") currentHTML = "";
            const paddedHTML = currentHTML + "<div><br></div>".repeat(neededNewlines);
            
            editorRef.current.innerHTML = paddedHTML;
            // Sync with state
            onChange({ ...pageData, text: paddedHTML });
          }

          // Always focus the editor
          editorRef.current.focus();
          
          // Set caret at the end of the text if they clicked below the existing lines
          if (clickedLine >= lines.length) {
            const range = document.createRange();
            const selection = window.getSelection();
            if (selection) {
              range.selectNodeContents(editorRef.current);
              range.collapse(false); // collapse to end
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }}
      >
        <div 
          ref={pageContentRef}
          className="relative min-h-full w-full pr-4 pl-[48px] pt-0 pb-8 select-text"
        >
          {/* Background paper lines layout */}
          <div 
            className="pointer-events-none notebook-lines" 
            style={{
              ['--line-gradient-color' as any]: lineGradient,
              ['--margin-line-color' as any]: marginLineColor,
            }}
          />

          {/* Render floated image stickers first so text wraps around them */}
          {(pageData.imageStickers || []).map((sticker) => (
            <ImageStickerComponent
              key={sticker.id}
              sticker={sticker}
              activeTool={activeTool}
              onChange={(updatedSticker) => {
                const updated = (pageData.imageStickers || []).map(s => s.id === sticker.id ? updatedSticker : s);
                onChange({ ...pageData, imageStickers: updated });
              }}
              onDelete={() => {
                const updated = (pageData.imageStickers || []).filter(s => s.id !== sticker.id);
                onChange({ ...pageData, imageStickers: updated });
              }}
            />
          ))}

          {/* contentEditable text block */}
          <div
            ref={editorRef}
            contentEditable={activeTool === 'type' || activeTool === 'highlight'}
            onInput={handleTextChange}
            onMouseUp={() => {
              handleSelectionHighlight();
              handleSelectionChange();
            }}
            onKeyUp={() => {
              handleSelectionHighlight();
              handleSelectionChange();
            }}
            onClick={handleEditorClick}
            onKeyDown={(e) => {
              if (activeTool === 'type' && activeColor && activeColor !== 'eraser') {
                const sel = window.getSelection();
                if (sel && sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
                  document.execCommand('foreColor', false, activeColor);
                }
              }
            }}
            onFocus={() => {
              const sel = window.getSelection();
              if (sel && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode)) {
                if (activeTool === 'type' && activeColor && activeColor !== 'eraser') {
                  document.execCommand('foreColor', false, activeColor);
                }
              }
            }}
            data-placeholder=""
            className={`outline-none font-bold text-[14px] leading-[28px] select-text min-h-[1200px] w-full break-words notebook-editor ${isDarkTheme ? 'notebook-editor-dark' : ''} relative z-10`}
            style={{
              color: pageTextColor,
              fontFamily: fontFamily === 'hand' ? 'var(--font-hand), cursive' : fontFamily === 'serif' ? 'var(--font-serif), serif' : fontFamily === 'sans' ? 'var(--font-sans), sans-serif' : fontFamily === 'mono' ? 'ui-monospace, monospace' : fontFamily === 'display' ? 'var(--font-display), serif' : 'var(--font-serif), serif',
              caretColor: activeTool === 'type' ? (activeColor || pageTextColor) : pageTextColor,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              pointerEvents: (activeTool === 'type' || activeTool === 'highlight') ? 'auto' : 'none',
            }}
          />

          {/* Drawing Sketch Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleStartDrawing}
            onTouchStart={handleStartDrawing}
            className="absolute inset-0 w-full h-full touch-none"
            style={{
              zIndex: (activeTool === 'draw' || activeTool === 'eraser') ? 25 : 15,
              pointerEvents: (activeTool === 'draw' || activeTool === 'eraser') ? 'auto' : 'none',
              cursor: activeTool === 'eraser' ? 'cell' : 'crosshair'
            }}
          />

          {/* Sticky Notes Layer */}
          {pageData.stickyNotes.map((sticky) => {
            const colorMeta = STICKY_COLORS.find(c => c.name === sticky.color) || STICKY_COLORS[0];
            return (
              <div
                key={sticky.id}
                className="absolute z-30 group interactive-sticker"
                style={{
                  left: `${sticky.x * 100}%`,
                  top: `${sticky.y * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${sticky.rotation}deg)`,
                  width: '135px',
                }}
              >
                <div 
                  className="border-2 border-black p-2 shadow-[4px_4px_0_black] flex flex-col h-28 relative text-left"
                  style={{ backgroundColor: colorMeta.bg }}
                >
                  {/* Drag Handle Top Bar */}
                  <div 
                    onMouseDown={(e) => handleDragStart(e, sticky.id, 'sticky')}
                    onTouchStart={(e) => handleDragStart(e, sticky.id, 'sticky')}
                    className="h-3.5 absolute top-0 left-0 right-0 cursor-move border-b border-black/10 flex items-center justify-center"
                    style={{ backgroundColor: colorMeta.border }}
                    title="Drag to move sticky"
                  >
                    <GripHorizontal size={10} className="text-black/30" />
                  </div>

                  {/* Editable note content */}
                  <textarea
                    value={sticky.text}
                    onChange={(e) => updateStickyText(sticky.id, e.target.value)}
                    placeholder="Write inside sticky note..."
                    className="w-full flex-1 bg-transparent border-0 resize-none outline-none font-sans font-bold text-[11px] leading-relaxed pt-2.5 focus:ring-0"
                    style={{ color: colorMeta.text }}
                  />

                  {/* Inline action selectors */}
                  <div className="absolute bottom-1 right-1 flex gap-1 bg-white/80 border border-black/10 rounded-sm p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => cycleStickyColor(sticky.id)}
                      className="w-3.5 h-3.5 rounded-full border border-black bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                      title="Cycle color"
                    >
                      <Palette size={8} className="text-black" />
                    </button>
                    <button
                      onClick={() => deleteSticky(sticky.id)}
                      className="w-3.5 h-3.5 rounded-full border border-black bg-red-400 flex items-center justify-center hover:bg-red-500 hover:scale-105 active:scale-95 transition-all"
                      title="Delete sticky"
                    >
                      <X size={8} strokeWidth={3} className="text-black" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectionRect && (
        <Portal>
          <NotebookTextSelectionPopup
            rect={selectionRect}
            onAction={handleSelectionAction}
            activeTool={activeTool}
          />
        </Portal>
      )}

      <style>{`
        .notebook-editor-scroll::-webkit-scrollbar {
          display: none;
        }
        .notebook-editor:empty::before {
          content: attr(data-placeholder);
          color: #a3a3a3;
          font-style: italic;
          font-weight: 500;
          font-size: 14px;
          font-weight: bold;
        }
        .notebook-editor div, .notebook-editor p {
          margin: 0;
          padding: 0;
          line-height: 28px !important;
          min-height: 28px;
        }
        .notebook-editor img, .notebook-embedded-image-wrapper img {
          display: block !important;
          max-width: 100% !important;
          height: auto !important;
          margin: 0 !important;
        }
        /* Override line-height and min-height inherited by children div and button tags inside embedded wrappers */
        .notebook-editor .notebook-embedded-image-wrapper div,
        .notebook-editor .notebook-embedded-image-wrapper button {
          min-height: 0 !important;
          line-height: 1 !important;
        }
      `}</style>
    </div>
  );
};

interface ImageStickerComponentProps {
  sticker: ImageSticker;
  activeTool: string;
  onChange: (updated: ImageSticker) => void;
  onDelete: () => void;
}

const ImageStickerComponent: React.FC<ImageStickerComponentProps> = ({
  sticker,
  activeTool,
  onChange,
  onDelete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const align = sticker.align || 'right';

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    startWidthRef.current = sticker.width || 0.45;
  };

  const handleResizeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const parent = containerRef.current.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const parentWidth = parentRect.width;

    const deltaX = clientX - startXRef.current;
    const changeFactor = deltaX / parentWidth;
    
    let newWidth = startWidthRef.current;
    if (align === 'right') {
      newWidth = startWidthRef.current - changeFactor;
    } else {
      newWidth = startWidthRef.current + changeFactor;
    }

    const clampedWidth = Math.max(0.15, Math.min(0.95, newWidth));
    onChange({
      ...sticker,
      width: clampedWidth,
    });
  }, [isResizing, align, sticker, onChange]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResizeMove, { passive: false });
      window.addEventListener('touchend', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove);
      window.removeEventListener('touchend', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  let alignClass = 'float-right ml-4 mb-4';
  if (align === 'left') {
    alignClass = 'float-left mr-4 mb-4';
  } else if (align === 'center') {
    alignClass = 'mx-auto block my-4 clear-both';
  }

  return (
    <div
      ref={containerRef}
      className={`${alignClass} relative group select-none`}
      style={{
        width: `${(sticker.width || 0.45) * 100}%`,
        maxWidth: '100%',
        pointerEvents: 'auto',
      }}
    >
      <div className="border-2 border-black bg-white p-1 shadow-[4px_4px_0px_rgba(0,0,0,0.25)] relative transition-all group-hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)]">
        <img
          src={sticker.url}
          alt="Notebook sticker"
          className="w-full h-auto select-none pointer-events-none"
        />

        {/* Hover alignment & deletion overlays */}
        <div className="absolute top-1.5 right-1.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 backdrop-blur-xs p-1 rounded-sm border border-white/20 z-50">
          <button
            onClick={() => onChange({ ...sticker, align: 'left' })}
            className={`p-1 text-white hover:text-orange-300 transition-colors ${align === 'left' ? 'bg-orange-500 rounded-xs' : ''}`}
            title="Align Left"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 6h16M4 12h10M4 18h14"/></svg>
          </button>

          <button
            onClick={() => onChange({ ...sticker, align: 'center' })}
            className={`p-1 text-white hover:text-orange-300 transition-colors ${align === 'center' ? 'bg-orange-500 rounded-xs' : ''}`}
            title="Align Center"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 6h16M8 12h8M6 18h12"/></svg>
          </button>

          <button
            onClick={() => onChange({ ...sticker, align: 'right' })}
            className={`p-1 text-white hover:text-orange-300 transition-colors ${align === 'right' ? 'bg-orange-500 rounded-xs' : ''}`}
            title="Align Right"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 6h16M10 12h10M6 18h14"/></svg>
          </button>

          <div className="w-[1px] h-3.5 bg-white/30 my-auto" />

          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Delete photo"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Grab-to-Resize handle overlay on the active floating edge */}
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          className={`absolute bottom-0 w-4 h-4 bg-orange-500 hover:bg-orange-600 border border-black shadow-[1px_1px_0_black] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-50 ${
            align === 'right' ? 'left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize' : 'right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize'
          }`}
          title="Drag to resize image sticker"
        >
          <svg width="6" height="6" viewBox="0 0 100 100" className="text-white fill-white"><polygon points="0,100 100,0 100,100"/></svg>
        </div>
      </div>
    </div>
  );
};
