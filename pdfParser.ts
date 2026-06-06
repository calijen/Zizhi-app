
import type { Book, Chapter } from './types';

declare const pdfjsLib: any;

export const parsePdf = async (file: File): Promise<Book> => {
    const pdfjs = (window as any).pdfjsLib;
    if (!pdfjs) {
        throw new Error('PDF library is not ready.');
    }

    // Set worker
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    
    // Use a single Uint8Array for the whole process
    const pdfData = new Uint8Array(arrayBuffer);
    
    // Pass a copy to getDocument to prevent detaching the original buffer
    // which we need to save to IndexedDB later.
    // On mobile, we use slice() which is memory intensive but safe.
    const pdf = await pdfjs.getDocument({ 
        data: pdfData.slice(0),
        // Disable some features to save memory on mobile
        disableAutoFetch: true,
        disableStream: true
    }).promise;
    
    const chapters: Chapter[] = [];
    const numPages = pdf.numPages;

    // Get metadata safely
    let title = file.name.replace(/\.pdf$/i, '') || 'Untitled PDF';
    let author = 'Unknown Author';

    try {
        const meta = await pdf.getMetadata();
        if (meta && meta.info) {
            title = meta.info.Title || title;
            author = meta.info.Author || author;
        }
    } catch (e) {
        console.error("Failed to extract PDF metadata", e);
    }

    // Create skeleton chapters for each page
    for (let i = 1; i <= numPages; i++) {
        chapters.push({
            id: `page-${i}`,
            href: `page-${i}`,
            label: `Page ${i}`,
            html: '', 
            textContent: '' 
        });
    }

    // Get cover from first page (fast)
    let coverImageUrl = null;
    try {
        const firstPage = await pdf.getPage(1);
        const originalViewport = firstPage.getViewport({ scale: 1.0 });
        
        // Limit cover dimensions to prevent massive base64 strings
        const maxCoverDim = 600;
        const scale = Math.min(maxCoverDim / originalViewport.width, maxCoverDim / originalViewport.height, 1.0);
        const viewport = firstPage.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await firstPage.render({ canvasContext: context, viewport }).promise;
            coverImageUrl = canvas.toDataURL('image/jpeg', 0.7);
        }
    } catch (e) {
        console.error("Failed to extract PDF cover", e);
    }

    const guessGenre = (title: string): string => {
        const t = title.toLowerCase();
        if (t.includes('philosoph') || t.includes('ethics') || t.includes('metaphysic') || t.includes('plato') || t.includes('aristotle') || t.includes('nietzsch') || t.includes('kant') || t.includes('socrates') || t.includes('stoic') || t.includes('marcus aurelius') || t.includes('epictetus') || t.includes('seneca')) return 'Philosophy';
        if (t.includes('history') || t.includes('empire') || t.includes('war') || t.includes('ancient') || t.includes('world') || t.includes('roman') || t.includes('gree') || t.includes('dynasty') || t.includes('revolution')) return 'History';
        if (t.includes('science') || t.includes('physic') || t.includes('cosmology') || t.includes('quantum') || t.includes('biolog') || t.includes('evolut') || t.includes('math') || t.includes('astronomy') || t.includes('chemistry')) return 'Science';
        if (t.includes('novel') || t.includes('fiction') || t.includes('tale') || t.includes('story') || t.includes('poetry') || t.includes('poem') || t.includes('drama') || t.includes('play')) return 'Literature';
        if (t.includes('politic') || t.includes('state') || t.includes('republic') || t.includes('democrat') || t.includes('governm') || t.includes('sovereign')) return 'Political Science';
        if (t.includes('psycholog') || t.includes('mind') || t.includes('brain') || t.includes('cognit') || t.includes('behavior')) return 'Psychology';
        if (t.includes('sociolog') || t.includes('society') || t.includes('culture') || t.includes('anthropolog')) return 'Sociology';
        if (t.includes('econom') || t.includes('wealth') || t.includes('market') || t.includes('finance') || t.includes('capital')) return 'Economics';
        return '';
    };

    return {
        id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        title,
        author,
        coverImageUrl,
        chapters,
        toc: chapters.map(c => ({ id: c.id, href: c.href, label: c.label })),
        progress: 0,
        lastScrollTop: 0,
        readingTime: 0,
        lastOpened: Date.now(),
        genre: guessGenre(title) || 'PDF Document',
        isPdf: true,
        pdfData: pdfData
    };
};
