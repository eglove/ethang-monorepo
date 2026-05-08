import Parser from 'rss-parser';
import { describe, expect, it, vi } from 'vitest';

import { fetchAndParseRss } from './rss-parser.js';

vi.mock('rss-parser');

describe('rss-parser', () => {
  it('should parse feeds successfully', async () => {
    const mockItems = [
      {
        contentSnippet: 'Article 1 content',
        link: 'http://www.example.com/article1',
        pubDate: 'Tue, 28 Apr 2026 12:00:00 GMT',
        title: 'Article 1',
      },
    ];
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(Parser.prototype.parseURL).mockResolvedValue({ feedUrl: '', image: {}, items: mockItems, paginationLinks: {}, title: '' });

    const articles = await fetchAndParseRss('http://test.com/rss.xml');

    expect(articles.length).toBe(1);
    expect(articles[0]?.title).toBe('Article 1');
    expect(articles[0]?.url).toBe('http://www.example.com/article1');
    expect(articles[0]?.content).toBe('Article 1 content');
    expect(articles[0]?.publishedAt?.toUTCString()).toBe('Tue, 28 Apr 2026 12:00:00 GMT');
  });

  it('should return empty array on failure', async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    vi.mocked(Parser.prototype.parseURL).mockRejectedValue(new Error('Network error'));
    const articles = await fetchAndParseRss('http://test.com/error.xml');
    expect(articles.length).toBe(0);
  });
});
