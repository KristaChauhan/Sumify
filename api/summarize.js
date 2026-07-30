import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

// Common English words to ignore when scoring sentence importance
const STOPWORDS = new Set(
  "a an the and or but if then else when at by for with about against between into through during before after above below to from up down in out on off over under again further once here there all any both each few more most other some such no nor not only own same so than too very s t can will just don should now is are was were be been being have has had do does did".split(
    " "
  )
);

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function splitIntoSentences(text) {
  return (
    text
      .replace(/[↑↓]|\[\s*\d+\s*\]|\[edit\]|\[citation needed\]/gi, " ")
      .replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]+/g)
      ?.map((s) => s.trim())
      .filter((s) => {
        const wordCount = s.split(/\s+/).length;
        const looksLikeCitation =
          /archived from|retrieved \w+ \d|isbn|doi:|www\.|\.com|\.org|\|/i.test(
            s
          );
        return s.length > 40 && wordCount >= 8 && !looksLikeCitation;
      }) || []
  );
}

function summarize(text, sentenceCount = 4) {
  const sentences = splitIntoSentences(text);
  if (sentences.length <= sentenceCount) return sentences.join(" ");

  const freq = {};
  sentences.forEach((sentence) => {
    sentence
      .toLowerCase()
      .match(/[a-z']+/g)
      ?.forEach((word) => {
        if (!STOPWORDS.has(word) && word.length > 2) {
          freq[word] = (freq[word] || 0) + 1;
        }
      });
  });

  const scored = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/[a-z']+/g) || [];
    const score =
      words.reduce((sum, word) => sum + (freq[word] || 0), 0) /
      (words.length || 1);
    return { sentence, score, index };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .sort((a, b) => a.index - b.index);

  return top.map((s) => s.sentence).join(" ");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter." });
  }

  try {
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    if (!pageResponse.ok) {
      return res
        .status(422)
        .json({ error: `Could not fetch that URL (status ${pageResponse.status}).` });
    }

    const html = await pageResponse.text();
    const { document } = parseHTML(html);
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return res
        .status(422)
        .json({ error: "Could not extract article content from that URL." });
    }

    const plainText = decodeEntities(article.textContent)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);

    if (!plainText) {
      return res
        .status(422)
        .json({ error: "Extracted article had no readable text." });
    }

    const summary = summarize(plainText, 4);

    if (!summary) {
      return res
        .status(422)
        .json({ error: "Could not generate a summary for this article." });
    }

    return res.status(200).json({ summary, title: article.title || null });
  } catch (err) {
    console.error("summarize error:", err);
    return res.status(500).json({
      error: err?.message || "Something went wrong while summarizing.",
    });
  }
}
