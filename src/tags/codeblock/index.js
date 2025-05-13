import AbstractTag from '../AbstractTag.js'
import meta from './meta.js'

class Codeblock extends AbstractTag {
  constructor(quillJS, options = {}) {
    super()
    this.quillJS = quillJS
    this.name = 'pre'
    this.pattern = this._getCustomPatternOrDefault(options, this.name, /^(```).*/g)
    this.getAction.bind(this)
    this._meta = meta()
    this.activeTags = this._getActiveTagsWithoutIgnore(this._meta.applyHtmlTags, options.ignoreTags)
  }

  getAction() {
    return {
      name: this.name,
      pattern: this.pattern,
      action: (text, selection, pattern) => new Promise((resolve) => {
        const matchResult = pattern.exec(text);
        if (!matchResult || !this.activeTags.length) {
          resolve(false);
          return;
        }

        const fullMatchedString = matchResult[0];
        const content = fullMatchedString.substring(3);

        setTimeout(() => {
          const [lineNode, cursorOffsetInLine] = this.quillJS.getLine(selection.index);
          const lineStartIndex = selection.index - cursorOffsetInLine;
          const absoluteStartIndex = lineStartIndex + matchResult.index;

          this.quillJS.deleteText(absoluteStartIndex, fullMatchedString.length);

          setTimeout(() => {
            if (content.trim() === '') {
              this.quillJS.insertText(absoluteStartIndex, '\n');
              this.quillJS.formatLine(absoluteStartIndex, 1, 'code-block', true);
              this.quillJS.setSelection(absoluteStartIndex, 0);
            } else {
              this.quillJS.insertText(absoluteStartIndex, content + '\n');
              this.quillJS.formatLine(absoluteStartIndex, 1, 'code-block', true);
              this.quillJS.setSelection(absoluteStartIndex + content.length, 0);
            }
            resolve(true);
          }, 0);
        }, 0);
      }),
      release: () => {
        setTimeout(() => {
          const cursorIndex = this.quillJS.getSelection().index
          const block = this.quillJS.getLine(cursorIndex)[0]
          const blockText = block.domNode.textContent
          if (block && blockText && blockText.replace('\n', '').length <= 0) {
            this.quillJS.format('code-block', false)
          }
        }, 0)
      }
    }
  }
}

export default Codeblock
