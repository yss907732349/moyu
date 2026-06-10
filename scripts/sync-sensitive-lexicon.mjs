import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { gzipSync, inflateRawSync } from "node:zlib";

const REPOSITORY = "https://github.com/konsheng/Sensitive-lexicon";
const LICENSE = "MIT";
const DEFAULT_OUTPUT_PATH = path.resolve(
  "apps/api/src/content-moderation/sensitive-lexicon.data.ts"
);
const MIN_ENTRY_COUNT = 10000;

const RISK_LEVEL_WEIGHT = {
  low: 1,
  medium: 2,
  high: 3
};

const CATEGORY_RULES = [
  {
    category: "sexual_violence",
    riskLevel: "high",
    riskTag: "pornography",
    pattern: /强奸|強奸|轮奸|輪姦|迷奸|猥亵|猥褻|强暴|強暴|性侵|强制发生关系/
  },
  {
    category: "pornography",
    riskLevel: "high",
    riskTag: "pornography",
    pattern:
      /色情|涉黄|黄片|黄图|黄网站|色情网站|裸聊|约炮|約炮|卖淫|嫖娼|奶子|爱液|愛液|口交|肛交|性交|性爱|做愛|做爱|自慰|撸管|撸撸|淫|无码|有码|AV片|成人视频|成人电影|成人网站|按摩棒|援交|包二奶/
  },
  {
    category: "weapon_explosive",
    riskLevel: "high",
    riskTag: "illegal",
    pattern: /枪|槍|子弹|子彈|炸药|炸藥|雷管|爆炸物|出售雷管|出售炸药/
  },
  {
    category: "violence",
    riskLevel: "high",
    riskTag: "violence",
    pattern: /杀人|殺人|砍死|弄死|灭口|滅口|放火烧|恐怖袭击|恐怖襲擊/
  },
  {
    category: "privacy",
    riskLevel: "high",
    riskTag: "privacy_leak",
    pattern: /身份证|身份證|银行卡|銀行卡|手机号|手機號|住址|开房记录|開房記錄/
  },
  {
    category: "illegal",
    riskLevel: "high",
    riskTag: "illegal",
    pattern: /赌博|賭博|博彩|诈骗|詐騙|洗钱|洗錢|开户|開戶|黑产|黑產/
  },
  {
    category: "abuse",
    riskLevel: "high",
    riskTag: "abuse",
    pattern: /傻逼|煞笔|草你妈|操你妈|nmsl|死全家/
  },
  {
    category: "advertisement",
    riskLevel: "medium",
    riskTag: "advertisement",
    pattern: /加微信|私聊|返利|推广|推廣|开户链接|開戶鏈接|tg群|电报群|電報群|qq群|vx/
  },
  {
    category: "politics",
    riskLevel: "medium",
    riskTag: "politics",
    pattern: /涉政|政治|敏感事件/
  }
];

const SOURCE_CLASSIFICATION_RULES = [
  {
    category: "pornography",
    riskLevel: "high",
    riskTag: "pornography",
    pattern: /色情词库|色情類型|色情类型/
  },
  {
    category: "weapon_explosive",
    riskLevel: "high",
    riskTag: "illegal",
    pattern: /涉枪涉爆|涉槍涉爆/
  },
  {
    category: "violence",
    riskLevel: "high",
    riskTag: "violence",
    pattern: /暴恐词库|暴恐詞庫/
  },
  {
    category: "illegal_url",
    riskLevel: "high",
    riskTag: "illegal",
    pattern: /非法网址|非法網址/
  },
  {
    category: "advertisement",
    riskLevel: "medium",
    riskTag: "advertisement",
    pattern: /广告类型|廣告類型/
  },
  {
    category: "politics",
    riskLevel: "medium",
    riskTag: "politics",
    pattern: /政治类型|政治類型|反动词库|反動詞庫|贪腐词库|貪腐詞庫|gfw|covid|新思想启蒙/
  },
  {
    category: "public_event",
    riskLevel: "medium",
    riskTag: "ambiguous",
    pattern: /民生词库|民生詞庫/
  },
  {
    category: "ambiguous",
    riskLevel: "medium",
    riskTag: "ambiguous",
    pattern:
      /补充词库|補充詞庫|网易前端过滤敏感词库|網易前端過濾敏感詞庫|零时-tencent|零時-tencent|其他词库|其他詞庫/
  }
];

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const outputPath = path.resolve(options.outputPath);
  const previousContent = await readExistingCache(outputPath);

  try {
    const files = await readSourceTextFiles(options);
    const entries = normalizeEntries(files.flatMap((file) => linesFromFile(file)));

    if (entries.length < MIN_ENTRY_COUNT) {
      throw new Error(`同步词条数量过少：${entries.length}，疑似词库源不完整`);
    }

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, renderCache(entries), "utf8");
    console.log(`敏感词库同步完成：${entries.length} 条，写入 ${outputPath}`);
  } catch (error) {
    if (previousContent) {
      await writeFile(outputPath, previousContent, "utf8");
    }
    console.error(
      `敏感词库同步失败，已保留已有缓存：${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}

function parseOptions(argv) {
  const options = {
    sourceZip: process.env.SENSITIVE_LEXICON_ZIP_PATH,
    sourceDir: process.env.SENSITIVE_LEXICON_SOURCE_DIR,
    outputPath: process.env.SENSITIVE_LEXICON_OUTPUT_PATH || DEFAULT_OUTPUT_PATH
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = argv[index + 1];

    if (argument === "--source-zip" && next) {
      options.sourceZip = next;
      index += 1;
      continue;
    }

    if (argument === "--source-dir" && next) {
      options.sourceDir = next;
      index += 1;
      continue;
    }

    if (argument === "--output" && next) {
      options.outputPath = next;
      index += 1;
      continue;
    }
  }

  return options;
}

async function readExistingCache(outputPath) {
  try {
    return await readFile(outputPath, "utf8");
  } catch {
    return "";
  }
}

async function readSourceTextFiles(options) {
  if (options.sourceZip) {
    return readTextFilesFromZip(path.resolve(options.sourceZip));
  }

  if (options.sourceDir) {
    return readTextFilesFromDirectory(path.resolve(options.sourceDir));
  }

  return readTextFilesFromRepository();
}

async function readTextFilesFromRepository() {
  const files = await listRepositoryTextFiles();
  return Promise.all(
    files.map(async (file) => ({
      sourcePath: file.path,
      content: await downloadTextFile(file.path, file.branch)
    }))
  );
}

async function listRepositoryTextFiles() {
  const branches = ["main", "master"];
  let lastError;

  for (const branch of branches) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/konsheng/Sensitive-lexicon/git/trees/${branch}?recursive=1`,
        { headers: { Accept: "application/vnd.github+json", "User-Agent": "moyuxia-lexicon-sync" } }
      );
      if (!response.ok) {
        throw new Error(`GitHub tree API 返回 ${response.status}`);
      }
      const payload = await response.json();
      const files = Array.isArray(payload.tree)
        ? payload.tree.filter(
            (item) =>
              item &&
              item.type === "blob" &&
              typeof item.path === "string" &&
              item.path.toLowerCase().endsWith(".txt")
          )
        : [];
      if (files.length === 0) {
        throw new Error("仓库中未找到 .txt 词库文件");
      }
      return files.map((file) => ({ ...file, branch }));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("无法读取 GitHub 仓库文件列表");
}

async function downloadTextFile(filePath, branch) {
  const response = await fetch(
    `https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/${branch}/${encodeURIComponentPath(filePath)}`,
    { headers: { "User-Agent": "moyuxia-lexicon-sync" } }
  );
  if (!response.ok) {
    throw new Error(`下载词库文件失败：${filePath} (${response.status})`);
  }
  return response.text();
}

async function readTextFilesFromDirectory(sourceDir) {
  const files = await listLocalTextFiles(sourceDir);
  if (files.length === 0) {
    throw new Error(`本地目录未找到 .txt 词库文件：${sourceDir}`);
  }

  return Promise.all(
    files.map(async (filePath) => ({
      sourcePath: path.relative(sourceDir, filePath).replaceAll("\\", "/"),
      content: await readFile(filePath, "utf8")
    }))
  );
}

async function listLocalTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listLocalTextFiles(fullPath);
      }
      return entry.isFile() && entry.name.toLowerCase().endsWith(".txt") ? [fullPath] : [];
    })
  );
  return files.flat();
}

async function readTextFilesFromZip(zipPath) {
  const buffer = await readFile(zipPath);
  const files = readZipEntries(buffer)
    .filter((entry) => !entry.directory && entry.path.toLowerCase().endsWith(".txt"))
    .map((entry) => ({
      sourcePath: entry.path,
      content: entry.content.toString("utf8")
    }));

  if (files.length === 0) {
    throw new Error(`本地压缩包未找到 .txt 词库文件：${zipPath}`);
  }

  return files;
}

function readZipEntries(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = [];
  let offset = centralDirectoryOffset;
  const endOffset = centralDirectoryOffset + centralDirectorySize;

  while (offset < endOffset) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("ZIP 中央目录结构异常");
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);
    const content = readZipEntryContent(buffer, {
      localHeaderOffset,
      compressedSize,
      compressionMethod
    });

    entries.push({
      path: fileName,
      directory: fileName.endsWith("/"),
      content
    });

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer) {
  const minimumOffset = Math.max(0, buffer.length - 65557);
  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  throw new Error("无法识别 ZIP 中央目录");
}

function readZipEntryContent(buffer, entry) {
  const localHeaderOffset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    throw new Error("ZIP 本地文件头结构异常");
  }

  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraFieldLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraFieldLength;
  const compressedContent = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressedContent;
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressedContent);
  }

  throw new Error(`不支持的 ZIP 压缩方式：${entry.compressionMethod}`);
}

function linesFromFile(file) {
  return file.content
    .replace(/^\ufeff/, "")
    .split(/\r?\n/)
    .map((line) => ({ rawLine: line, sourcePath: file.sourcePath }));
}

function normalizeEntries(lines) {
  const entriesByTerm = new Map();

  for (const { rawLine, sourcePath } of lines) {
    const term = rawLine.trim();
    if (!term || term.startsWith("#") || term.startsWith("//")) {
      continue;
    }
    const normalizedTerm = normalizeText(term);
    if (normalizedTerm.length < 2) {
      continue;
    }

    const entry = {
      term,
      normalizedTerm,
      ...classifyTerm(term, sourcePath)
    };
    const existing = entriesByTerm.get(normalizedTerm);
    if (!existing || shouldReplaceEntry(existing, entry)) {
      entriesByTerm.set(normalizedTerm, entry);
    }
  }

  return [...entriesByTerm.values()].sort((first, second) =>
    first.normalizedTerm.localeCompare(second.normalizedTerm)
  );
}

function classifyTerm(term, sourcePath) {
  const normalizedTerm = normalizeText(term);
  const matchedRule = CATEGORY_RULES.find(
    (rule) => rule.pattern.test(term) || rule.pattern.test(normalizedTerm)
  );
  if (matchedRule) {
    return toClassification(matchedRule);
  }

  const sourceText = sourcePath.toLowerCase();
  const normalizedSourcePath = normalizeText(sourcePath);
  const sourceRule = SOURCE_CLASSIFICATION_RULES.find(
    (rule) => rule.pattern.test(sourceText) || rule.pattern.test(normalizedSourcePath)
  );
  if (sourceRule) {
    return toClassification(sourceRule);
  }

  return {
    category: "ambiguous",
    riskLevel: "medium",
    riskTag: "ambiguous"
  };
}

function toClassification(rule) {
  return {
    category: rule.category,
    riskLevel: rule.riskLevel,
    riskTag: rule.riskTag
  };
}

function shouldReplaceEntry(existing, next) {
  const existingWeight = RISK_LEVEL_WEIGHT[existing.riskLevel];
  const nextWeight = RISK_LEVEL_WEIGHT[next.riskLevel];
  if (nextWeight !== existingWeight) {
    return nextWeight > existingWeight;
  }

  if (existing.riskTag === "ambiguous" && next.riskTag !== "ambiguous") {
    return true;
  }

  return existing.category === "ambiguous" && next.category !== "ambiguous";
}

function renderCache(entries) {
  const entryRows = entries.map((entry) => [
    entry.term,
    entry.category,
    entry.riskLevel,
    entry.riskTag
  ]);
  const categories = [...new Set(entries.map((entry) => entry.category))].sort();
  const encodedChunks = chunkString(
    gzipSync(Buffer.from(entryRows.map((row) => JSON.stringify(row)).join("\n"), "utf8")).toString(
      "base64"
    ),
    120
  );

  return `import { gunzipSync } from "node:zlib";
import {
  normalizeModerationText,
  type LowCostModerationRiskLevel,
  type LowCostModerationRiskTag,
  type SensitiveLexiconCache,
  type SensitiveLexiconEntry
} from "@moyuxia/shared";

const entryDataBase64Chunks = ${JSON.stringify(encodedChunks, null, 2)};
const categories = ${JSON.stringify(categories, null, 2)} as const;

const entries: SensitiveLexiconEntry[] = gunzipSync(
  Buffer.from(entryDataBase64Chunks.join(""), "base64")
)
  .toString("utf8")
  .split("\\n")
  .filter(Boolean)
  .map((line) => {
    const [term, category, riskLevel, riskTag] = JSON.parse(line) as [
      string,
      string,
      LowCostModerationRiskLevel,
      LowCostModerationRiskTag
    ];

    return {
      term,
      normalizedTerm: normalizeModerationText(term),
      category,
      riskLevel,
      riskTag
    };
  });

export const API_SENSITIVE_LEXICON_CACHE: SensitiveLexiconCache = {
  version: 1,
  sourceRepository: ${JSON.stringify(REPOSITORY)},
  sourceLicense: ${JSON.stringify(LICENSE)},
  syncedAt: ${JSON.stringify(new Date().toISOString())},
  entryCount: entries.length,
  categories,
  entries
};
`;
}

function normalizeText(text) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u200b-\u200f\ufeff]+/g, "")
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]/gu, "");
}

function chunkString(value, size) {
  const chunks = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks;
}

function encodeURIComponentPath(filePath) {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

await main();
