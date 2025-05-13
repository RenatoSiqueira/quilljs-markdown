import InlineCode from '../index.js'

describe('InlineCode Tag', () => {
  let mockQuillJS

  beforeEach(() => {
    mockQuillJS = {
      deleteText: jest.fn(),
      insertText: jest.fn()
      // No format() call is made by this specific tag's action
    }
  })

  describe('Constructor', () => {
    it('should initialize with default name, pattern function, and activeTags', () => {
      const instance = new InlineCode(mockQuillJS)
      expect(instance.name).toBe('code')
      expect(typeof instance.pattern).toBe('function')
      expect(instance.activeTags).toEqual(['code'])
    })

    it('should use custom pattern from options (though it expects a function here)', () => {
      const customPatternFunc = (value) => value === 'custom' ? value : null
      const instance = new InlineCode(mockQuillJS, {
        tags: { code: { pattern: customPatternFunc } }
      })
      expect(instance.pattern).toBe(customPatternFunc)
    })

    it('default pattern function should correctly identify inline code and reject code blocks', () => {
      const instance = new InlineCode(mockQuillJS) // Gets default pattern function
      const patternFn = instance.pattern

      expect(patternFn('`test`')).toBe('`test`')
      expect(patternFn('some `code` here')).toBe('some `code` here')
      expect(patternFn('no backticks')).toBeNull()
      expect(patternFn('```code block```')).toBeNull() // Should be rejected
      expect(patternFn('` unaccompanied`')).toBeNull() // Malformed
      expect(patternFn('unaccompanied `')).toBeNull() // Malformed
      expect(patternFn('text ` with ``` nested block`')).toBeNull()
      expect(patternFn('`code with ``` inside`')).toBeNull()
    })
  })

  describe('Action Logic (based on its internal regex)', () => {
    let instance
    let actionFn

    beforeEach(() => {
      instance = new InlineCode(mockQuillJS)
      actionFn = instance.getAction().action
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.clearAllTimers()
      jest.useRealTimers()
    })

    it.each([
      ['This is `inline code` text.', 'inline code', '`inline code`', 8],
      ['`code`', 'code', '`code`', 0],
      ['before `a` after', 'a', '`a`', 7]
    ])('should process "%s", extracting "%s" and calling Quill methods', async (text, expectedMessage, expectedAnnotatedText, matchIndexInText) => {
      const lineStart = 10 // Arbitrary line start index in document
      const selection = {} // Not directly used by this action's logic

      const promise = actionFn(text, selection, instance.pattern, lineStart)
      jest.runAllTimers()
      const result = await promise

      expect(result).toBe(true)

      const expectedStartIndex = lineStart + matchIndexInText

      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(expectedStartIndex, expectedAnnotatedText.length)
      expect(mockQuillJS.insertText).toHaveBeenCalledTimes(2)
      expect(mockQuillJS.insertText).toHaveBeenNthCalledWith(1, expectedStartIndex, expectedMessage, { code: true })
      expect(mockQuillJS.insertText).toHaveBeenNthCalledWith(2, expectedStartIndex + expectedMessage.length, ' ', { code: false })
    })

    it('should resolve false if the internal regex does not match', async () => {
      const text = 'no inline code here'
      const lineStart = 0
      const result = await actionFn(text, {}, instance.pattern, lineStart)
      expect(result).toBe(false)
      expect(mockQuillJS.deleteText).not.toHaveBeenCalled()
    })

    it('should resolve false if activeTags is empty', async () => {
      const instanceWithNoActiveTags = new InlineCode(mockQuillJS, { ignoreTags: ['code'] })
      const actionFnNoActive = instanceWithNoActiveTags.getAction().action
      const text = '`valid`'
      const result = await actionFnNoActive(text, {}, instanceWithNoActiveTags.pattern, 0)
      expect(result).toBe(false)
    })
  })
})
