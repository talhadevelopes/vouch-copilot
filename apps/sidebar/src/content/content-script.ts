import { extractArticle } from "../utils/readability";
import { highlightText } from "./highlighter";

type ExtractMethod = "readability" | "selectors" | "bodyInnerText";

type PageExtractedPayload = {
  title: string;
  textContent: string;
  url: string;
  wordCount: number;
  isArticle: boolean;
  extractionMethod: ExtractMethod;
};

function countWords(text: string) {
  const trimmed = (text || "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function getTextFromSelectors(selectors: string[]) {
  const parts: string[] = [];

  for (const sel of selectors) {
    const nodes = document.querySelectorAll(sel);
    for (const node of Array.from(nodes)) {
      const t = node.textContent || "";
      const cleaned = t.replace(/\s+/g, " ").trim();
      if (cleaned) parts.push(cleaned);
    }
  }

  return parts.join(" ");
}

async function init() {

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "HIGHLIGHT_TEXT") {
      highlightText(message.text);
    }
  });

  const url = window.location.href;
  const fallbackTitle = document.title || "";

  // 1) Try Readability first (on cloned document inside extractArticle()).
  let readabilitySucceeded = false;
  let readabilityText = "";
  let readabilityWordCount = 0;
  let readabilityTitle: string | undefined;

  try {
    const article = extractArticle(document);
    if (article && typeof article.textContent === "string") {
      readabilitySucceeded = true;
      readabilityTitle = article.title;
      readabilityText = article.textContent || "";
      readabilityWordCount = countWords(readabilityText);
    }
  } catch (err) {
  }

  // 2) If Readability returns < 500 words, fall back to generic selectors.
  const selectorList = [
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "li",
    "td",
    "code",
    "pre",
    "article",
    "section",
    "main",
    '[role="main"]',
    '[role="article"]',
  ];

  const selectorsText = getTextFromSelectors(selectorList);
  const selectorsWordCount = countWords(selectorsText);

  // 3) Final fallback: document.body.innerText (used when selectors are still too small).
  const bodyText = (document.body?.innerText || "").trim();
  const bodyWordCount = countWords(bodyText);

  let extractionMethod: ExtractMethod = "readability";
  let chosenText = readabilityText;
  let chosenWordCount = readabilityWordCount;

  if (readabilityWordCount >= 500) {
    extractionMethod = "readability";
    chosenText = readabilityText;
    chosenWordCount = readabilityWordCount;
  } else if (selectorsWordCount < 200) {
    extractionMethod = "bodyInnerText";
    chosenText = bodyText;
    chosenWordCount = bodyWordCount;
  } else {
    if (bodyWordCount > selectorsWordCount) {
      extractionMethod = "bodyInnerText";
      chosenText = bodyText;
      chosenWordCount = bodyWordCount;
    } else {
      extractionMethod = "selectors";
      chosenText = selectorsText;
      chosenWordCount = selectorsWordCount;
    }
  }

  // Extra heuristics to avoid misclassifying chat apps as articles.
  const hasArticleElement = !!document.querySelector('article, [role="article"]');
  const hasEditorialMeta = !!document.querySelector(
    'meta[property="article:published_time"], meta[name="author"], meta[property="og:type"][content*="article"]',
  );

  const isArticle =
    readabilitySucceeded &&
    readabilityWordCount >= 500 &&
    (hasArticleElement || hasEditorialMeta);

  const pageData: PageExtractedPayload = {
    title: readabilityTitle || fallbackTitle,
    textContent: chosenText || "",
    url,
    wordCount: chosenWordCount,
    isArticle,
    extractionMethod,
  };

  chrome.runtime.sendMessage({ type: "PAGE_EXTRACTED", payload: pageData }, () => {
    if (chrome.runtime.lastError) {
      
    }
  });

  // Note: We intentionally do NOT highlight anything automatically on page load.
  // Highlights are triggered only by explicit user actions (e.g. clicking a claim title,
  // or a chat answer selecting a source sentence).
}

if (document.readyState === "complete") {
  init();
} else {
  window.addEventListener("load", init);
}