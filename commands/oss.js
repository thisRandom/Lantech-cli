const api = require('../lib/api');
const output = require('../lib/output');
const fs = require('fs');
const path = require('path');

/**
 * 通过签名直传方式上传文件到 OSS
 */
async function uploadFile(filePath, fileType) {
  // 1. 检查文件
  if (!fs.existsSync(filePath)) {
    console.error('错误：文件不存在 - ' + filePath);
    process.exit(1);
  }
  const stats = fs.statSync(filePath);
  if (stats.size > 10 * 1024 * 1024) {
    console.error('错误：文件超过 10MB 大小限制');
    process.exit(1);
  }

  // 2. 获取 OSS 签名
  const signRes = await api.get('/api/admin/oss/signature', { type: fileType });
  const sign = signRes.data || signRes;

  // 3. 生成唯一的 OSS object key（上传和注册使用同一个 key）
  const fileName = path.basename(filePath);
  const timestamp = Date.now();
  const objectKey = sign.dir + timestamp + '_' + fileName;
  const objectUrl = '/' + objectKey;

  // 4. 读取文件内容
  const fileContent = fs.readFileSync(filePath);

  // 5. 构造 multipart 表单，上传到 OSS
  const FormData = require('form-data');
  const form = new FormData();
  form.append('key', objectKey);
  form.append('OSSAccessKeyId', sign.accessid);
  form.append('policy', sign.policy);
  form.append('signature', sign.signature);
  form.append('file', fileContent, { filename: fileName });

  const axios = require('axios');
  const uploadRes = await axios.post(sign.host, form, {
    headers: form.getHeaders(),
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
  });

  // 检查 OSS 上传是否成功（OSS 返回 204 No Content 表示成功）
  if (uploadRes.status !== 204 && uploadRes.status !== 200) {
    console.error('错误：上传到 OSS 失败（' + uploadRes.status + '）');
    process.exit(1);
  }

  // 6. 注册到数据库
  const baseUrl = sign.host;
  await api.post('/api/admin/oss/register', {
    url: objectUrl,
    fileName: fileName,
    fileSize: stats.size,
    mimeType: getMimeType(fileName),
    description: 'CLI 上传',
  });

  return {
    url: objectUrl,
    fullUrl: baseUrl + objectUrl,
    fileName: fileName,
    fileSize: stats.size,
  };
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
  };
  return map[ext] || 'application/octet-stream';
}

function register(program) {
  const cmd = program.command('oss')
    .description('资源管理（OSS）');

  cmd.command('list')
    .description('获取资源列表')
    .option('--page <page>', '页码', '1')
    .option('--size <size>', '每页条数', '20')
    .action(async (options) => {
      const res = await api.get('/api/admin/oss/list', { page: options.page, size: options.size });
      output.success(res.data || res);
    });

  cmd.command('upload')
    .description('上传本地图片到 OSS')
    .requiredOption('--file <path>', '本地文件路径')
    .option('--type <type>', '类型：article/cover/avatar/project/config/default', 'default')
    .action(async (options) => {
      const result = await uploadFile(options.file, options.type);
      output.successWithMessage(result, '图片已上传到 OSS');
    });
}

module.exports = { register };