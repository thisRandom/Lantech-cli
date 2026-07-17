const api = require('../lib/api');
const output = require('../lib/output');

function register(program) {
  program.command('permissions')
    .description('验证 Key 权限，显示可用的接口列表')
    .argument('[action]', 'check（默认）')
    .action(async (action) => {
      try {
        const res = await api.get('/api/admin/ai/docs');
        const data = res.data || res;
        const endpoints = data.endpoints || [];
        console.log('✓ 认证成功！API Key 有效');
        console.log('');
        console.log(`可调用的接口（共 ${endpoints.length} 个）：`);
        console.log('');
        for (const ep of endpoints) {
          console.log(`  ${ep.method.padEnd(6)} ${ep.path}`);
          if (ep.description) {
            console.log(`          ${ep.description}`);
          }
        }
      } catch (e) {
        // api.js 统一错误处理会 exit，这里仅为兜底
        console.error('错误：认证失败，请检查 API Key 和地址配置');
        process.exit(1);
      }
    });
}

module.exports = { register };
