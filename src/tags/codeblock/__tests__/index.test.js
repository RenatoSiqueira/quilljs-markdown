import Codeblock from '../index.js'
// import meta from '../meta.js'; // meta is implicitly used by Codeblock constructor

describe('Codeblock Tag', () => {
  let mockQuillJS
  // codeblockInstance will be initialized in beforeEach or within describe blocks
  // let codeblockInstance;

  beforeEach(() => {
    mockQuillJS = {
      getLine: jest.fn(),
      deleteText: jest.fn(),
      insertText: jest.fn(),
      formatLine: jest.fn(),
      setSelection: jest.fn(),
      getSelection: jest.fn(),
      format: jest.fn() // Added for release tests
      // Note: if Quill methods return Promises, mocks should return Promises:
      // e.g., deleteText: jest.fn().mockResolvedValue(true),
    }
  })

  describe('Constructor', () => {
    it('should initialize with default name, pattern, and activeTags if no options are provided', () => {
      const codeblockInstance = new Codeblock(mockQuillJS)
      expect(codeblockInstance.name).toBe('pre')
      expect(codeblockInstance.pattern).toEqual(/^(```).*/g)
      // Based on src/tags/codeblock/meta.js, applyHtmlTags is ['pre']
      expect(codeblockInstance.activeTags).toEqual(['pre'])
    })

    it('should use custom pattern from options if provided', () => {
      const customPattern = /^(custom```).*/g
      const codeblockInstance = new Codeblock(mockQuillJS, {
        tags: { pre: { pattern: customPattern } }
      })
      expect(codeblockInstance.pattern).toEqual(customPattern)
    })

    it('should correctly determine activeTags based on options.ignoreTags', () => {
      // meta() for Codeblock returns { applyHtmlTags: ['pre'] }
      const options = { ignoreTags: ['pre'] }
      const codeblockInstance = new Codeblock(mockQuillJS, options)
      expect(codeblockInstance.activeTags).toEqual([]) // 'pre' is ignored
    })

    it('should keep activeTags if ignoreTags does not include its tags', () => {
      const options = { ignoreTags: ['code'] } // 'pre' is not in ignoreTags
      const codeblockInstance = new Codeblock(mockQuillJS, options)
      expect(codeblockInstance.activeTags).toEqual(['pre'])
    })
  })

  describe('Pattern', () => {
    let codeblockInstance
    beforeEach(() => {
      codeblockInstance = new Codeblock(mockQuillJS)
    })

    it('should match valid code block syntax: ```text', () => {
      const pattern = codeblockInstance.pattern
      pattern.lastIndex = 0 // Reset for exec
      const match = pattern.exec('```javascript')
      expect(match).not.toBeNull()
      expect(match[0]).toBe('```javascript')
      expect(match[1]).toBe('```')
    })

    it('should match valid code block syntax: ```', () => {
      const pattern = codeblockInstance.pattern
      pattern.lastIndex = 0 // Reset for exec
      const match = pattern.exec('```')
      expect(match).not.toBeNull()
      expect(match[0]).toBe('```')
      expect(match[1]).toBe('```')
    })

    it('should not match if ``` is not at the beginning of the string', () => {
      const pattern = codeblockInstance.pattern
      pattern.lastIndex = 0 // Reset for exec
      expect(pattern.exec('  ```javascript')).toBeNull()
    })

    it('should be a global regex (g flag)', () => {
      expect(codeblockInstance.pattern.global).toBe(true)
    })
  })

  describe('getAction().action', () => {
    let codeblockInstance
    let actionFn

    beforeEach(() => {
      codeblockInstance = new Codeblock(mockQuillJS)
      actionFn = codeblockInstance.getAction().action

      // Default mock implementations
      // Important: getLine in Quill can return a Blot or null. If it's a Blot, it has a domNode.
      // For the action, it expects getLine to return [lineBlot, offsetWithinBlot]
      // lineBlot should have a domNode with textContent.
      // Let's assume selection.index points to the start of a line containing the matched text.
      // So, offsetWithinLine (cursorOffsetInLine) would be 0 if selection.index is at the line's start.
      mockQuillJS.getLine.mockReturnValue([{ domNode: { textContent: '```js' } }, 0])
      mockQuillJS.getSelection.mockReturnValue({ index: 0, length: 0 }) // Default selection
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.clearAllTimers()
      jest.useRealTimers()
    })

    it('should process input, call Quill methods, and resolve true for valid input with content', async () => {
      const text = '```js some code' // This is the text passed to the action (simulating current line content)
      const selection = { index: 0 } // Quill's current selection { index, length }
      const pattern = codeblockInstance.pattern // The regex for the tag

      // Setup mocks for this specific test case
      // getLine is called with selection.index (0).
      // It should return the line blot and the offset of selection.index within that line.
      // If `text` is the entire line content, and selection.index is 0, then offsetInLine is 0.
      mockQuillJS.getLine.mockReturnValue([{ domNode: { textContent: text } }, 0])

      const promise = actionFn(text, selection, pattern)
      jest.runAllTimers() // Execute all setTimeout(..., 0) calls
      const result = await promise

      expect(result).toBe(true)

      // Calculations inside action:
      // const [lineNode, cursorOffsetInLine] = this.quillJS.getLine(selection.index); -> lineNode, 0
      // const lineStartIndex = selection.index - cursorOffsetInLine; -> 0 - 0 = 0
      // const matchResult = pattern.exec(text); -> ['```js some code', '```', index: 0, ...]
      // const absoluteStartIndex = lineStartIndex + matchResult.index; -> 0 + 0 = 0
      // const fullMatchedString = matchResult[0]; -> "```js some code"
      // const content = fullMatchedString.substring(3); -> "js some code"

      const expectedContent = 'js some code'
      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(0, text.length)
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(0, expectedContent + '\n')
      expect(mockQuillJS.formatLine).toHaveBeenCalledWith(0, 1, 'code-block', true)
      expect(mockQuillJS.setSelection).toHaveBeenCalledWith(0 + expectedContent.length, 0)
    })

    it('should correctly handle empty content after ``` (e.g., "```" as input)', async () => {
      const text = '```'
      const selection = { index: 0 }
      const pattern = codeblockInstance.pattern
      mockQuillJS.getLine.mockReturnValue([{ domNode: { textContent: text } }, 0])

      const promise = actionFn(text, selection, pattern)
      jest.runAllTimers()
      const result = await promise

      expect(result).toBe(true)
      // content = "".substring(3) -> ""
      expect(mockQuillJS.deleteText).toHaveBeenCalledWith(0, text.length)
      expect(mockQuillJS.insertText).toHaveBeenCalledWith(0, '\n') // Inserts a newline
      expect(mockQuillJS.formatLine).toHaveBeenCalledWith(0, 1, 'code-block', true)
      expect(mockQuillJS.setSelection).toHaveBeenCalledWith(0, 0) // Selection at the start of the new line
    })

    it('should resolve false if pattern does not match the provided text', async () => {
      const text = 'not a code block'
      const selection = { index: 0 }
      const pattern = codeblockInstance.pattern // This pattern won't match 'text'

      const result = await actionFn(text, selection, pattern)
      // No timers needed if it bails out early

      expect(result).toBe(false)
      expect(mockQuillJS.deleteText).not.toHaveBeenCalled()
    })

    it('should resolve false if activeTags is empty', async () => {
      // Re-initialize Codeblock with options that make activeTags empty
      const instanceWithNoActiveTags = new Codeblock(mockQuillJS, { ignoreTags: ['pre'] })
      const actionFnWithNoActiveTags = instanceWithNoActiveTags.getAction().action

      const text = '```some code'
      const selection = { index: 0 }
      const pattern = instanceWithNoActiveTags.pattern
      mockQuillJS.getLine.mockReturnValue([{ domNode: { textContent: text } }, 0])

      const result = await actionFnWithNoActiveTags(text, selection, pattern)

      expect(result).toBe(false)
      expect(mockQuillJS.deleteText).not.toHaveBeenCalled()
    })
  })

  describe('getAction().release', () => {
    let codeblockInstance
    let releaseFn

    beforeEach(() => {
      codeblockInstance = new Codeblock(mockQuillJS)
      releaseFn = codeblockInstance.getAction().release
      jest.useFakeTimers() // Use fake timers for release tests
    })

    afterEach(() => {
      jest.clearAllTimers()
      jest.useRealTimers()
    })

    it('should call quillJS.format("code-block", false) if block is empty or only newline', () => {
      mockQuillJS.getSelection.mockReturnValue({ index: 5, length: 0 }) // Cursor position
      // Simulate an empty line
      const mockLineNode = { domNode: { textContent: '\n' } }
      mockQuillJS.getLine.mockReturnValue([mockLineNode, 0]) // [lineBlot, offsetInLine]

      releaseFn()
      jest.runAllTimers() // Ensure setTimeout in release runs

      expect(mockQuillJS.format).toHaveBeenCalledWith('code-block', false)
    })

    it('should call quillJS.format("code-block", false) if block is empty (no newline char)', () => {
      mockQuillJS.getSelection.mockReturnValue({ index: 5, length: 0 })
      const mockLineNode = { domNode: { textContent: '' } } // Empty text content
      mockQuillJS.getLine.mockReturnValue([mockLineNode, 0])

      releaseFn()
      jest.runAllTimers()

      expect(mockQuillJS.format).toHaveBeenCalledWith('code-block', false)
    })

    it('should not call quillJS.format if block has content', () => {
      mockQuillJS.getSelection.mockReturnValue({ index: 5, length: 0 })
      const mockLineNode = { domNode: { textContent: 'some text\n' } }
      mockQuillJS.getLine.mockReturnValue([mockLineNode, 0])

      releaseFn()
      jest.runAllTimers()

      expect(mockQuillJS.format).not.toHaveBeenCalled()
    })

    it('should not call quillJS.format if getLine returns null for the block', () => {
      mockQuillJS.getSelection.mockReturnValue({ index: 5, length: 0 })
      mockQuillJS.getLine.mockReturnValue([null, 0]) // Simulate block not found

      releaseFn()
      jest.runAllTimers()

      expect(mockQuillJS.format).not.toHaveBeenCalled()
    })

    it('should not throw if block.domNode is missing (robustness)', () => {
      mockQuillJS.getSelection.mockReturnValue({ index: 5, length: 0 })
      const mockLineNodeWithoutDomNode = {} // Missing domNode
      mockQuillJS.getLine.mockReturnValue([mockLineNodeWithoutDomNode, 0])

      expect(() => {
        releaseFn()
        jest.runAllTimers()
      }).not.toThrow()
      expect(mockQuillJS.format).not.toHaveBeenCalled() // Should also not format
    })
  })
})
