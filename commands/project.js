const api = require('../lib/api');
const output = require('../lib/output');

// 把 "https://oss.lantech.top/blog/projects/xxx.png,https://..." 解析成
// 后端要求的 [{imagePath, order}] 结构；order 从 0 递增
function parseImages(raw) {
  return raw.split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map((path, i) => ({ imagePath: path, order: i }));
}

// 把 tag 名称（逗号分隔）解析成 tagIds
// 后端 batchInsertTags 只认 tagIds，传 tags 名称是无效字段
async function resolveTagIds(tagsCsv) {
  const names = tagsCsv.split(',').map(t => t.trim()).filter(Boolean);
  if (!names.length) return [];
  const res = await api.get('/api/admin/tag/list');
  const all = res.data || res;
  const map = new Map((all || []).map(t => [t.name, t.id]));
  const missing = names.filter(n => !map.has(n));
  if (missing.length) {
    console.error('错误：以下标签不存在，请先 lantech-cli tag create 创建：' + missing.join(', '));
    process.exit(1);
  }
  return names.map(n => map.get(n));
}

function register(program) {
  const cmd = program.command('project')
    .description('项目管理');

  cmd.command('list')
    .description('获取项目列表')
    .action(async () => {
      const res = await api.get('/api/project/list');
      output.success(res.data || res);
    });

  cmd.command('create')
    .description('新增项目')
    .requiredOption('--title <title>', '项目标题')
    .option('--description <desc>', '项目描述')
    .option('--url <url>', '项目链接')
    .option('--date <date>', '项目日期 yyyy-MM-dd（后端必填）')
    .option('--tags <tags>', '标签名，逗号分隔（会自动查 ID）')
    .option('--tag-ids <ids>', '标签 ID，逗号分隔（与 --tags 二选一）')
    .option('--images <urls>', '图片 URL，逗号分隔（顺序即 order）')
    .action(async (options) => {
      const data = { title: options.title };
      if (options.description) data.description = options.description;
      if (options.url) data.url = options.url;
      if (options.date) data.date = options.date;
      if (options.tagIds) {
        data.tagIds = options.tagIds.split(',').map(t => parseInt(t.trim())).filter(n => !isNaN(n));
      } else if (options.tags) {
        data.tagIds = await resolveTagIds(options.tags);
      }
      if (options.images) data.images = parseImages(options.images);
      await api.post('/api/admin/project/save', data);
      output.successWithMessage(null, '项目已创建');
    });

  cmd.command('update')
    .description('编辑项目（只传需要改的字段，其余自动保留）')
    .requiredOption('--id <id>', '项目 ID')
    .option('--title <title>', '新标题')
    .option('--description <desc>', '新描述')
    .option('--url <url>', '新链接')
    .option('--date <date>', '新日期 yyyy-MM-dd')
    .option('--tags <tags>', '标签名，逗号分隔（会自动查 ID）')
    .option('--tag-ids <ids>', '标签 ID，逗号分隔')
    .option('--images <urls>', '图片 URL，逗号分隔')
    .action(async (options) => {
      // 后端 save 是全量覆盖（会 delete 关联表再 insert），必须先把当前值取回来做合并
      const listRes = await api.get('/api/project/list');
      const list = listRes.data || listRes;
      const cur = (list || []).find(p => p.id === parseInt(options.id));
      if (!cur) {
        console.error('错误：未找到项目 ID ' + options.id);
        process.exit(1);
      }

      const data = {
        id: parseInt(options.id),
        title: options.title || cur.title,
        description: options.description !== undefined ? options.description : cur.description,
        url: options.url !== undefined ? options.url : cur.url,
        date: options.date || cur.date,
      };

      if (options.tagIds) {
        data.tagIds = options.tagIds.split(',').map(t => parseInt(t.trim())).filter(n => !isNaN(n));
      } else if (options.tags) {
        data.tagIds = await resolveTagIds(options.tags);
      } else if (cur.tags && cur.tags.length) {
        // 列表接口只回标签名，需再解析回 ID 以避免更新时把标签清空
        data.tagIds = await resolveTagIds(cur.tags.join(','));
      }

      if (options.images) {
        data.images = parseImages(options.images);
      } else if (cur.images && cur.images.length) {
        // list 返回的 images 已被后端补成完整 URL，saveOrUpdateProject 会自动剥离 baseUrl
        data.images = cur.images.map((img, i) => ({
          imagePath: img.imagePath,
          order: img.order != null ? img.order : i,
        }));
      }

      await api.post('/api/admin/project/save', data);
      output.successWithMessage(null, '项目已更新');
    });

  cmd.command('delete')
    .description('删除项目')
    .argument('<id>', '项目 ID')
    .action(async (id) => {
      await api.del('/api/admin/project/delete/' + id);
      output.successWithMessage(null, '项目已删除');
    });
}

module.exports = { register };
