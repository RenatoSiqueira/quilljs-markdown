import AbstractTag from '../AbstractTag.js'
import meta from './meta.js'

class Bold extends AbstractTag {
  constructor (quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'bold'
    this.pattern = this._getCustomPatternOrDefault(options, this.name, /(\*|_){2}(?!\s)((?:[^*_\s]|(?:[^*_\s].*?[^*_\s])))(?<!\s)(?:\1){2}/g)
    this.getAction.bind(this)
    this._meta = meta()
    this.activeTags = this._getActiveTagsWithoutIgnore(this._meta.applyHtmlTags, options.ignoreTags)
  }

  getAction () {
    return {
      name: this.name,
      pattern: this.pattern,
      action: (match, selection, lineStart) => new Promise((resolve) => {
        if (!match || !match[0] || typeof match[2] === 'undefined') {
          resolve(false)
          return
        }

        const annotatedText = match[0]
        const matchedText = match[2]

        if (matchedText.trim() === '' || !this.activeTags.length) {
          resolve(false)
          return
        }

        const startIndex = lineStart + match.index

        setTimeout(() => {
          this.quillJS.deleteText(startIndex, annotatedText.length)
          setTimeout(() => {
            this.quillJS.insertText(startIndex, matchedText, { bold: true })
            this.quillJS.format('bold', false)
            resolve(true)
          })
        }, 0)
      })
    }
  }
}

export default Bold
