const axios = require('axios');
const config = require('./config');

function createClient() {
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
      // 不再无脑把响应体当成功，避免 "✓ 已创建" 假象
      if (body && typeof body === 'object' && 'code' in body && body.code !== 200) {
        console.error('错误：' + (body.message || ('业务失败 (code=' + body.code + ')')));
        process.exit(1);
      }
      return body;
    },
    error => {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          console.error('错误：API Key 无效或已过期，请重新配置');
          process.exit(1);
        } else if (status === 403) {
          console.error('错误：权限不足，请在博客后台「AI 密钥管理」→ 编辑密钥中勾选所需权限');
          process.exit(1);
        } else if (data && data.message) {
          console.error('错误：' + data.message);
          process.exit(1);
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.error('错误：无法连接到服务器，请检查地址和网络');
        process.exit(1);
      } else if (error.code === 'ETIMEDOUT') {
        console.error('错误：请求超时，请检查网络连接');
        process.exit(1);
      }
      console.error('错误：' + (error.message || '未知错误'));
      process.exit(1);
    }
  );

  return client;
}

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

module.exports = { get, post, put, del, createClient };
