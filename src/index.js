import katex from 'katex';

const cjkPunctuation = '、。，．・！？（）｟｠「」『』｛｝［］〔〕〘〙〈〉《》【】〖〗｜：';

function replacePlaceholder(regexp) {
  return new RegExp(regexp.source.replace('CJK_PUNCTUATION', cjkPunctuation));
}

const inlineStartRule = replacePlaceholder(/(?<=[CJK_PUNCTUATION\s]|^)\${1,2}(?!\$)/);
const inlineRule = replacePlaceholder(/^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\1(?=[\s?!\.,:CJK_PUNCTUATION]|$)/);
const blockRule = /^(\${1,2})\n((?:\\[^]|[^\\])+?)\n\1(?:\n|$)/;

export default function(options = {}) {
  return {
    extensions: [
      inlineKatex(options, createRenderer(options, false)),
      blockKatex(options, createRenderer(options, true))
    ]
  };
}

function createRenderer(options, newlineAfter) {
  return (token) => katex.renderToString(token.text, { ...options, displayMode: token.displayMode }) + (newlineAfter ? '\n' : '');
}

function inlineKatex(options, renderer) {
  return {
    name: 'inlineKatex',
    level: 'inline',
    start(src) {
      let index;
      let indexSrc = src;

      while (indexSrc) {
        index = indexSrc.indexOf('$');
        if (index === -1) {
          return;
        }

        const startMatch = indexSrc.match(inlineStartRule);
        if (startMatch && startMatch.index === index) {
          const possibleKatex = indexSrc.substring(index);

          if (possibleKatex.match(inlineRule)) {
            return index;
          }
        }

        indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, '');
      }
    },
    tokenizer(src, tokens) {
      const match = src.match(inlineRule);
      if (match) {
        return {
          type: 'inlineKatex',
          raw: match[0],
          text: match[2].trim(),
          displayMode: match[1].length === 2
        };
      }
    },
    renderer
  };
}

function blockKatex(options, renderer) {
  return {
    name: 'blockKatex',
    level: 'block',
    tokenizer(src, tokens) {
      const match = src.match(blockRule);
      if (match) {
        return {
          type: 'blockKatex',
          raw: match[0],
          text: match[2].trim(),
          displayMode: match[1].length === 2
        };
      }
    },
    renderer
  };
}
