import React, { useEffect, useRef, useState } from 'react';
import { Box, Center, Text, Loader } from '@mantine/core';

interface PdfThumbnailProps {
  pdfDocument: any;
  pageNumber: number;
  totalPages?: number;
  isActive: boolean;
  isRead?: boolean;
  onClick: () => void;
}

export const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  pdfDocument,
  pageNumber,
  isActive,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: '300px' } // Pre-load pages just before they scroll into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const renderThumbnail = async () => {
      if (!isVisible || !pdfDocument) return;

      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (!isMounted) return;

        const originalViewport = page.getViewport({ scale: 1.0 });
        const targetWidth = 160; // Crisp, scan-able thumbnail width
        const scale = targetWidth / originalViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const transform = outputScale !== 1 
          ? [outputScale, 0, 0, outputScale, 0, 0] 
          : null;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;

        if (isMounted) {
          setIsRendered(true);
        }
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') return;
        console.error('Error rendering thumbnail:', err);
        if (isMounted) {
          setError('!');
        }
      }
    };

    renderThumbnail();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDocument, pageNumber, isVisible]);

  return (
    <Box
      ref={containerRef}
      onClick={onClick}
      data-active={isActive ? 'true' : undefined}
      className={`group flex flex-col items-center p-2.5 cursor-pointer transition-all border-2 select-none w-full ${
        isActive
          ? 'bg-cyan-400 border-black shadow-[4px_4px_0_black] -translate-y-0.5'
          : 'bg-white dark:bg-stone-900 border-black/20 hover:border-black hover:shadow-[3px_3px_0_black]'
      }`}
      style={{ borderRadius: '0px' }}
    >
      <Box
        className="relative bg-white shadow-sm border-2 border-black overflow-hidden flex items-center justify-center bg-stone-100 w-full aspect-[3/4]"
      >
        {!isRendered && !error && (
          <Center className="absolute inset-0">
            <Loader size="xs" color="gray" />
          </Center>
        )}
        {error && (
          <Center className="absolute inset-0 text-red-500 font-mono text-[10px]">
            {error}
          </Center>
        )}
        <canvas
          ref={canvasRef}
          className={`block max-w-full max-h-full object-contain transition-opacity duration-300 ${
            isRendered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </Box>

      <Text className={`text-[11px] font-black uppercase tracking-wider text-center mt-2.5 ${isActive ? 'text-black' : 'text-[var(--text-color)]'}`}>
        Page {pageNumber}
      </Text>
    </Box>
  );
};
