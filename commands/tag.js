const api = require('../lib/api');
const output = require('../lib/output');

function register(program) {
  const cmd = program.command('tag')
    .description('标签管理');

  cmd.command('list')
    .description('获取标签列表')
    .action(async () => {
      const res = await api.get('/api/admin/tag/list');
      output.success(res.data || res);
    });

  cmd.command('create')
    .description('新增标签')
    .requiredOption('--name <name>', '标签名称')
    .action(async (options) => {
      await api.post('/api/admin/tag/add', { name: options.name });
      output.successWithMessage(null, '标签已创建');
    });

  cmd.command('update')
    .description('编辑标签')
    .requiredOption('--id <id>', '标签 ID')
    .requiredOption('--name <name>', '新名称')
    .action(async (options) => {
      await api.put('/api/admin/tag/update', { id: parseInt(options.id), name: options.name });
      output.successWithMessage(null, '标签已更新');
    });

  cmd.command('delete')
    .description('删除标签')
    .argument('<id>', '标签 ID')
    .action(async (id) => {
      await api.del(`/api/admin/tag/delete/${id}`);
      output.successWithMessage(null, '标签已删除');
    });

  cmd.command('delete-batch')
    .description('批量删除标签')
    .requiredOption('--ids <ids>', '标签 ID，逗号分隔')
    .action(async (options) => {
      const ids = options.ids.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      await api.del('/api/admin/tag/delete/batch', { data: { ids } });
      output.successWithMessage(null, `已删除 ${ids.length} 个标签`);
    });
}

module.exports = { register };