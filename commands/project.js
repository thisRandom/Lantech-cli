const api = require('../lib/api');
const output = require('../lib/output');

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
    .option('--tags <tags>', '标签名，逗号分隔')
    .action(async (options) => {
      const data = { title: options.title };
      if (options.description) data.description = options.description;
      if (options.url) data.url = options.url;
      if (options.tags) data.tags = options.tags.split(',').map(t => t.trim()).filter(Boolean);
      await api.post('/api/admin/project/save', data);
      output.successWithMessage(null, '项目已创建');
    });

  cmd.command('update')
    .description('编辑项目')
    .requiredOption('--id <id>', '项目 ID')
    .option('--title <title>', '新标题')
    .option('--description <desc>', '新描述')
    .option('--url <url>', '新链接')
    .option('--tags <tags>', '标签名，逗号分隔')
    .action(async (options) => {
      const data = { id: parseInt(options.id) };
      if (options.title) data.title = options.title;
      if (options.description) data.description = options.description;
      if (options.url) data.url = options.url;
      if (options.tags) data.tags = options.tags.split(',').map(t => t.trim()).filter(Boolean);
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
