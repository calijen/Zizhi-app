
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
    // Create a copy for PDF.js to prevent it from detaching the buffer we want to save
    const pdfData = new Uint8Array(arrayBuffer);
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
    
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
        const viewport = firstPage.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await firstPage.render({ canvasContext: context, viewport }).promise;
            coverImageUrl = canvas.toDataURL('image/jpeg', 0.6);
        }
    } catch (e) {
        console.error("Failed to extract PDF cover", e);
    }

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
        genre: 'PDF Document',
        isPdf: true,
        pdfData: pdfData
    };
};
