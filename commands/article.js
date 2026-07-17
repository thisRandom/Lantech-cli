const api = require('../lib/api');
const output = require('../lib/output');

function register(program) {
  const cmd = program.command('article')
    .description('文章管理');

  cmd.command('list')
    .description('获取文章列表')
    .option('--page <page>', '页码', '1')
    .option('--size <size>', '每页条数', '10')
    .option('--keyword <keyword>', '标题搜索')
    .option('--status <status>', '状态：0=草稿 1=发布')
    .option('--category <id>', '分类 ID')
    .action(async (options) => {
      const params = { page: options.page, pageSize: options.size };
      if (options.keyword) params.keyword = options.keyword;
      if (options.status !== undefined) params.status = parseInt(options.status);
      if (options.category) params.categoryId = parseInt(options.category);
      const res = await api.get('/api/admin/article/list', params);
      output.success(res.data || res);
    });

  cmd.command('get')
    .description('获取文章详情')
    .argument('<id>', '文章 ID')
    .action(async (id) => {
      const res = await api.get(`/api/admin/article/${id}`);
      output.success(res.data || res);
    });

  cmd.command('create')
    .description('创建文章（存为草稿，需用户审核后发布）')
    .requiredOption('--title <title>', '文章标题（必填）')
    .requiredOption('--content <content>', 'Markdown 正文（必填）')
    .requiredOption('--category <id>', '分类 ID（必填）')
    .option('--tags <tags>', '标签名，逗号分隔')
    .option('--status <status>', '0=草稿 1=发布（默认 0）', '0')
    .option('--cover <url>', '封面图 URL')
    .action(async (options) => {
      const data = {
        title: options.title,
        content: options.content,
        categoryId: parseInt(options.category),
        tags: options.tags ? options.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        status: parseInt(options.status),
      };
      if (options.cover) data.cover = options.cover;
      const res = await api.post('/api/admin/article/save', data);
      output.successWithMessage(res.data || res, '文章已创建（草稿状态）');
    });

  cmd.command('update')
    .description('更新文章')
    .argument('<id>', '文章 ID')
    .option('--title <title>', '新标题')
    .option('--content <content>', '新正文')
    .option('--category <id>', '分类 ID')
    .option('--tags <tags>', '标签名，逗号分隔')
    .option('--status <status>', '0=草稿 1=发布')
    .option('--cover <url>', '封面图 URL')
    .action(async (id, options) => {
      const data = { id: parseInt(id) };
      if (options.title) data.title = options.title;
      if (options.content) data.content = options.content;
      if (options.category) data.categoryId = parseInt(options.category);
      if (options.tags) data.tags = options.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (options.status !== undefined) data.status = parseInt(options.status);
      if (options.cover) data.cover = options.cover;
      await api.post('/api/admin/article/save', data);
      output.successWithMessage(null, '文章已更新');
    });

  cmd.command('publish')
    .description('发布文章（草稿→发布）')
    .argument('<id>', '文章 ID')
    .action(async (id) => {
      await api.put(`/api/admin/article/status/${id}?status=1`);
      output.successWithMessage(null, '文章已发布');
    });

  cmd.command('unpublish')
    .description('下架文章（发布→草稿）')
    .argument('<id>', '文章 ID')
    .action(async (id) => {
      await api.put(`/api/admin/article/status/${id}?status=0`);
      output.successWithMessage(null, '文章已下架为草稿');
    });

  cmd.command('delete')
    .description('删除文章（移至回收站）')
    .argument('<id>', '文章 ID')
    .action(async (id) => {
      await api.del(`/api/admin/article/${id}`);
      output.successWithMessage(null, '文章已移至回收站');
    });

  cmd.command('recycle')
    .description('查看回收站')
    .action(async () => {
      const res = await api.get('/api/admin/article/recycle');
      output.success(res.data || res);
    });

  cmd.command('restore')
    .description('从回收站恢复文章')
    .argument('<id>', '文章 ID')
    .action(async (id) => {
      await api.put(`/api/admin/article/${id}/restore`);
      output.successWithMessage(null, '文章已恢复');
    });
}

module.exports = { register };
