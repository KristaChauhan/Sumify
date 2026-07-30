import { extract } from "@extractus/article-extractor";

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
      // strip footnote/citation markers like ↑ [1] [ 16 ] [edit] [citation needed]
      .replace(/[↑↓]|\[\s*\d+\s*\]|\[edit\]|\[citation needed\]/gi, " ")
      .replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]+/g)
      ?.map((s) => s.trim())
      // keep only sentences that read like real prose, not headings/citations/link titles
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

  // Build word frequency table (ignoring stopwords)
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

  // Score each sentence by the sum of its word frequencies, normalized by length
  const scored = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/[a-z']+/g) || [];
    const score =
      words.reduce((sum, word) => sum + (freq[word] || 0), 0) /
      (words.length || 1);
    return { sentence, score, index };
  });

  // Take the top-scoring sentences, then restore original article order
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
    const article = await extract(url);

    if (!article || !article.content) {
      return res
        .status(422)
        .json({ error: "Could not extract article content from that URL." });
    }

    const plainText = decodeEntities(
      article.content.replace(/<[^>]*>/g, " ")
    )
      .replace(/\s+/g, " ")
      .trim()
      // References/citations always sit at the end of the page — ignore them
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
