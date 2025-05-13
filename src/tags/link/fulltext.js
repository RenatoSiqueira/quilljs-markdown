import AbstractTag from '../AbstractTag.js'
import meta from './meta.js'

class Link extends AbstractTag {
  constructor(quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'link'
    this.pattern = this._getCustomPatternOrDefault(options, this.name, /(?:\[(.+?)\])(?:\((.+?)\))/g)
    this.getAction.bind(this)
    this._meta = meta()
    this.activeTags = this._getActiveTagsWithoutIgnore(this._meta.applyHtmlTags, options.ignoreTags)
  }

  getAction() {
    return {
      name: this.name,
      pattern: this.pattern,
      action: (text, selection, pattern) => new Promise((resolve) => {
        const currentMatch = pattern.exec(text);
        if (!currentMatch) {
          resolve(false);
          return;
        }

        const matchedText = currentMatch[0];
        const hrefTextContent = currentMatch[1];
        const hrefLinkUrl = currentMatch[2];

        const matchIndexInText = currentMatch.index;

        if (!this.activeTags.length) {
          resolve(false);
          return;
        }

        const removeOffset = selection.index + matchIndexInText;

        setTimeout(() => {
          this.quillJS.deleteText(removeOffset, matchedText.length);
          this.quillJS.insertText(removeOffset, hrefTextContent, 'link', hrefLinkUrl);
          resolve(true);
        }, 0);
      })
    };
  }
}

export default Link
