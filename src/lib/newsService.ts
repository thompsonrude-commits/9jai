/**
 * News & Information Service.
 * Uses local-first fallbacks and avoids browser-side secret dependencies.
 */

import { Timestamp, addDoc, collection, getDocs, limit, orderBy, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface NewsItem {
  id?: string;
  title: string;
  description: string;
  content: string;
  source: string;
  url: string;
  imageUrl?: string;
  category: 'world' | 'africa' | 'nigeria' | 'technology' | 'culture' | 'health' | 'education' | 'business';
  language: string;
  originalLanguage: string;
  translations?: Record<string, string>;
  publishedAt: Timestamp;
  fetchedAt: Timestamp;
  relevance: number;
  tags: string[];
  isHistorical: boolean;
  culturalContext?: string;
}

export interface NewsCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const NEWS_CATEGORIES: NewsCategory[] = [
  { id: 'world', name: 'World News', description: 'Global news and events', icon: '🌍' },
  { id: 'africa', name: 'Africa', description: 'African continent news', icon: '🌍' },
  { id: 'nigeria', name: 'Nigeria', description: 'Nigerian news and updates', icon: '🇳🇬' },
  { id: 'technology', name: 'Technology', description: 'Tech news and innovations', icon: '💻' },
  { id: 'culture', name: 'Culture', description: 'Cultural events and traditions', icon: '🎭' },
  { id: 'health', name: 'Health', description: 'Health and wellness news', icon: '⚕️' },
  { id: 'education', name: 'Education', description: 'Educational news and updates', icon: '📚' },
  { id: 'business', name: 'Business', description: 'Business and economy news', icon: '💼' },
];

export async function fetchLatestNews(category?: string, limit_count: number = 10): Promise<NewsItem[]> {
  const newsItems: NewsItem[] = [];
  try {
    const bbcUrl = 'https://feeds.bbci.co.uk/news/rss.xml';
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(bbcUrl)}`);
    const data = await response.json();

    if (data.contents) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
      const items = xmlDoc.querySelectorAll('item');

      items.forEach((item, index) => {
        if (index < limit_count) {
          const title = item.querySelector('title')?.textContent || 'Local news update';
          const description = item.querySelector('description')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '#';
          const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();

          newsItems.push({
            title,
            description,
            content: description,
            source: 'BBC News',
            url: link,
            category: (category as any) || 'world',
            language: 'en',
            originalLanguage: 'en',
            publishedAt: Timestamp.fromDate(new Date(pubDate)),
            fetchedAt: Timestamp.now(),
            relevance: 90,
            tags: ['bbc', 'news', category || 'general'],
            isHistorical: false,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error fetching news:', error);
  }

  return newsItems;
}

export async function saveNewsToFirestore(newsItem: NewsItem): Promise<string> {
  const docRef = await addDoc(collection(db, 'news'), {
    ...newsItem,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getNewsFromFirestore(category?: string, limit_count: number = 20, isHistorical: boolean = false): Promise<NewsItem[]> {
  try {
    let q;
    if (category) {
      q = query(collection(db, 'news'), where('category', '==', category), where('isHistorical', '==', isHistorical), orderBy('publishedAt', 'desc'), limit(limit_count));
    } else {
      q = query(collection(db, 'news'), where('isHistorical', '==', isHistorical), orderBy('publishedAt', 'desc'), limit(limit_count));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Record<string, unknown>) } as NewsItem));
  } catch (error) {
    console.error('Error getting news from Firestore:', error);
    return [];
  }
}

export async function translateNewsToLanguage(newsItem: NewsItem, targetLanguage: string): Promise<string> {
  return `${newsItem.title} (${targetLanguage})`;
}
