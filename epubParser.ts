
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
    stack.pop(); 
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
        if (src.startsWith('http') || src.startsWith('data:')) continue;

        const fullPath = src.startsWith('/') ? src.slice(1) : normalizePath(chapterPath, src);
        let imgFile = zip.file(fullPath);
        if (!imgFile) {
            const allFiles = Object.keys(zip.files);
            const lowerPath = fullPath.toLowerCase();
            const matchedKey = allFiles.find(k => k.toLowerCase() === lowerPath || k.toLowerCase().endsWith('/' + lowerPath));
            if (matchedKey) imgFile = zip.file(matchedKey);
        }
        
        if (imgFile) {
            const blob = await imgFile.async('blob');
            const dataUrl = await blobToBase64(blob);
            if (img.tagName.toLowerCase() === 'image') {
                img.setAttribute('xlink:href', dataUrl);
            } else {
                img.setAttribute('src', dataUrl);
            }
        }
    }
    return doc.body.innerHTML;
};

export const parseEpub = async (file: File): Promise<Book> => {
    if (typeof JSZip === 'undefined') {
        throw new Error('Reader library is not ready.');
    }
    
    const zip = await new JSZip().loadAsync(file);
    const containerXmlFile = zip.file('META-INF/container.xml');
    if (!containerXmlFile) throw new Error('Invalid book format.');
    const containerXml = await containerXmlFile.async('string');
    
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXml, 'application/xml');
    const opfPath = containerDoc.querySelector('rootfile')?.getAttribute('full-path');
    if (!opfPath) throw new Error('Could not find book contents.');

    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error('Book data is missing.');
    const opfXml = await opfFile.async('string');
    const opfDoc = parser.parseFromString(opfXml, 'application/xml');

    const title = opfDoc.querySelector('dc\\:title, title')?.textContent?.trim() || 'Untitled Book';
    const author = opfDoc.querySelector('dc\\:creator, creator')?.textContent?.trim() || 'Unknown Author';
    
    const genreElements = Array.from(opfDoc.querySelectorAll('dc\\:subject, subject, meta[name="subject"]'));
    const genres = genreElements.map(el => el.textContent?.trim() || el.getAttribute('content')?.trim()).filter(Boolean) as string[];

    const manifestItems: Record<string, { href: string; mediaType: string; properties?: string }> = {};
    opfDoc.querySelectorAll('manifest > item').forEach((item: any) => {
        const id = item.getAttribute('id');
        const href = item.getAttribute('href');
        const mediaType = item.getAttribute('media-type');
        const properties = item.getAttribute('properties');
        if (id && href && mediaType) {
            manifestItems[id] = { href: opfDir + href, mediaType, properties };
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
        
        let label = doc.title?.trim() || '';
        const isGeneric = !label || label.toLowerCase().match(/\.(xhtml|html|xml|htm)$/i) || label.toLowerCase().match(/^(part|chapter|section|text|file)_?\d+/i);
        
        if (isGeneric) {
            const header = doc.querySelector('h1, h2, h3');
            if (header && header.textContent?.trim()) {
                label = header.textContent.trim();
            }
        }
        
        if (!label) {
            label = item.href.split('/').pop()?.replace(/\.(xhtml|html|xml|htm)$/i, '') || 'Chapter';
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

    // COVER EXTRACTION
    let coverImageUrl: string | null = null;
    let coverManifestItem = Object.values(manifestItems).find(item => item.properties?.includes('cover-image'));

    if (!coverManifestItem) {
        const coverMeta = opfDoc.querySelector('meta[name="cover"]');
        if (coverMeta) {
            const coverId = coverMeta.getAttribute('content');
            if (coverId && manifestItems[coverId]) {
                coverManifestItem = manifestItems[coverId];
            }
        }
    }

    if (!coverManifestItem) {
        const commonIds = ['cover', 'Cover', 'cover-image', 'title-page', 'titlepage'];
        for (const id of commonIds) {
            if (manifestItems[id]) {
                coverManifestItem = manifestItems[id];
                break;
            }
        }
    }

    if (!coverManifestItem) {
        coverManifestItem = Object.values(manifestItems).find(item => 
            (item.href.toLowerCase().includes('cover') || item.href.toLowerCase().includes('title')) && 
            item.mediaType.startsWith('image/')
        );
    }

    if (coverManifestItem) {
        const coverFile = zip.file(coverManifestItem.href);
        if (coverFile) {
            const coverData = await coverFile.async('blob');
            // Resize cover if it's likely high-res to avoid Firestore/IDB limits
            const dataUrl = await blobToBase64(coverData);
            try {
                coverImageUrl = await new Promise<string>((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const maxDim = 600;
                        if (img.width > maxDim || img.height > maxDim) {
                            const canvas = document.createElement('canvas');
                            const scale = Math.min(maxDim / img.width, maxDim / img.height);
                            canvas.width = img.width * scale;
                            canvas.height = img.height * scale;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                            resolve(canvas.toDataURL('image/jpeg', 0.7));
                        } else {
                            resolve(dataUrl);
                        }
                    };
                    img.onerror = () => resolve(dataUrl);
                    img.src = dataUrl;
                });
            } catch (e) {
                coverImageUrl = dataUrl;
            }
        }
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
        return 'Classic Essay';
    };

    return {
        id: crypto.randomUUID(),
        title, author, coverImageUrl, chapters,
        toc: tocItems.length ? tocItems : chapters.map(c => ({ id: c.id, href: c.href, label: c.label })),
        progress: 0, lastScrollTop: 0, readingTime: 0, lastOpened: Date.now(),
        genre: genres.join(', ') || guessGenre(title)
    };
};
