import OpenAI from 'openai';

interface CrawlResult {
  url: string;
  content: string;
  type: 'newsletter' | 'editor' | 'general';
  extractedData: any;
}

export class AdvancedWebCrawler {
  private openai: OpenAI;
  private visitedUrls: Set<string> = new Set();
  
  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async deepCrawl(domain: string): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    const baseUrl = `https://${domain}`;
    
    // Priority URLs to crawl first
    const priorityUrls = [
      '',
      '/newsletters',
      '/premium-newsletters', 
      '/free-newsletters',
      '/services',
      '/products',
      '/editors',
      '/team',
      '/our-team',
      '/contributors',
      '/analysts',
      '/authors',
      '/about',
      '/about-us'
    ];

    // First, discover all relevant URLs from the homepage
    const homepageUrls = await this.discoverUrls(baseUrl);
    
    // Combine priority URLs with discovered URLs
    const urlsToCrawl = [
      ...priorityUrls.map(path => `${baseUrl}${path}`),
      ...homepageUrls.filter(url => this.isRelevantUrl(url))
    ];

    // Crawl each URL and extract data
    for (const url of urlsToCrawl) {
      if (this.visitedUrls.has(url)) continue;
      
      try {
        const result = await this.crawlAndAnalyze(url);
        if (result) {
          results.push(result);
        }
        this.visitedUrls.add(url);
        
        // Limit to prevent excessive crawling
        if (results.length >= 10) break;
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
      }
    }

    return results;
  }

  private async discoverUrls(baseUrl: string): Promise<string[]> {
    try {
      const response = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) return [];
      
      const html = await response.text();
      
      // Extract all links
      const linkRegex = /href=["']([^"']+)["']/gi;
      const matches = Array.from(html.matchAll(linkRegex));
      const urls = matches.map(m => m[1])
        .filter(url => !url.startsWith('#') && !url.startsWith('mailto:'))
        .map(url => {
          if (url.startsWith('http')) return url;
          if (url.startsWith('/')) return `${baseUrl}${url}`;
          return `${baseUrl}/${url}`;
        })
        .filter(url => url.includes(baseUrl));
      
      return Array.from(new Set(urls));
    } catch (error) {
      console.error('Error discovering URLs:', error);
      return [];
    }
  }

  private isRelevantUrl(url: string): boolean {
    const relevantKeywords = [
      'newsletter', 'publication', 'service', 'product',
      'editor', 'team', 'author', 'analyst', 'contributor',
      'about', 'subscribe', 'premium', 'free'
    ];
    
    return relevantKeywords.some(keyword => 
      url.toLowerCase().includes(keyword)
    );
  }

  private async crawlAndAnalyze(url: string): Promise<CrawlResult | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) return null;
      
      const html = await response.text();
      
      // Determine page type
      const type = this.determinePageType(url, html);
      
      // Extract structured data using AI
      const extractedData = await this.extractWithAI(html, url, type);
      
      return {
        url,
        content: html.substring(0, 5000), // Limit content size
        type,
        extractedData
      };
    } catch (error) {
      console.error(`Error analyzing ${url}:`, error);
      return null;
    }
  }

  private determinePageType(url: string, html: string): 'newsletter' | 'editor' | 'general' {
    const urlLower = url.toLowerCase();
    const htmlLower = html.toLowerCase();
    
    if (urlLower.includes('newsletter') || urlLower.includes('publication') || 
        urlLower.includes('service') || urlLower.includes('product')) {
      return 'newsletter';
    }
    
    if (urlLower.includes('editor') || urlLower.includes('team') || 
        urlLower.includes('author') || urlLower.includes('contributor')) {
      return 'editor';
    }
    
    // Check content for type hints
    if (htmlLower.includes('newsletter') && htmlLower.includes('subscribe')) {
      return 'newsletter';
    }
    
    if (htmlLower.includes('editor') || htmlLower.includes('author')) {
      return 'editor';
    }
    
    return 'general';
  }

  private async extractWithAI(html: string, url: string, type: string): Promise<any> {
    // Clean HTML for better AI processing
    const cleanedHtml = this.cleanHtml(html);
    
    let prompt = '';
    
    if (type === 'newsletter') {
      prompt = `Extract ALL newsletters/publications from this page.
      
URL: ${url}
Content:
${cleanedHtml.substring(0, 4000)}

For EACH newsletter found, extract:
- Name (exact title)
- Description (one sentence)
- Frequency (daily/weekly/monthly)
- Topics (3-5 tags)
- Price (if mentioned)
- Editor/Author (if mentioned)

Return as JSON array of newsletters.`;
    } else if (type === 'editor') {
      prompt = `Extract ALL editors/authors/analysts from this page.

URL: ${url}
Content:
${cleanedHtml.substring(0, 4000)}

For EACH person found, extract:
- Full name
- Title/Role
- Bio/Description
- Expertise areas
- Associated newsletters (if mentioned)

Return as JSON array of editors.`;
    } else {
      prompt = `Extract any newsletters AND editors mentioned on this page.

URL: ${url}
Content:
${cleanedHtml.substring(0, 4000)}

Return as JSON with:
- newsletters: array of any newsletters mentioned
- editors: array of any editors/authors mentioned`;
    }

    try {
      const response = await this.openai.chat.completions.create({
        // Note: GPT-4o is the latest model as of May 2024. There is no GPT-5.
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting structured data from web pages. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error('AI extraction error:', error);
      return {};
    }
  }

  private cleanHtml(html: string): string {
    // Remove scripts and styles
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Extract text content from important tags
    const importantTags = [
      /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi,
      /<p[^>]*>(.*?)<\/p>/gi,
      /<li[^>]*>(.*?)<\/li>/gi,
      /<a[^>]*>(.*?)<\/a>/gi,
      /<div[^>]*class="[^"]*(?:card|item|product|service|newsletter|editor|author)[^"]*"[^>]*>(.*?)<\/div>/gi
    ];
    
    let extractedText = '';
    for (const regex of importantTags) {
      const matches = Array.from(html.matchAll(regex));
      extractedText += matches.map(m => m[1].replace(/<[^>]*>/g, ' ')).join('\n');
    }
    
    // Also include any remaining visible text
    const textOnly = cleaned.replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return extractedText + '\n\n' + textOnly.substring(0, 2000);
  }
}