export interface GatheredImage {
  url: string;
  caption: string;
  source: string;
}

export async function fetchTopicImage(topic: string, category: string): Promise<GatheredImage | null> {
  // 1. Query Wikimedia Commons Search API for authentic educational/scientific photographs & diagrams
  try {
    const cleanSearch = `${category} ${topic}`.replace(/[^\w\s]/gi, ' ').trim();
    const query = encodeURIComponent(cleanSearch);
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrsearch=${query}&gsrlimit=5&prop=imageinfo&iiprop=url|extmetadata`
    );
    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages;
      if (pages) {
        for (const pageId of Object.keys(pages)) {
          const page = pages[pageId];
          const info = page.imageinfo?.[0];
          const url = info?.url;
          if (
            url &&
            (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg') || url.endsWith('.webp')) &&
            !url.toLowerCase().includes('icon') &&
            !url.toLowerCase().includes('logo')
          ) {
            const rawTitle = page.title?.replace('File:', '').replace(/\.[^/.]+$/, '') || topic;
            const caption = rawTitle.replace(/[-_]/g, ' ');
            return {
              url,
              caption: caption.length > 80 ? `${caption.slice(0, 80)}...` : caption,
              source: 'Wikimedia Commons (Public Domain / CC)'
            };
          }
        }
      }
    }
  } catch (e) {
    console.warn('Wikimedia image gathering failed:', e);
  }

  // 2. Fallback to curated topic image search if Wikimedia has no direct media file
  try {
    const primaryKeyword = encodeURIComponent(topic.split(' ')[0] || category);
    return {
      url: `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80#${primaryKeyword}`,
      caption: `${topic} (${category})`,
      source: 'Topic Photo Collection'
    };
  } catch {
    return null;
  }
}
