import Strikethrough from '../index.js'; // Assuming class name is Strikethrough

describe('Strikethrough Tag', () => {
  let mockQuillJS;

  beforeEach(() => {
    mockQuillJS = {
      deleteText: jest.fn(),
      insertText: jest.fn(),
      format: jest.fn(),
    };
  });

  describe('Constructor', () => {
    it('should initialize with default name, pattern, and activeTags', () => {
      const instance = new Strikethrough(mockQuillJS);
      expect(instance.name).toBe('strikethrough');
      expect(instance.pattern).toEqual(/(?:~|_){2}(.+?)(?:~|_){2}/g);
      expect(instance.activeTags).toEqual(['strikethrough']);
    });

    it('should use custom pattern from options', () => {
      const customPattern = /custom/g;
      const instance = new Strikethrough(mockQuillJS, {
        tags: { strikethrough: { pattern: customPattern } }
      });
      expect(instance.pattern).toEqual(customPattern);
    });

    it('should have empty activeTags if ignored', () => {
      const instance = new Strikethrough(mockQuillJS, { ignoreTags: ['strikethrough'] });
      expect(instance.activeTags).toEqual([]);
    });
  });

  describe('Pattern Matching', () => {
    let instance;
    beforeEach(() => {
      instance = new Strikethrough(mockQuillJS);
    });

    it.each([
      ['~~strike text~~', 'strike text'],
      ['__strike text__', 'strike text'],
      ['leading ~~strike~~ trailing', 'strike'],
      ['__s__', 's'],
      ['~~s~~', 's'],
      ['text ~~s~~ more', 's'],
      ['text __s__ more', 's'],
    ])('should match valid syntax "%s" and capture "%s"', (input, expectedCapture) => {
      instance.pattern.lastIndex = 0; // Reset for global regex
      const match = instance.pattern.exec(input);
      expect(match).not.toBeNull();
      expect(match[1]).toBe(expectedCapture);
    });

    it.each([
      ['~strike text~'],          // Single delimiters
      ['_strike text_'],          // Single delimiters
      ['~~strike text_'],         // Mismatched delimiters
      ['~~~~'],                     // No content for .+
      ['____'],                     // No content for .+
      ['no delimiters'],
      ['~~missing closing'],
      ['missing opening~~'],
    ])('should not match invalid syntax "%s"', (input) => {
      instance.pattern.lastIndex = 0; // Reset for global regex
      expect(instance.pattern.exec(input)).toBeNull();
    });
  });

  describe('getAction().action', () => {
    let instance;
    let actionFn;

    beforeEach(() => {
      instance = new Strikethrough(mockQuillJS);
      actionFn = instance.getAction().action;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('should process valid ~~strike~~ input, call Quill methods, and resolve true', async () => {
      const text = 'prefix ~~strike content~~ suffix';
      const selection = {};
      const pattern = instance.pattern;
      const lineStart = 5;

      pattern.lastIndex = 0;

      const promise = actionFn(text, selection, pattern, lineStart);
      jest.runAllTimers();
      const result = await promise;

      expect(result).toBe(true);

      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      const expectedAnnotatedText = match[0];
      const expectedMatchedText = match[1];
      const expectedStartIndex = lineStart + match.index;

      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(expectedStartIndex, expectedAnnotatedText.length);
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(expectedStartIndex, expectedMatchedText, { strike: true });
      expect(mockQuillJS.format).toHaveBeenCalledWith('strike', false);
    });

    it('should process valid __strike__ input', async () => {
      const text = '__strike content__';
      const selection = {};
      const pattern = instance.pattern;
      const lineStart = 0;
      pattern.lastIndex = 0;

      const promise = actionFn(text, selection, pattern, lineStart);
      jest.runAllTimers();
      await promise;

      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(lineStart + match.index, match[0].length);
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(lineStart + match.index, match[1], { strike: true });
      expect(mockQuillJS.format).toHaveBeenCalledWith('strike', false);
    });

    it('should resolve false if text consists only of formatting characters that pass main regex but fail secondary check', async () => {
      const textForCondition = '~~_~~'; // Passes main regex (content: _), but should be caught by /^([~_ \n]+)$/g
      const lineStart = 0;
      instance.pattern.lastIndex = 0;

      const initialMatch = instance.pattern.exec(textForCondition);
      expect(initialMatch).not.toBeNull();
      expect(initialMatch[1]).toBe('_');
      instance.pattern.lastIndex = 0;

      const promise = actionFn(textForCondition, {}, instance.pattern, lineStart);
      jest.runAllTimers();
      const result = await promise;

      expect(result).toBe(false);
      expect(mockQuillJS.deleteText).not.toHaveBeenCalled();
    });

    it('should resolve false if activeTags is empty', async () => {
      const instanceNoActive = new Strikethrough(mockQuillJS, { ignoreTags: ['strikethrough'] });
      const actionFnNoActive = instanceNoActive.getAction().action;
      const text = '~~valid~~';
      instanceNoActive.pattern.lastIndex = 0;
      const promise = actionFnNoActive(text, {}, instanceNoActive.pattern, 0);
      const result = await promise;
      expect(result).toBe(false);
    });

    it('should resolve false if pattern does not match input text (and not throw)', async () => {
      const text = 'no strikethrough';
      const lineStart = 0;
      instance.pattern.lastIndex = 0;
      const promise = actionFn(text, {}, instance.pattern, lineStart);
      const result = await promise;
      expect(result).toBe(false);
      expect(mockQuillJS.deleteText).not.toHaveBeenCalled();
    });
  });
}); 