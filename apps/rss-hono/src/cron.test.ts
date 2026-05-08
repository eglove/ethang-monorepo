import Parser from 'rss-parser';
import { describe, expect, it, vi } from 'vitest';

import { runCron } from './cron.js';
import { createDatabaseClient } from './db/client.js';
import { articlesTable, feedsTable } from './schema.js';

vi.mock('./db/client.js');
vi.mock('rss-parser');

describe('runCron', () => {
  it('should fetch and save new articles', async () => {
    const mockFeeds = [{
      description: 'test',
      icon: null,
      id: 'feed1',
      name: 'Test Feed',
      url: 'http://test.com/rss.xml',
    }];
    const mockArticles = [
      {
        content: 'Article 1 content',
        publishedAt: new Date('2026-04-28T12:00:00Z'),
        title: 'Article 1',
        url: 'http://test.com/article1',
      },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockGet = vi.fn();
    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn();

    (createDatabaseClient as ReturnType<typeof vi.fn>).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
    });

    mockSelect.mockImplementation(() => {return { from: mockFrom }});
    mockFrom.mockImplementation(() => {return { where: mockWhere }});
    mockWhere.mockImplementation(() => {return { get: mockGet }});

    mockFrom.mockReturnValueOnce(mockFeeds); // for fetching feeds
    mockGet.mockReturnValueOnce(); // No existing article
    mockInsert.mockReturnValueOnce({ values: mockValues });
    mockValues.mockResolvedValueOnce();

    // Mock rss-parser
    vi.mocked(Parser.prototype.parseURL).mockResolvedValue({
      items: [
        {
          contentSnippet: 'Article 1 content',
          link: 'http://test.com/article1',
          pubDate: '2026-04-28T12:00:00Z',
          title: 'Article 1',
        },
      ],
    } as any);

    await runCron({} as D1Database);

    expect(mockInsert).toHaveBeenCalledWith(articlesTable);
    expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
      feedId: 'feed1',
      title: 'Article 1',
      url: 'http://test.com/article1',
    }));
  });

  it('should not save existing articles', async () => {
    const mockFeeds = [{
      description: 'test',
      icon: null,
      id: 'feed1',
      name: 'Test Feed',
      url: 'http://test.com/rss.xml',
    }];
    const mockArticles = [
      {
        content: 'Article 1 content',
        publishedAt: new Date('2026-04-28T12:00:00Z'),
        title: 'Article 1',
        url: 'http://test.com/article1',
      },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockReturnThis();
    const mockGet = vi.fn();
    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn();

    (createDatabaseClient as ReturnType<typeof vi.fn>).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
    });

    mockSelect.mockImplementation(() => {return { from: mockFrom }});
    mockFrom.mockImplementation(() => {return { where: mockWhere }});
    mockWhere.mockImplementation(() => {return { get: mockGet }});

    mockFrom.mockReturnValueOnce(mockFeeds); // for fetching feeds
    mockGet.mockReturnValueOnce({ feedId: 'feed1', id: 'existing', title: 'Article 1', url: 'http://test.com/article1' }); // Existing article

    // Mock rss-parser
    vi.mocked(Parser.prototype.parseURL).mockResolvedValue({
      items: [
        {
          contentSnippet: 'Article 1 content',
          link: 'http://test.com/article1',
          pubDate: '2026-04-28T12:00:00Z',
          title: 'Article 1',
        },
      ],
    } as any);

    await runCron({} as D1Database);

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
