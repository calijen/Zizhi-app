
import type { Book, Chapter } from './types';

declare const pdfjsLib: any;

export const parsePdf = async (file: File): Promise<Book> => {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF library is not ready.');
    }

    // Set worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const chapters: Chapter[] = [];
    const numPages = pdf.numPages;

    // Get metadata
    const metadata = await pdf.getMetadata();
    const title = metadata.info?.Title || file.name.replace(/\.pdf$/i, '') || 'Untitled PDF';
    const author = metadata.info?.Author || 'Unknown Author';

    // Create skeleton chapters for each page
    for (let i = 1; i <= numPages; i++) {
        chapters.push({
            id: `page-${i}`,
            href: `page-${i}`,
            label: `Page ${i}`,
            html: '', // Will be rendered on demand
            textContent: '' // Will be extracted on demand if needed
        });
    }

    // Get cover from first page (fast)
    let coverImageUrl = null;
    try {
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await firstPage.render({ canvasContext: context, viewport }).promise;
        coverImageUrl = canvas.toDataURL('image/jpeg', 0.6);
    } catch (e) {
        console.error("Failed to extract PDF cover", e);
    }

    return {
        id: crypto.randomUUID(),
        title,
        author,
        coverImageUrl,
        chapters,
        toc: chapters.map(c => ({ id: c.id, href: c.href, label: c.label })),
        progress: 0,
        lastScrollTop: 0,
        readingTime: 0,
        lastOpened: Date.now(),
        genre: 'PDF Document',
        isPdf: true,
        pdfData: arrayBuffer
    };
};
