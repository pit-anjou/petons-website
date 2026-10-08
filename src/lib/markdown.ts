// Markdown des textes saisis dans Page CMS : **gras**, ==surligné vert==, ++surligné orange++.
// Les surlignages reprennent les classes soft-mark et orange-mark de la page Actualités.
import { Marked, type TokenizerAndRendererExtension } from 'marked';

const surlignage = (nom: string, marque: string, classe: string): TokenizerAndRendererExtension => {
  const motif = new RegExp(`^${marque}(?=\\S)([\\s\\S]*?\\S)${marque}`);
  return {
    name: nom,
    level: 'inline',
    start: (source) => source.indexOf(marque.replace(/\\/g, '')),
    tokenizer(source) {
      const trouve = motif.exec(source);
      if (!trouve) return undefined;
      return { type: nom, raw: trouve[0], tokens: this.lexer.inlineTokens(trouve[1]!) };
    },
    renderer(jeton) {
      return `<strong class="${classe}">${this.parser.parseInline(jeton.tokens!)}</strong>`;
    },
  };
};

const markdown = new Marked({
  extensions: [surlignage('surlignageVert', '==', 'soft-mark'), surlignage('surlignageOrange', '\\+\\+', 'orange-mark')],
});

/** Texte d’une ligne (étiquette, présentation…), sans paragraphe autour. */
export const enLigne = (texte: string): string => markdown.parseInline(texte, { async: false }) as string;

/** Texte en paragraphes. */
export const enBlocs = (texte: string): string => markdown.parse(texte, { async: false }) as string;
