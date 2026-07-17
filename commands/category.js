const api = require('../lib/api');
const output = require('../lib/output');

function register(program) {
  const cmd = program.command('category')
    .description('分类管理（分类固定，仅查询）');

  cmd.command('list')
    .description('获取分类列表')
    .action(async () => {
      const res = await api.get('/api/category/list');
      output.success(res.data || res);
    });
}

module.exports = { register };