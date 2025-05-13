import Italics from '../index.js' // Changed from Bold

describe('Italics Tag', () => {
  let mockQuillJS

  beforeEach(() => {
    mockQuillJS = {
      deleteText: jest.fn(),
      insertText: jest.fn(),
      format: jest.fn(),
      getText: jest.fn().mockReturnValue('') // Default mock for getText
    }
  })

  describe('Constructor', () => {
    it('should initialize with default name, pattern, and activeTags', () => {
      const italicsInstance = new Italics(mockQuillJS)
      expect(italicsInstance.name).toBe('italic')
      // Expect the NEW regex with lookarounds and text1s/text1u/text3/d3 groups
      expect(italicsInstance.pattern).toEqual(/(?:(?<!\*)\*(?<text1s>[^\s*_](?:.*[^\s*_])?|[^\s*_])\*(?!\*)|(?<!_)_(?<text1u>[^\s*_](?:.*[^\s*_])?|[^\s*_])_(?!_)|(?<d3>\*|_){3}(?<text3>[^*_]*)\k<d3>{3})/g)
      expect(italicsInstance.activeTags).toEqual(['italics'])
    })

    it('should use custom pattern from options', () => {
      const customPattern = /custom/g
      const italicsInstance = new Italics(mockQuillJS, {
        tags: { italic: { pattern: customPattern } }
      })
      expect(italicsInstance.pattern).toEqual(customPattern)
    })

    it('should have empty activeTags if ignored', () => {
      const italicsInstance = new Italics(mockQuillJS, { ignoreTags: ['italics'] })
      expect(italicsInstance.activeTags).toEqual([])
    })
  })

  describe('Pattern Matching', () => {
    let italicsInstance
    beforeEach(() => {
      italicsInstance = new Italics(mockQuillJS)
    })

    it.each([
      // Valid cases that should match
      // inputString, expectedFullMatch (match[0]), expectedContent (match.groups.text1s/u or text3)
      ['*italic*', '*italic*', 'italic'],
      ['_italic_', '_italic_', 'italic'],
      ['A*italic*Z', '*italic*', 'italic'],
      ['A_italic_Z', '_italic_', 'italic'],
      [' *text* ', '*text*', 'text'],
      ['word *italic* word', '*italic*', 'italic'],
      ['word _italic_ word', '_italic_', 'italic'],
      [' *abc* ', '*abc*', 'abc'],
      ['This is *italic text* here.', '*italic text*', 'italic text'],
      ['This is _italic text_ here.', '_italic text_', 'italic text'],
      ['***bolditalic***', '***bolditalic***', 'bolditalic'],
      ['___bolditalic___', '___bolditalic___', 'bolditalic'],
      ['A***bolditalic***Z', '***bolditalic***', 'bolditalic'],
      ['A___bolditalic___Z', '___bolditalic___', 'bolditalic'],
      ['******', '******', ''],
      ['______', '______', ''],
      ['*** ***', '*** ***', ' '],
      ['___ ___', '___ ___', ' '],
      ['*** text ***', '*** text ***', ' text '],
      ['___ text ___', '___ text ___', ' text ']
    ])('should match valid syntax "%s" capturing content correctly', (inputString, expectedFullMatch, expectedContent) => {
      italicsInstance.pattern.lastIndex = 0
      const match = italicsInstance.pattern.exec(inputString)
      expect(match).not.toBeNull()
      expect(match[0]).toBe(expectedFullMatch)
      let capturedContent
      if (match.groups.text1s !== undefined) {
        capturedContent = match.groups.text1s
      } else if (match.groups.text1u !== undefined) {
        capturedContent = match.groups.text1u
      } else if (match.groups.text3 !== undefined) {
        capturedContent = match.groups.text3
      }
      expect(capturedContent).toBe(expectedContent)
    })

    it.each([
      ['**text**'], // Double (Bold) - should now be null
      ['__text__'], // Double (Bold) - should now be null
      ['*text_'], // Mismatched delimiters
      ['_text*'], // Mismatched delimiters
      ['no_delimiter'],
      ['*a'], // Unclosed single asterisk
      ['_a'], // Unclosed single underscore
      ['***a'], // Unclosed triple asterisk
      ['___a'], // Unclosed triple underscore
      ['text*noSpaceBefore'],
      ['noSpaceAfter*text'],
      ['word*word'],
      [' * text * '], // Content has leading/trailing spaces internally - new regex disallows this for single delimiters
      ['_ text _'], // Content has leading/trailing spaces internally - new regex disallows this for single delimiters
      ['* '], // space only content, not matching [^\s*_]
      ['_ '] // space only content
    ])('should not match invalid or non-italic syntax "%s"', (inputString) => {
      italicsInstance.pattern.lastIndex = 0
      expect(italicsInstance.pattern.exec(inputString)).toBeNull()
    })
  })

  describe('getAction().action', () => {
    let italicsInstance
    let actionFn

    beforeEach(() => {
      italicsInstance = new Italics(mockQuillJS)
      actionFn = italicsInstance.getAction().action
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.clearAllTimers()
      jest.useRealTimers()
    })

    // Test case for *italic*
    it('should process *italic* input, call Quill methods, and resolve true', async () => {
      const inputTextLine = 'This is *italic* text.'
      const lineStartInDocument = 5
      const selection = { index: lineStartInDocument + 8, length: 0 }
      const pattern = italicsInstance.pattern
      pattern.lastIndex = 0

      mockQuillJS.getText.mockReturnValue('     This is *italic* text.')
      const currentMatch = pattern.exec(inputTextLine)
      expect(currentMatch).not.toBeNull()
      // currentMatch[0] should be ' *italic*' (length 8), currentMatch.index is 7 (within inputTextLine)
      // content (text1) is 'italic'

      const promise = actionFn(currentMatch, selection, lineStartInDocument)
      jest.runAllTimers()
      const result = await promise
      expect(result).toBe(true)

      // deleteActualStartIndex: if currentMatch[0].startsWith(' ') (false with new regex for *italic*) -> startIndex (5+8=13)
      // deleteActualLength: currentMatch[0].length (8)
      // So, deleteText(13, 8)
      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(13, 8)
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(13, 'italic', { italic: true })
      expect(mockQuillJS.format).toHaveBeenCalledWith('italic', false)
    })

    // Test case for _italic_ at line start
    it('should process _italic_ at line start correctly', async () => {
      const inputTextLine = '_italic_ start'
      const lineStartInDocument = 0
      const selection = { index: 1, length: 0 }
      const pattern = italicsInstance.pattern
      pattern.lastIndex = 0

      mockQuillJS.getText.mockReturnValue('_italic_ start')
      const currentMatch = pattern.exec(inputTextLine)
      expect(currentMatch).not.toBeNull()
      // currentMatch[0] is '_italic_' (length 8), currentMatch.index is 0
      // content (text1) is 'italic'

      const promise = actionFn(currentMatch, selection, lineStartInDocument)
      jest.runAllTimers()
      await promise

      // deleteActualStartIndex: currentMatch[0].startsWith(' ') (false) -> startIndex (0+0=0)
      // deleteActualLength: currentMatch[0].length (8)
      // So, deleteText(0, 8)
      // insertText(0, 'italic', ...)
      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(0, 8)
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(0, 'italic', { italic: true })
      expect(mockQuillJS.format).toHaveBeenCalledWith('italic', false)
    })

    it('should resolve false if activeTags is empty', async () => {
      const instanceWithNoActiveTags = new Italics(mockQuillJS, { ignoreTags: ['italics'] })
      const actionFnNoActive = instanceWithNoActiveTags.getAction().action
      const text = '*valid*' // This would match the pattern
      instanceWithNoActiveTags.pattern.lastIndex = 0
      const currentMatch = instanceWithNoActiveTags.pattern.exec(text)
      expect(currentMatch).not.toBeNull()

      const result = await actionFnNoActive(currentMatch, {}, 0)
      expect(result).toBe(false)
    })

    it('should resolve false if pattern does not match (null match passed to action)', async () => {
      const text = 'not italic'
      italicsInstance.pattern.lastIndex = 0
      const currentMatch = italicsInstance.pattern.exec(text) // This will be null
      expect(currentMatch).toBeNull()

      const result = await actionFn(currentMatch, {}, 0)
      expect(result).toBe(false)
    })

    // Test for the original bold conflict check (now implicitly handled by regex or content extraction)
    // This test might need to be rethought. The original check was:
    // if (matchedToken === firstToken && firstToken === secondToken)
    // The new regex for italics is less likely to match simple bold like '**'.
    // This test was: 'should resolve false to avoid ** or __ formatting (bold conflict)'
    // Input text was '*m*', which our new regex should match.
    // mockQuillJS.getText.mockReturnValue('.....**bold**.....');
    // The original logic was complex and related to `matchedToken` which no longer exists in the same way.
    // For now, let's assume the regex and content validation in action is enough.
    // If specific bold/italic conflicts need explicit handling, it requires different logic.
    it('should process a simple *m* without failing due to old bold conflict logic', async () => {
      const inputTextLine = '*m*'
      const lineStartInDocument = 0
      const selection = { index: 1, length: 0 }
      italicsInstance.pattern.lastIndex = 0
      const currentMatch = italicsInstance.pattern.exec(inputTextLine)
      expect(currentMatch).not.toBeNull() // *m* should match text1='m'

      mockQuillJS.getText.mockReturnValue('*m*') // For any getText calls if they were still there

      const promise = actionFn(currentMatch, selection, lineStartInDocument)
      jest.runAllTimers()
      const result = await promise
      expect(result).toBe(true)
      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(0, 3) // Deletes '*m*'
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(0, 'm', { italic: true })
    })

    // TODO: More tests for variations of match.index (0 or >0) affecting adjustPosition/deleteEndOffset.
    // TODO: Tests for triple asterisk/underscore cases if their handling in action differs beyond regex.
  })
})
