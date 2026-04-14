
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

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        // Extract text for search/quotes
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(' ');

        chapters.push({
            id: `page-${i}`,
            href: `page-${i}`,
            label: `Page ${i}`,
            html: `<div class="pdf-page-container"><img src="${dataUrl}" alt="Page ${i}" style="width: 100%; height: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #eee;" /></div>`,
            textContent: text
        });
    }

    // Try to get cover from first page
    let coverImageUrl = null;
    if (chapters.length > 0) {
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await firstPage.render({ canvasContext: context, viewport }).promise;
        coverImageUrl = canvas.toDataURL('image/jpeg', 0.6);
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
        genre: 'PDF Document'
    };
};
