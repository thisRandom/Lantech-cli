const api = require('../lib/api');
const output = require('../lib/output');
const { canCompress, compressImage } = require('../lib/compress');
const fs = require('fs');
const path = require('path');

async function uploadFile(filePath, fileType, description, options = {}) {
  if (!fs.existsSync(filePath)) {
    console.error('错误：文件不存在 - ' + filePath);
    process.exit(1);
  }

  const ext = path.extname(filePath);
  const originalContent = fs.readFileSync(filePath);
  const originalSize = originalContent.length;

  // 上传前压缩（对齐前端 OSS 组件行为，节约 OSS 成本）；跳过情形直接用原图：
  // gif/svg 等不可安全重编码的格式、--no-compress、压缩失败、压缩后反而更大
  let fileContent = originalContent;
  let compressed = false;
  if (options.compress !== false && canCompress(ext)) {
    try {
      const result = await compressImage(originalContent, ext, fileType, options.quality);
      if (result.length < originalSize) {
        fileContent = result;
        compressed = true;
      }
    } catch (e) {
      // 压缩失败降级为上传原图
    }
  }

  // 10MB 校验放在压缩之后：超大图压缩后可能落到限制以内
  if (fileContent.length > 10 * 1024 * 1024) {
    console.error('错误：文件超过 10MB 大小限制');
    process.exit(1);
  }

  const signRes = await api.get('/api/admin/oss/signature', { type: fileType });
  const sign = signRes.data || signRes;

  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 900) + 100;
  const objectKey = sign.dir + timestamp + '-' + randomId + ext;
  const objectUrl = '/' + objectKey;

  const FormData = require('form-data');
  const form = new FormData();
  form.append('key', objectKey);
  form.append('OSSAccessKeyId', sign.accessid);
  form.append('policy', sign.policy);
  form.append('signature', sign.signature);
  form.append('file', fileContent, { filename: 'upload' + ext });

  const axios = require('axios');
  const uploadRes = await axios.post(sign.host, form, {
    headers: form.getHeaders(),
    maxContentLength: 10 * 1024 * 1024,
    maxBodyLength: 10 * 1024 * 1024,
  });

  if (uploadRes.status !== 204 && uploadRes.status !== 200) {
    console.error('错误：上传到 OSS 失败（' + uploadRes.status + '）');
    process.exit(1);
  }

  const baseUrl = sign.host;
  await api.post('/api/admin/oss/register', {
    url: objectUrl,
    fileName: objectKey.replace(sign.dir, ''),
    fileSize: fileContent.length,
    mimeType: getMimeType(ext),
    description: description || 'CLI 上传',
  });

  // 博客前台使用的是自定义 CDN 域名（oss.base_url），非 Aliyun 直链
  // 拿到后可直接用于 project --images / article --cover
  let cdnUrl = null;
  try {
    const cfgRes = await api.get('/api/admin/config/system');
    const cfg = cfgRes.data || cfgRes;
    const cdnBase = cfg && cfg['oss.base_url'];
    if (cdnBase) cdnUrl = cdnBase.replace(/\/+$/, '') + objectUrl;
  } catch (e) {
    // 读不到配置就算了，url 和 fullUrl 仍可用
  }

  return {
    url: objectUrl,
    fullUrl: baseUrl + objectUrl,
    cdnUrl: cdnUrl,
    fileName: objectKey.replace(sign.dir, ''),
    fileSize: fileContent.length,
    originalSize: originalSize,
    compressed: compressed,
  };
}

function getMimeType(ext) {
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.bmp': 'image/bmp',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
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
    .description('上传本地图片到 OSS（默认按 type 预设压缩后上传）')
    .requiredOption('--file <path>', '本地文件路径')
    .option('--type <type>', '类型：article/cover/avatar/project/config/default', 'default')
    .option('--desc <desc>', '资源描述')
    .option('--no-compress', '不压缩，直接上传原图')
    .option('--quality <n>', '压缩质量 1-100，覆盖预设值')
    .action(async (options) => {
      let quality = null;
      if (options.quality !== undefined) {
        quality = parseInt(options.quality, 10);
        if (isNaN(quality) || quality < 1 || quality > 100) {
          console.error('错误：--quality 必须是 1-100 的整数');
          process.exit(1);
        }
      }
      const result = await uploadFile(options.file, options.type, options.desc, {
        compress: options.compress,
        quality: quality,
      });
      output.successWithMessage(result, '图片已上传到 OSS');
    });
}

module.exports = { register };
