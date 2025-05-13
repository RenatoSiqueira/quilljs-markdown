import metaFunction from '../meta.js'

describe('Codeblock meta.js', () => {
  it('should return the expected meta object', () => {
    const options = {} // Example options, if metaFunction used them
    const meta = metaFunction(options)

    expect(meta).toBeDefined()
    expect(meta.applyHtmlTags).toBeInstanceOf(Array)
    expect(meta.applyHtmlTags).toEqual(['pre'])
  })

  it('should return tags in lowercase', () => {
    // Temporarily mock the source of tags if it could be uppercase
    // For the current meta.js, it already maps to lowercase, so this test confirms that behavior.
    const meta = metaFunction({})
    meta.applyHtmlTags.forEach(tag => {
      expect(tag).toBe(tag.toLowerCase())
    })
  })

  // Add more tests if metaFunction becomes more complex, e.g., uses options
})
