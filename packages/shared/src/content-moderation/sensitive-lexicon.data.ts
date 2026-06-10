import type { SensitiveLexiconCache, SensitiveLexiconEntry } from "../low-cost-content-moderation";

const entries = [
  entry("强奸", "sexual_violence", "high", "pornography"),
  entry("強奸", "sexual_violence", "high", "pornography"),
  entry("轮奸", "sexual_violence", "high", "pornography"),
  entry("迷奸", "sexual_violence", "high", "pornography"),
  entry("猥亵", "sexual_violence", "high", "pornography"),
  entry("强暴", "sexual_violence", "high", "pornography"),
  entry("涉黄", "pornography", "high", "pornography"),
  entry("色情", "pornography", "high", "pornography"),
  entry("黄图", "pornography", "high", "pornography"),
  entry("黄片", "pornography", "high", "pornography"),
  entry("裸聊", "pornography", "high", "pornography"),
  entry("约炮", "pornography", "high", "pornography"),
  entry("奶子", "pornography", "high", "pornography"),
  entry("黄虫", "pornography", "medium", "pornography"),
  entry("杀人", "violence", "high", "violence"),
  entry("砍死", "violence", "high", "violence"),
  entry("弄死", "violence", "high", "violence"),
  entry("草你妈", "abuse", "high", "abuse"),
  entry("操你妈", "abuse", "high", "abuse"),
  entry("傻逼", "abuse", "high", "abuse"),
  entry("煞笔", "abuse", "high", "abuse"),
  entry("nmsl", "abuse", "high", "abuse"),
  entry("身份证", "privacy", "high", "privacy_leak"),
  entry("银行卡号", "privacy", "high", "privacy_leak"),
  entry("开户地址", "illegal", "high", "illegal"),
  entry("加微信", "advertisement", "medium", "advertisement"),
  entry("私聊返利", "advertisement", "medium", "advertisement"),
  entry("推广链接", "advertisement", "medium", "advertisement"),
  entry("开户链接", "advertisement", "medium", "advertisement"),
  entry("tg群", "advertisement", "medium", "advertisement"),
  entry("电报群", "advertisement", "medium", "advertisement"),
  entry("涉政", "politics", "medium", "politics"),
  entry("灰区", "ambiguous", "medium", "ambiguous"),
  entry("可能违规", "ambiguous", "medium", "ambiguous")
] as const;

export const SENSITIVE_LEXICON_CACHE: SensitiveLexiconCache = {
  version: 1,
  sourceRepository: "https://github.com/konsheng/Sensitive-lexicon",
  sourceLicense: "MIT",
  syncedAt: "2026-05-27T00:00:00.000Z",
  entryCount: entries.length,
  categories: [...new Set(entries.map((item) => item.category))],
  entries
};

function entry(
  term: string,
  category: string,
  riskLevel: SensitiveLexiconEntry["riskLevel"],
  riskTag: SensitiveLexiconEntry["riskTag"]
): SensitiveLexiconEntry {
  return {
    term,
    normalizedTerm: normalizeText(term),
    category,
    riskLevel,
    riskTag
  };
}

function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u200b-\u200f\ufeff]+/g, "")
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]/gu, "");
}
