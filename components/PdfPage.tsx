
import React, { useEffect, useRef, useState } from 'react';
import { Box, Loader, Center } from '@mantine/core';

declare const pdfjsLib: any;

interface PdfPageProps {
  pdfDocument: any;
  pageNumber: number;
  scale?: number;
}

const PdfPage: React.FC<PdfPageProps> = ({ pdfDocument, pageNumber, scale = 1.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: '1000px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!isVisible) return;

      const pdfjs = (window as any).pdfjsLib;
      if (!pdfDocument || !pdfjs) {
        if (!pdfjs && isMounted) {
          setTimeout(renderPage, 500);
        }
        return;
      }
      
      setError(null);

      try {
        const page = await pdfDocument.getPage(pageNumber);
        
        if (!isMounted) return;

        const outputScale = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        // Set canvas dimensions accounting for device pixel ratio for high quality
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

        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = '';
          textLayerRef.current.style.width = `${viewport.width}px`;
          textLayerRef.current.style.height = `${viewport.height}px`;
          
          try {
            const textContent = await page.getTextContent({
              includeMarkedContent: true,
              disableCombineTextItems: false
            });
            const textLayerTask = pdfjs.renderTextLayer({
              textContent: textContent,
              container: textLayerRef.current,
              viewport: viewport,
              textDivs: []
            });
            await textLayerTask.promise;
          } catch (textErr) {
            console.warn('Text layer rendering failed:', textErr);
          }
        }
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') return;
        console.error('Error rendering PDF page:', err);
        if (isMounted) {
          setError('Failed to render page');
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDocument, pageNumber, scale, isVisible]);

  return (
    <Box 
      ref={containerRef}
      className="relative mx-auto shadow-2xl border border-black/10 bg-white" 
      style={{ 
        width: 'fit-content',
        minHeight: isVisible ? 'auto' : `${800 * scale}px`,
        minWidth: '300px'
      }}
    >
      {error && (
        <Center className="absolute inset-0 z-10 bg-red-50 text-red-500 font-bold">
          {error}
        </Center>
      )}
      <canvas ref={canvasRef} className="block h-auto" />
      <div 
        ref={textLayerRef} 
        className="textLayer absolute inset-0 pointer-events-auto" 
      />
    </Box>
  );
};

export default PdfPage;
