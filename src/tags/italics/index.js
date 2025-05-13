import AbstractTag from '../AbstractTag.js'
import meta from './meta.js'

class Italics extends AbstractTag {
  constructor (quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'italic'
    this.pattern = this._getCustomPatternOrDefault(options, this.name, /(?:(?<!\*)\*(?<text1s>[^\s*_](?:.*[^\s*_])?|[^\s*_])\*(?!\*)|(?<!_)_(?<text1u>[^\s*_](?:.*[^\s*_])?|[^\s*_])_(?!_)|(?<d3>\*|_){3}(?<text3>[^*_]*)\k<d3>{3})/g)
    this.getAction.bind(this)
    this._meta = meta()
    this.activeTags = this._getActiveTagsWithoutIgnore(this._meta.applyHtmlTags, options.ignoreTags)
  }

  getAction () {
    return {
      name: this.name,
      pattern: this.pattern,
      action: (match, selection, lineStart) => new Promise((resolve) => {
        if (!match || !this.activeTags.length) {
          resolve(false)
          return
        }

        const annotatedText = match[0]
        let content

        if (match.groups) {
          if (match.groups.text1s !== undefined) {
            content = match.groups.text1s
          } else if (match.groups.text1u !== undefined) {
            content = match.groups.text1u
          } else if (match.groups.text3 !== undefined) {
            content = match.groups.text3
          }
        }

        if (content === undefined) {
          if (match.groups && match.groups.text3 === '') {
            content = ''
          } else {
            resolve(false)
            return
          }
        }

        const startIndex = lineStart + match.index

        setTimeout(() => {
          let actualDeleteStart = startIndex
          let actualDeleteLength = annotatedText.length

          if (match.index > 0 && annotatedText.startsWith(' ')) {
            actualDeleteStart = startIndex + 1
            actualDeleteLength = annotatedText.length - 1
          }

          this.quillJS.deleteText(actualDeleteStart, actualDeleteLength)
          this.quillJS.insertText(actualDeleteStart, content, { italic: true })
          this.quillJS.format('italic', false)
          resolve(true)
        }, 0)
      })
    }
  }
}

export default Italics
