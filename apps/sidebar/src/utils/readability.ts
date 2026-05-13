import { Readability } from '@mozilla/readability';
export function extractArticle(doc: Document) {
  const reader = new Readability(doc.cloneNode(true) as Document);
  const article = reader.parse();
  return article;
}