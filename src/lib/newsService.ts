/**
 * News & Information Service
 * Fetches current news, maintains historical records, and provides multilingual information
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
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
  language: string; // Language code (e.g., 'en', 'edo', 'yoruba')
  originalLanguage: string; // Original language of the news
  translations?: Record<string, string>; // Translations in other languages
  publishedAt: Timestamp;
  fetchedAt: Timestamp;
  relevance: number; // 0-100 relevance score
  tags: string[];
  isHistorical: boolean; // Mark as historical record
  culturalContext?: string; // Cultural significance
}

export interface NewsCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// News categories
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

/**
 * Fetch news from multiple sources
 * Uses NewsAPI, BBC, Reuters, and other sources
 */
export async function fetchLatestNews(category?: string, limit_count: number = 10): Promise<NewsItem[]> {
  try {
    const newsItems: NewsItem[] = [];

    // Fetch from NewsAPI (requires API key in environment)
    const newsApiKey = process.env.REACT_APP_NEWS_API_KEY;
    if (newsApiKey) {
      const newsApiUrl = `https://newsapi.org/v2/top-headlines?country=ng&category=${category || 'general'}&apiKey=${newsApiKey}&pageSize=${limit_count}`;
      
      try {
        const response = await fetch(newsApiUrl);
        const data = await response.json();
        
        if (data.articles) {
          data.articles.forEach((article: any) => {
            newsItems.push({
              title: article.title,
              description: article.description || '',
              content: article.content || article.description || '',
              source: article.source.name,
              url: article.url,
              imageUrl: article.urlToImage,
              category: category as any || 'world',
              language: 'en',
              originalLanguage: 'en',
              publishedAt: Timestamp.fromDate(new Date(article.publishedAt)),
              fetchedAt: Timestamp.now(),
              relevance: 85,
              tags: [category || 'general', 'news'],
              isHistorical: false,
            });
          });
        }
      } catch (err) {
        console.error('NewsAPI fetch error:', err);
      }
    }

    // Fetch from BBC News (RSS feed)
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
            const title = item.querySelector('title')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            
            newsItems.push({
              title,
              description,
              content: description,
              source: 'BBC News',
              url: link,
              category: category as any || 'world',
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
    } catch (err) {
      console.error('BBC News fetch error:', err);
    }

    return newsItems;
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

/**
 * Save news to Firestore for historical records
 */
export async function saveNewsToFirestore(newsItem: NewsItem): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'news'), {
      ...newsItem,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving news:', error);
    throw error;
  }
}

/**
 * Get news from Firestore
 */
export async function getNewsFromFirestore(
  category?: string,
  limit_count: number = 20,
  isHistorical: boolean = false
): Promise<NewsItem[]> {
  try {
    let q;
    
    if (category) {
      q = query(
        collection(db, 'news'),
        where('category', '==', category),
        where('isHistorical', '==', isHistorical),
        orderBy('publishedAt', 'desc'),
        limit(limit_count)
      );
    } else {
      q = query(
        collection(db, 'news'),
        where('isHistorical', '==', isHistorical),
        orderBy('publishedAt', 'desc'),
        limit(limit_count)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as NewsItem));
  } catch (error) {
    console.error('Error getting news from Firestore:', error);
    return [];
  }
}

/**
 * Translate news to a specific language using AI
 */
export async function translateNewsToLanguage(
  newsItem: NewsItem,
  targetLanguage: string
): Promise<string> {
  try {
    // This would use the Groq API or another translation service
    // For now, returning a placeholder
    // In production, integrate with translation API
    
    if (newsItem.translations && newsItem.translations[targetLanguage]) {
      return newsItem.translations[targetLanguage];
    }
    
    // Placeholder: In production, call translation API
    return `[Translation to ${targetLanguage} would be provided here]\n\n${newsItem.content}`;
  } catch (error) {
    console.error('Error translating news:', error);
    return newsItem.content;
  }
}

/**
 * Mark news as historical record
 */
export async function markAsHistorical(newsId: string, culturalContext?: string): Promise<void> {
  try {
    const newsRef = doc(db, 'news', newsId);
    await updateDoc(newsRef, {
      isHistorical: true,
      culturalContext: culturalContext || '',
      markedAsHistoricalAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error marking news as historical:', error);
    throw error;
  }
}

/**
 * Get trending topics
 */
export async function getTrendingTopics(limit_count: number = 10): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'news'),
      orderBy('fetchedAt', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    const tagFrequency: Record<string, number> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.tags) {
        data.tags.forEach((tag: string) => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit_count)
      .map(([tag]) => tag);
  } catch (error) {
    console.error('Error getting trending topics:', error);
    return [];
  }
}

/**
 * Search news by keyword
 */
export async function searchNews(keyword: string, limit_count: number = 20): Promise<NewsItem[]> {
  try {
    const q = query(
      collection(db, 'news'),
      orderBy('publishedAt', 'desc'),
      limit(limit_count)
    );
    
    const snapshot = await getDocs(q);
    const results = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as NewsItem))
      .filter(item => 
        item.title.toLowerCase().includes(keyword.toLowerCase()) ||
        item.description.toLowerCase().includes(keyword.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
      );
    
    return results;
  } catch (error) {
    console.error('Error searching news:', error);
    return [];
  }
}

/**
 * Get news statistics
 */
export async function getNewsStatistics(): Promise<{
  totalNews: number;
  totalHistorical: number;
  categoryCounts: Record<string, number>;
  lastUpdated: Date;
}> {
  try {
    const q = query(collection(db, 'news'));
    const snapshot = await getDocs(q);
    
    const stats = {
      totalNews: 0,
      totalHistorical: 0,
      categoryCounts: {} as Record<string, number>,
      lastUpdated: new Date(),
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      stats.totalNews++;
      
      if (data.isHistorical) {
        stats.totalHistorical++;
      }
      
      const category = data.category || 'uncategorized';
      stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting news statistics:', error);
    return {
      totalNews: 0,
      totalHistorical: 0,
      categoryCounts: {},
      lastUpdated: new Date(),
    };
  }
}

/**
 * Auto-update news at regular intervals
 */
export function startAutoNewsUpdate(intervalMinutes: number = 60): NodeJS.Timeout {
  const updateNews = async () => {
    try {
      console.log('Auto-updating news...');
      
      // Fetch latest news from all categories
      for (const category of NEWS_CATEGORIES) {
        const news = await fetchLatestNews(category.id, 5);
        
        // Save to Firestore
        for (const item of news) {
          try {
            await saveNewsToFirestore(item);
          } catch (err) {
            console.error(`Error saving news for category ${category.id}:`, err);
          }
        }
      }
      
      console.log('News update completed');
    } catch (error) {
      console.error('Error in auto-update:', error);
    }
  };
  
  // Run immediately
  updateNews();
  
  // Then run at regular intervals
  return setInterval(updateNews, intervalMinutes * 60 * 1000);
}

/**
 * Stop auto-update
 */
export function stopAutoNewsUpdate(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
}
