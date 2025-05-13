import AbstractTag from '../AbstractTag.js'

describe('AbstractTag', () => {
  let abstractTagInstance

  beforeEach(() => {
    // AbstractTag is a class with methods, not typically instantiated directly
    // unless it has a constructor and instance methods to test.
    // Here, its methods are static-like helpers used by subclasses.
    // We can test them by creating a dummy class or calling them on a prototype.
    // Or, more simply, just test them as if they were static,
    // as they don't rely on 'this' in a way that requires complex setup.
    // For the purpose of these tests, we'll create a simple instance.
    abstractTagInstance = new AbstractTag()
  })

  describe('_getCustomPatternOrDefault', () => {
    const defaultPattern = /default/g
    const tagName = 'myTag'

    it('should return defaultPattern if options.tags is undefined', () => {
      const options = {}
      expect(abstractTagInstance._getCustomPatternOrDefault(options, tagName, defaultPattern)).toBe(defaultPattern)
    })

    it('should return defaultPattern if options.tags[tagName] is undefined', () => {
      const options = { tags: {} }
      expect(abstractTagInstance._getCustomPatternOrDefault(options, tagName, defaultPattern)).toBe(defaultPattern)
    })

    it('should return defaultPattern if options.tags[tagName].pattern is undefined', () => {
      const options = { tags: { [tagName]: {} } }
      expect(abstractTagInstance._getCustomPatternOrDefault(options, tagName, defaultPattern)).toBe(defaultPattern)
    })

    it('should return custom pattern if provided in options', () => {
      const customPattern = /custom/g
      const options = { tags: { [tagName]: { pattern: customPattern } } }
      expect(abstractTagInstance._getCustomPatternOrDefault(options, tagName, defaultPattern)).toBe(customPattern)
    })
  })

  describe('_getActiveTagsWithoutIgnore', () => {
    const allTags = ['Bold', 'Italic', 'Underline']

    it('should return all tags if ignoreTags is not an array', () => {
      expect(abstractTagInstance._getActiveTagsWithoutIgnore(allTags, null)).toEqual(allTags)
      expect(abstractTagInstance._getActiveTagsWithoutIgnore(allTags, undefined)).toEqual(allTags)
      expect(abstractTagInstance._getActiveTagsWithoutIgnore(allTags, 'Bold')).toEqual(allTags)
    })

    it('should return all tags (lowercased) if ignoreTags is an empty array', () => {
      expect(abstractTagInstance._getActiveTagsWithoutIgnore(allTags, [])).toEqual(['bold', 'italic', 'underline'])
    })

    it('should return filtered tags (lowercased) based on ignoreTags', () => {
      const ignoreTags = ['Italic', 'NonExistent']
      expect(abstractTagInstance._getActiveTagsWithoutIgnore(allTags, ignoreTags)).toEqual(['bold', 'underline'])
    })

    it('should be case-insensitive for ignoreTags matching', () => {
      const ignoreTags = ['italic'] // lowercase ignoreTag
      expect(abstractTagInstance._getActiveTagsWithoutIgnore(allTags, ignoreTags)).toEqual(['bold', 'underline'])
    })

    it('should return an empty array if all tags are ignored', () => {
      const ignoreTags = ['Bold', 'Italic', 'Underline']
      expect(abstractTagInstance._getActiveTagsWithoutIgnore(allTags, ignoreTags)).toEqual([])
    })

    it('should handle an empty initial tags array', () => {
      expect(abstractTagInstance._getActiveTagsWithoutIgnore([], ['Bold'])).toEqual([])
    })
  })
})
