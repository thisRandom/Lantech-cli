// 镜像前端 lantech.top/src/utils/image-compress.ts 的压缩预设与行为
// 浏览器端用 compressorjs（canvas），Node 端用 sharp 实现等价能力
const sharp = require('sharp');

const COMPRESS_PRESETS = {
  avatar: { maxWidth: 256, maxHeight: 256, quality: 90 },
  cover: { maxWidth: 1280, maxHeight: 720, quality: 85 },
  article: { maxWidth: 1920, maxHeight: 1080, quality: 80 },
  project: { maxWidth: 1600, maxHeight: 900, quality: 80 },
  config: { maxWidth: 800, maxHeight: 600, quality: 75 },
  default: { maxWidth: 2048, maxHeight: 1536, quality: 75 },
};

// sharp 可安全重编码的格式；gif/svg 等由调用方跳过（保护动图和矢量图）
const COMPRESSIBLE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

function canCompress(ext) {
  return COMPRESSIBLE_EXTS.includes(ext.toLowerCase());
}

/**
 * 压缩图片 buffer，保持原格式输出（扩展名/MIME 不变，对齐前端行为）
 * @param {Buffer} buffer 原图内容
 * @param {string} ext 扩展名（含点，如 .jpg）
 * @param {string} type 业务类型（COMPRESS_PRESETS 的 key）
 * @param {number|null} qualityOverride 覆盖预设质量（1-100）
 * @returns {Promise<Buffer>} 压缩后的内容
 */
async function compressImage(buffer, ext, type, qualityOverride) {
  const preset = COMPRESS_PRESETS[type] || COMPRESS_PRESETS.default;
  const quality = qualityOverride || preset.quality;

  // rotate() 按 EXIF 矫正方向，对齐 compressorjs 默认 checkOrientation: true
  let pipeline = sharp(buffer).rotate().resize({
    width: preset.maxWidth,
    height: preset.maxHeight,
    fit: 'inside',
    withoutEnlargement: true, // 小图不放大
  });

  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case '.png':
      // 前端 canvas 导出的 PNG 是无损的，quality 只作用于缩放后的体积
      // 这里同样不做 palette 有损量化，只缩放 + 拉满 deflate
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
    case '.webp':
      pipeline = pipeline.webp({ quality });
      break;
    default:
      throw new Error('不支持的压缩格式: ' + ext);
  }

  return pipeline.toBuffer();
}

module.exports = { COMPRESS_PRESETS, canCompress, compressImage };
