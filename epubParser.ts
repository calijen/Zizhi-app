
import type { Book, Chapter, TocItem } from './types';

// Use the JSZip version loaded via script tag in index.html to be more robust
declare const JSZip: any;

export const parseEpub = async (file: File): Promise<Book> => {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded. Please check your internet connection.');
    }
    
    const zip = await new JSZip().loadAsync(file);
    
    // 1. Find the container.xml to locate the .opf file
    const containerXmlFile = zip.file('META-INF/container.xml');
    if (!containerXmlFile) throw new Error('Invalid EPUB: Missing container.xml');
    const containerXml = await containerXmlFile.async('string');
    
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const opfPath = containerDoc.querySelector('rootfile')?.getAttribute('full-path');
    if (!opfPath) throw new Error('Invalid EPUB: Cannot find OPF file');

    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('Invalid EPUB: Missing OPF file');
    const opfXml = await opfFile.async('string');
    
    const opfDoc = parser.parseFromString(opfXml, 'application/xml');

    // 2. Extract Metadata
    const title = opfDoc.querySelector('dc\\:title, title')?.textContent || 'Unknown Title';
    const author = opfDoc.querySelector('dc\\:creator, creator')?.textContent || 'Unknown Author';
    
    // 3. Extract Manifest & Spine
    const manifestItems: Record<string, { href: string; mediaType: string }> = {};
    opfDoc.querySelectorAll('manifest > item').forEach((item: any) => {
        const id = item.getAttribute('id');
        const href = item.getAttribute('href');
        const mediaType = item.getAttribute('media-type');
        if (id && href && mediaType) {
            manifestItems[id] = { href: opfDir + href, mediaType };
        }
    });

    const spine = Array.from(opfDoc.querySelectorAll('spine > itemref')).map((ref: any) => {
        const idref = ref.getAttribute('idref');
        return idref ? manifestItems[idref] : null;
    }).filter(Boolean);

    // 4. Extract Chapters
    const chapters: Chapter[] = [];
    for (const item of spine) {
        if (!item) continue;
        const chapterFile = zip.file(item.href);
        if (!chapterFile) continue;
        
        const content = await chapterFile.async('string');
        if (content) {
            const doc = parser.parseFromString(content, 'text/html');
            const textContent = doc.body.innerText || doc.body.textContent || '';
            
            chapters.push({
                id: item.href,
                href: item.href,
                html: doc.body.innerHTML,
                label: doc.title || item.href.split('/').pop() || 'Chapter',
                textContent
            });
        }
    }

    // 5. Try to find cover
    let coverImageUrl: string | null = null;
    const coverItem = opfDoc.querySelector('item[properties~="cover-image"]') || 
                      opfDoc.querySelector('item#cover-image') || 
                      opfDoc.querySelector('item#cover');
    if (coverItem) {
        const href = coverItem.getAttribute('href');
        if (href) {
            const coverFile = zip.file(opfDir + href);
            if (coverFile) {
                const coverData = await coverFile.async('blob');
                coverImageUrl = URL.createObjectURL(coverData);
            }
        }
    }

    return {
        id: crypto.randomUUID(),
        title,
        author,
        coverImageUrl,
        chapters,
        toc: [], 
        progress: 0,
        lastScrollTop: 0,
        epubFile: file,
        lastOpened: Date.now()
    };
};
