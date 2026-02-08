
import type { Book, Chapter, TocItem } from './types';

declare const JSZip: any;

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const normalizePath = (base: string, relative: string): string => {
    const stack = base.split("/");
    const parts = relative.split("/");
    stack.pop(); // remove current file name
    for (const part of parts) {
        if (part === ".") continue;
        if (part === "..") stack.pop();
        else stack.push(part);
    }
    return stack.join("/");
};

const resolveImages = async (html: string, zip: any, chapterPath: string): Promise<string> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imgs = doc.querySelectorAll('img, image');
    
    for (const img of Array.from(imgs)) {
        let src = img.getAttribute('src') || img.getAttribute('xlink:href');
        if (!src) continue;
        
        const fullPath = src.startsWith('/') ? src.slice(1) : normalizePath(chapterPath, src);
        const imgFile = zip.file(fullPath);
        
        if (imgFile) {
            const blob = await imgFile.async('blob');
            const url = URL.createObjectURL(blob);
            if (img.tagName.toLowerCase() === 'image') {
                img.setAttribute('xlink:href', url);
            } else {
                img.setAttribute('src', url);
            }
        }
    }
    return doc.body.innerHTML;
};

export const parseEpub = async (file: File): Promise<Book> => {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded.');
    }
    
    const zip = await new JSZip().loadAsync(file);
    const containerXmlFile = zip.file('META-INF/container.xml');
    if (!containerXmlFile) throw new Error('Invalid EPUB');
    const containerXml = await containerXmlFile.async('string');
    
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const opfPath = containerDoc.querySelector('rootfile')?.getAttribute('full-path');
    if (!opfPath) throw new Error('Cannot find OPF');

    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('Missing OPF');
    const opfXml = await opfFile.async('string');
    const opfDoc = parser.parseFromString(opfXml, 'application/xml');

    const title = opfDoc.querySelector('dc\\:title, title')?.textContent || 'Unknown Title';
    const author = opfDoc.querySelector('dc\\:creator, creator')?.textContent || 'Unknown Author';
    
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

    const chapters: Chapter[] = [];
    for (const item of spine) {
        if (!item) continue;
        const chapterFile = zip.file(item.href);
        if (!chapterFile) continue;
        const rawHtml = await chapterFile.async('string');
        const resolvedHtml = await resolveImages(rawHtml, zip, item.href);
        const doc = parser.parseFromString(resolvedHtml, 'text/html');
        
        // Improve Label extraction: If title is missing or generic (like part001.xhtml), try to find a header
        let label = doc.title || '';
        const isGeneric = !label || label.match(/\.(xhtml|html|xml|htm)$/i) || label.match(/^part\d+/i) || label.match(/^chapter\d+/i);
        
        if (isGeneric) {
            const header = doc.querySelector('h1, h2, h3');
            if (header && header.textContent) {
                label = header.textContent.trim();
            }
        }
        
        if (!label) {
            label = item.href.split('/').pop()?.replace(/\.(xhtml|html|xml|htm)$/i, '') || 'Untitled Chapter';
        }

        chapters.push({
            id: item.href,
            href: item.href,
            html: doc.body.innerHTML,
            label: label,
            textContent: doc.body.innerText || ''
        });
    }

    const tocItems: TocItem[] = [];
    const navItem = opfDoc.querySelector('item[properties~="nav"]');
    if (navItem) {
        const navFile = zip.file(opfDir + navItem.getAttribute('href'));
        if (navFile) {
            const navHtml = await navFile.async('string');
            const navDoc = parser.parseFromString(navHtml, 'text/html');
            navDoc.querySelectorAll('nav ol li a').forEach((a: any) => {
                tocItems.push({ id: a.getAttribute('href'), href: a.getAttribute('href'), label: a.textContent.trim() });
            });
        }
    }

    let coverImageUrl: string | null = null;
    const coverItem = opfDoc.querySelector('item[properties~="cover-image"]') || opfDoc.querySelector('item#cover-image');
    if (coverItem) {
        const href = coverItem.getAttribute('href');
        const coverFile = zip.file(opfDir + href);
        if (coverFile) {
            const coverData = await coverFile.async('blob');
            coverImageUrl = await blobToBase64(coverData);
        }
    }

    return {
        id: crypto.randomUUID(),
        title, author, coverImageUrl, chapters,
        toc: tocItems.length ? tocItems : chapters.map(c => ({ id: c.id, href: c.href, label: c.label })),
        progress: 0, lastScrollTop: 0, readingTime: 0, lastOpened: Date.now()
    };
};
