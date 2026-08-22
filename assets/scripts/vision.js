#!/usr/bin/env node
/**
 * vision.js — 让无多模态能力的 Agent 获得识图能力（OpenAI 兼容格式，零第三方依赖）
 *
 * 用法:
 *   node vision.js <图片路径> [问题]
 *   node vision.js --url <图片链接> [问题]
 *
 * 配置（优先级: 环境变量 > scripts/.env > 当前目录 .env > x secret（可选））:
 *   VISION_API_KEY   识图服务 Key（也兼容 DASHSCOPE_API_KEY）
 *   VISION_MODEL     模型名，默认 qwen-vl-max（也兼容 DASHSCOPE_MODEL）
 *   VISION_BASE_URL  兼容端点，默认阿里云百炼 https://dashscope.aliyuncs.com/compatible-mode/v1
 *   VISION_KEY_NAME  可选: 从 x secret 读取时的条目名（默认 DashScope，逗号分隔多个候选）
 *
 * 任何 OpenAI 兼容的 vision 服务都能用（百炼/OpenAI/中转等），改 BASE_URL 与模型名即可。
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { exec } = require("child_process");

// ---------- 极简 .env 解析（零依赖） ----------
function loadDotEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const scriptDir = __dirname;
const dotEnv = { ...loadDotEnv(path.join(scriptDir, ".env")), ...loadDotEnv(path.join(process.cwd(), ".env")) };
const get = (...names) => {
  for (const n of names) {
    if (process.env[n]) return process.env[n];
    if (dotEnv[n]) return dotEnv[n];
  }
  return "";
};

const BASE_URL = (get("VISION_BASE_URL", "DASHSCOPE_BASE_URL") || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/+$/, "");
const MODEL = get("VISION_MODEL", "DASHSCOPE_MODEL") || "qwen-vl-max";
let API_KEY = get("VISION_API_KEY", "DASHSCOPE_API_KEY");

// ---------- 可选: 从 x secret 读取 Key（本机已装 x-cli 时） ----------
function keyFromXSecret() {
  return new Promise((resolve) => {
    if (API_KEY) return resolve(API_KEY);
    const names = (get("VISION_KEY_NAME") || "DashScope,DASHSCOPE_API_KEY,VISION_API_KEY")
      .split(",").map((s) => s.trim()).filter((s) => /^[\w\u4e00-\u9fa5 -]+$/.test(s));
    if (!names.length) return resolve("");
    let i = 0;
    const tryNext = () => {
      if (i >= names.length) return resolve("");
      const name = names[i++];
      exec(`x secret get ${JSON.stringify(name)} --no-clipboard`, { windowsHide: true, timeout: 8000 }, (err, stdout) => {
        if (err) return tryNext();
        const lines = String(stdout).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        const key = lines[lines.length - 1] || "";
        if (/^sk-/.test(key)) return resolve(key);
        tryNext();
      });
    };
    tryNext();
  });
}

// ---------- 参数解析 ----------
function parseArgs(argv) {
  const out = { imageSource: "", prompt: "", isUrl: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--url" && argv[i + 1]) {
      out.isUrl = true;
      out.imageSource = argv[++i];
    } else if (!out.imageSource && !argv[i].startsWith("--")) {
      out.imageSource = argv[i];
    } else if (out.imageSource && !argv[i].startsWith("--")) {
      out.prompt = out.prompt ? out.prompt + " " + argv[i] : argv[i];
    }
  }
  if (!out.prompt) out.prompt = "请详细描述这张图片的内容。";
  return out;
}

function resolveImageUrl(source, isUrl) {
  if (isUrl) return source;
  const resolved = path.resolve(source);
  if (!fs.existsSync(resolved)) throw new Error(`文件不存在: ${resolved}`);
  const ext = path.extname(resolved).toLowerCase().replace(".", "");
  const mimeMap = { jpg: "jpeg", jpeg: "jpeg", png: "png", gif: "gif", webp: "webp", bmp: "bmp" };
  const data = fs.readFileSync(resolved);
  return `data:image/${mimeMap[ext] || "jpeg"};base64,${data.toString("base64")}`;
}

function request(payload) {
  const url = new URL(BASE_URL + "/chat/completions");
  const body = JSON.stringify(payload);
  const transport = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = transport.request(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 400) return reject(new Error(`API ${res.statusCode}: ${data.slice(0, 300)}`));
        try {
          resolve(JSON.parse(data)?.choices?.[0]?.message?.content || data);
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  API_KEY = await keyFromXSecret();
  if (!API_KEY) {
    console.error("未找到 API Key。请设置环境变量 VISION_API_KEY/DASHSCOPE_API_KEY，或在 scripts/.env 中配置。");
    console.error("百炼 Key 获取: https://bailian.console.aliyun.com/");
    process.exit(1);
  }
  const { imageSource, prompt, isUrl } = parseArgs(process.argv.slice(2));
  if (!imageSource) {
    console.error("用法: node vision.js <图片路径> [问题]");
    console.error("      node vision.js --url <图片链接> [问题]");
    process.exit(1);
  }
  try {
    const imageUrl = resolveImageUrl(imageSource, isUrl);
    const result = await request({
      model: MODEL,
      messages: [{ role: "user", content: [
        { type: "image_url", image_url: { url: imageUrl } },
        { type: "text", text: prompt },
      ] }],
      stream: false,
      max_tokens: 2048,
    });
    console.log(result);
  } catch (err) {
    console.error("识图失败:", err.message);
    process.exit(1);
  }
}

main();
