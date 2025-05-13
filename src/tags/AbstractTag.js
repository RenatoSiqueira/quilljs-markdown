class AbstractTag {
  _getCustomPatternOrDefault (options, tagName, defaultPattern) {
    return options.tags && options.tags[tagName] && options.tags[tagName].pattern ? options.tags[tagName].pattern : defaultPattern
  }

  _getActiveTagsWithoutIgnore (tags, ignoreTags) {
    if (Array.isArray(ignoreTags)) {
      const lowerIgnoreTags = ignoreTags.map(t => t.toLowerCase())
      return tags.reduce((allowTags, tag) => {
        const lowerTag = tag.toLowerCase()
        if (!lowerIgnoreTags.includes(lowerTag)) {
          allowTags.push(lowerTag)
        }
        return allowTags
      }, [])
    }
    return tags
  }
}

export default AbstractTag
