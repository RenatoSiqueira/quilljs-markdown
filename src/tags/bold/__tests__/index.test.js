import Bold from '../index.js'

describe('Bold Tag', () => {
  let mockQuillJS

  beforeEach(() => {
    mockQuillJS = {
      deleteText: jest.fn(),
      insertText: jest.fn(),
      format: jest.fn()
      // Add other Quill methods if Bold tag starts using them
    }
  })

  describe('Constructor', () => {
    it('should initialize with default name, pattern, and activeTags', () => {
      const boldInstance = new Bold(mockQuillJS)
      expect(boldInstance.name).toBe('bold')
      expect(boldInstance.pattern).toEqual(/(\*|_){2}(?!\s)((?:[^*_\s]|(?:[^*_\s].*?[^*_\s])))(?<!\s)(?:\1){2}/g)
      // From bold/meta.js, applyHtmlTags is ['bold']
      expect(boldInstance.activeTags).toEqual(['bold'])
    })

    it('should use custom pattern from options if provided', () => {
      const customPattern = /customPattern/g
      const boldInstance = new Bold(mockQuillJS, {
        tags: { bold: { pattern: customPattern } }
      })
      expect(boldInstance.pattern).toEqual(customPattern)
    })

    it('should correctly determine activeTags based on options.ignoreTags', () => {
      const options = { ignoreTags: ['bold'] }
      const boldInstance = new Bold(mockQuillJS, options)
      expect(boldInstance.activeTags).toEqual([])
    })
  })

  describe('Pattern', () => {
    let boldInstance
    beforeEach(() => {
      boldInstance = new Bold(mockQuillJS)
    })

    it.each([
      ['**bold text**', 'bold text'],
      ['__bold text__', 'bold text'],
      ['leading **bold** trailing', 'bold'],
      ['__b__', 'b'],
      ['**a*b*c**', 'a*b*c'],
      ['**a_b_c**', 'a_b_c']
    ])('should match valid syntax "%s" and capture "%s"', (input, expectedCapture) => {
      const match = boldInstance.pattern.exec(input)
      expect(match).not.toBeNull()
      expect(match[2]).toBe(expectedCapture) // Group 2 captures the content
      boldInstance.pattern.lastIndex = 0 // Reset regex state for next test in loop
    })

    it.each([
      ['*bold text*'],
      ['_bold text_'],
      ['**bold text_'], // Mismatched delimiters
      ['** no space allowed**'],
      ['__ no space allowed__'],
      ['** '], // space only content
      ['__ '], // space only content for underscore
      ['****'], // Empty content
      ['____'], // Empty content for underscore
      ['**a '], // trailing space
      ['__a __'] // trailing space
    ])('should not match invalid syntax "%s"', (input) => {
      boldInstance.pattern.lastIndex = 0 // Reset before exec
      expect(boldInstance.pattern.exec(input)).toBeNull()
    })

    it('should be a global regex (g flag)', () => {
      expect(boldInstance.pattern.global).toBe(true)
    })
  })

  describe('getAction().action', () => {
    let boldInstance
    let actionFn

    beforeEach(() => {
      boldInstance = new Bold(mockQuillJS)
      actionFn = boldInstance.getAction().action
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.clearAllTimers()
      jest.useRealTimers()
    })

    it('should process valid **bold** input, call Quill methods, and resolve true', async () => {
      const text = 'prefix **bold content** suffix'
      const selection = {} // Not directly used by this action's logic, but part of API
      const pattern = boldInstance.pattern // exec is called on this
      const lineStart = 10 // Arbitrary line start index

      pattern.lastIndex = 0
      const currentMatch = pattern.exec(text)
      expect(currentMatch).not.toBeNull() // Ensure we have a match to pass

      // Call actionFn with the match object
      const promise = actionFn(currentMatch, selection, lineStart)
      jest.runAllTimers()
      const result = await promise

      expect(result).toBe(true)

      // Use properties from currentMatch for expectations
      const expectedAnnotatedText = currentMatch[0]
      const expectedMatchedText = currentMatch[2]
      const expectedStartIndex = lineStart + currentMatch.index

      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(expectedStartIndex, expectedAnnotatedText.length)
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(expectedStartIndex, expectedMatchedText, { bold: true })
      expect(mockQuillJS.format).toHaveBeenCalledWith('bold', false) // Key check for this tag
    })

    it('should process valid __bold__ input correctly', async () => {
      const text = '__another bold__'
      const selection = {}
      const pattern = boldInstance.pattern
      const lineStart = 0
      pattern.lastIndex = 0
      const currentMatch = pattern.exec(text)
      expect(currentMatch).not.toBeNull()

      // Call actionFn with the match object
      const promise = actionFn(currentMatch, selection, lineStart)
      jest.runAllTimers()
      await promise

      // Use properties from currentMatch for expectations
      const expectedAnnotatedText = currentMatch[0]
      const expectedMatchedText = currentMatch[2]
      const expectedStartIndex = lineStart + currentMatch.index

      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(expectedStartIndex, expectedAnnotatedText.length)
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(expectedStartIndex, expectedMatchedText, { bold: true })
      expect(mockQuillJS.format).toHaveBeenCalledWith('bold', false)
    })

    it('should resolve false if text consists only of formatting characters like ** or __', async () => {
      const textOnlyChars = '** **' // This will not match the new regex pattern due to spaces
      const lineStart = 0
      boldInstance.pattern.lastIndex = 0 // ensure fresh match
      const currentMatch = boldInstance.pattern.exec(textOnlyChars)
      // With the new regex, currentMatch for '** **' should be null.
      // The action also has `matchedText.trim() === ''` check.

      // If currentMatch is null, actionFn would receive null.
      const promise = actionFn(currentMatch, {}, lineStart)
      const result = await promise

      expect(result).toBe(false)
      expect(mockQuillJS.deleteText).not.toHaveBeenCalled()
    })

    it('should resolve false if text is like "____" ', async () => {
      const textOnlyChars = '____' // This will not match the new regex (no content)
      const lineStart = 0
      boldInstance.pattern.lastIndex = 0
      const currentMatch = boldInstance.pattern.exec(textOnlyChars)
      // currentMatch for '____' should be null with new regex.

      const promise = actionFn(currentMatch, {}, lineStart)
      const result = await promise
      expect(result).toBe(false)
    })

    it('should resolve false if activeTags is empty', async () => {
      const instanceWithNoActiveTags = new Bold(mockQuillJS, { ignoreTags: ['bold'] })
      const actionFnWithNoActiveTags = instanceWithNoActiveTags.getAction().action
      const text = '**valid**' // This text would normally produce a match
      const lineStart = 0
      instanceWithNoActiveTags.pattern.lastIndex = 0
      const currentMatch = instanceWithNoActiveTags.pattern.exec(text)
      expect(currentMatch).not.toBeNull()

      const promise = actionFnWithNoActiveTags(currentMatch, {}, lineStart)
      const result = await promise

      expect(result).toBe(false)
      expect(mockQuillJS.deleteText).not.toHaveBeenCalled()
    })

    // Note: The original regex /(\*|_){2}(.+?)(?:\1){2}/g uses pattern.exec(text) which means
    // `pattern` argument in action(text, selection, pattern, lineStart) is THE regex object itself.
    // So `pattern.exec` is stateful if `g` flag is used. Tests must reset `pattern.lastIndex = 0`
    // if `exec` is called multiple times on the same regex instance across different logical tests
    // or within loops, OR ensure a fresh regex instance or non-global regex for specific unit tests.
    // The current structure passes `boldInstance.pattern` which is stateful.
  })
})
