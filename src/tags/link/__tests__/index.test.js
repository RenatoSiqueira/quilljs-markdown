import Link from '../index.js';

describe('Link Tag', () => {
  let mockQuillJS;

  beforeEach(() => {
    mockQuillJS = {
      deleteText: jest.fn(),
      insertText: jest.fn(),
      // format() is not directly called by link action, but insertText uses link format
    };
  });

  describe('Constructor', () => {
    it('should initialize with default name, pattern, and activeTags', () => {
      const instance = new Link(mockQuillJS);
      expect(instance.name).toBe('link');
      // Original regex: /(?:\[(.+?)\])(?:\((.+?)\))/g
      // Escaped for JS: /(?:\[(.+?)\])(?:\((.+?)\))/g -> needs double escapes for string literal then for regex object
      // The constructor does this correctly: this.pattern = this._getCustomPatternOrDefault(options, this.name, /(?:\[(.+?)\])(?:\((.+?)\))/g)
      expect(instance.pattern).toEqual(/(?:\[(.+?)\])(?:\((.+?)\))/g);
      expect(instance.activeTags).toEqual(['link']);
    });

    it('should use custom pattern from options', () => {
      const customPattern = /custom/g;
      const instance = new Link(mockQuillJS, {
        tags: { link: { pattern: customPattern } }
      });
      expect(instance.pattern).toEqual(customPattern);
    });

    it('should have empty activeTags if ignored', () => {
      const instance = new Link(mockQuillJS, { ignoreTags: ['link'] });
      expect(instance.activeTags).toEqual([]);
    });
  });

  describe('Pattern Matching', () => {
    let instance;
    beforeEach(() => {
      instance = new Link(mockQuillJS);
    });

    it.each([
      ['[link text](http://example.com)', 'link text', 'http://example.com'],
      ['[another link](url.html)', 'another link', 'url.html'],
      ['prefix [text](link/path) suffix', 'text', 'link/path'],
      ['[spaced text](with space)', 'spaced text', 'with space'],
    ])('should match valid syntax "%s" capturing text "%s" and URL "%s"', (input, expectedText, expectedUrl) => {
      instance.pattern.lastIndex = 0;
      const match = instance.pattern.exec(input);
      expect(match).not.toBeNull();
      expect(match[1]).toBe(expectedText); // Group 1 captures link text
      expect(match[2]).toBe(expectedUrl);  // Group 2 captures URL
    });

    it.each([
      ['no link here'],
      ['[missing url]'],
      ['(missing text)[url]'],
      ['[unterminated](url'],
      ['text] (url)'],
      ['[text] (url'],
    ])('should not match invalid syntax "%s"', (input) => {
      instance.pattern.lastIndex = 0;
      expect(instance.pattern.exec(input)).toBeNull();
    });
  });

  describe('getAction().action', () => {
    let instance;
    let actionFn;

    beforeEach(() => {
      instance = new Link(mockQuillJS);
      actionFn = instance.getAction().action;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('should process valid [text](url), call Quill methods, and resolve true', async () => {
      const text = 'A [link text](http://example.com) here.';
      const lineStart = 10; // Arbitrary line start index in document
      const selection = {}; // Not directly used by action logic
      const pattern = instance.pattern;
      pattern.lastIndex = 0; // Ensure regex is reset

      // The action will call pattern.exec(text) internally.
      // Let's find what it would match to predict arguments for Quill calls.
      const internalMatch = pattern.exec(text);
      expect(internalMatch).not.toBeNull(); // Pre-condition for test logic
      const fullMatchedStringByAction = internalMatch[0]; // e.g., "[link text](http://example.com)"
      const linkTextByAction = internalMatch[1]; // "link text"
      const urlByAction = internalMatch[2]; // "http://example.com"
      const matchIndexInText = internalMatch.index; // Index of fullMatchedStringByAction in `text`

      pattern.lastIndex = 0; // Reset again before calling actionFn

      const promise = actionFn(text, selection, pattern, lineStart);
      jest.runAllTimers();
      const result = await promise;

      expect(result).toBe(true);

      const expectedStartIndex = lineStart + matchIndexInText;

      // Verify based on the action's actual logic, which re-matches for hrefText and hrefLink
      // For `text = 'A [link text](http://example.com) here.'`
      // `hrefText.slice(1, hrefText.length - 1)` -> 'link text'
      // `hrefLink.slice(1, hrefLink.length - 1)` -> 'http://example.com'
      // `matchedText.length` (from text.match(pattern)[0]) -> length of '[link text](http://example.com)'

      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(expectedStartIndex, fullMatchedStringByAction.length);
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(expectedStartIndex, linkTextByAction, 'link', urlByAction);
    });

    it('should resolve false if activeTags is empty', async () => {
      const instanceNoActive = new Link(mockQuillJS, { ignoreTags: ['link'] });
      const actionFnNoActive = instanceNoActive.getAction().action;
      const text = '[text](url)';
      instanceNoActive.pattern.lastIndex = 0;
      const promise = actionFnNoActive(text, {}, instanceNoActive.pattern, 0);
      const result = await promise;
      expect(result).toBe(false);
    });

    // Test to ensure it handles cases where text.search might not find (though action has initial exec)
    it('should resolve false if the initial pattern.exec does not match (and not throw)', async () => {
      const text = 'this is not a link';
      const lineStart = 0;
      instance.pattern.lastIndex = 0;

      // actionFn will do: const match = pattern.exec(text); which will be null
      // The original code does not check for null `match` before `match.index`
      // This test might expose that if not guarded.
      const promise = actionFn(text, {}, instance.pattern, lineStart);
      // jest.runAllTimers(); // Only if timeouts are involved in the false path
      const result = await promise;
      expect(result).toBe(false);
      expect(mockQuillJS.deleteText).not.toHaveBeenCalled();
    });
  });
}); 