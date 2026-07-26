const axios = require('axios');
const config = require('./config');

/**
 * 构造友好的错误信息（后端 message 附加在引导文案后）
 */
function formatErrorMessage(guideMsg, backendMsg) {
  if (backendMsg) {
    return guideMsg + '（后端提示：' + backendMsg + '）';
  }
  return guideMsg;
}

/**
 * 将 HTTP/业务错误归一化为 Error（不退出）
 */
function normalizeRequestError(error) {
  if (error.response) {
    const { status, data } = error.response;
    const backendMsg = data && data.message;
    if (status === 401) {
      return new Error(formatErrorMessage('API Key 无效或已过期，请重新配置', backendMsg));
    } else if (status === 403) {
      return new Error(formatErrorMessage('权限不足，请在博客后台「AI 密钥管理」→ 编辑密钥中勾选所需权限', backendMsg));
    } else if (backendMsg) {
      return new Error(backendMsg);
    }
  } else if (error.code === 'ECONNREFUSED') {
    return new Error('无法连接到服务器，请检查地址和网络');
  } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return new Error('请求超时，请检查网络连接');
  }
  return new Error(error.message || '未知错误');
}

function createClient(options) {
  const { silent } = options || {};
  const apiKey = config.getApiKey();
  if (!apiKey) {
    console.error('错误：未配置 API Key，请运行 lantech-cli config set --key <your_key>');
    process.exit(1);
  }

  const client = axios.create({
    baseURL: config.getBaseUrl(),
    timeout: 30000,
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Referer': config.getReferer(),
    }
  });

  client.interceptors.response.use(
    response => {
      const body = response.data;
      // 业务错误：HTTP 200 但 Result.code != 200（例如 SQL 报错、参数校验失败）
      if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
        const msg = body.message || ('业务失败 (code=' + body.code + ')');
        if (silent) return Promise.reject(new Error(msg));
        console.error('错误：' + msg);
        process.exit(1);
      }
      return body;
    },
    error => {
      const normalized = normalizeRequestError(error);
      if (silent) return Promise.reject(normalized);
      console.error('错误：' + normalized.message);
      process.exit(1);
    }
  );

  return client;
}

/** 以下各 API 方法：发出请求，遇错误直接退出 */
async function get(path, params) {
  const client = createClient();
  return client.get(path, { params });
}

async function post(path, data) {
  const client = createClient();
  return client.post(path, data);
}

async function put(path, data) {
  const client = createClient();
  return client.put(path, data);
}

async function del(path) {
  const client = createClient();
  return client.delete(path);
}

/** silent 变体：调用方自行处理错误（抛 Error，不退出） */
async function getRaw(path, params) {
  const client = createClient({ silent: true });
  return client.get(path, { params });
}

async function postRaw(path, data) {
  const client = createClient({ silent: true });
  return client.post(path, data);
}

async function putRaw(path, data) {
  const client = createClient({ silent: true });
  return client.put(path, data);
}

async function delRaw(path) {
  const client = createClient({ silent: true });
  return client.delete(path);
}

module.exports = { get, post, put, del, getRaw, postRaw, putRaw, delRaw, createClient };
