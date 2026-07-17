const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(require('os').homedir(), '.lantech');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * 读取配置
 */
function load() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {
    // ignore
  }
  return {};
}

/**
 * 保存配置
 */
function save(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * 获取 API Key（优先环境变量）
 */
function getApiKey() {
  return process.env.LANTECH_API_KEY || load().apiKey || '';
}

/**
 * 获取 Base URL（优先环境变量）
 */
function getBaseUrl() {
  return process.env.LANTECH_BASE_URL || load().baseUrl || 'https://lantech.top';
}

/**
 * 获取 Referer
 */
function getReferer() {
  const url = getBaseUrl();
  return url.startsWith('http') ? url : 'https://' + url;
}

module.exports = { load, save, getApiKey, getBaseUrl, getReferer };
