const api = require('../lib/api');

function register(program) {
  const cmd = program.command('system')
    .description('系统状态管理');

  cmd.command('status')
    .description('查看系统运行状态（CPU、内存等）')
    .action(async () => {
      const res = await api.get('/api/admin/system/status');
      const data = res.data || res;

      console.log('🖥️  系统运行状态');
      console.log('');
      if (data) {
        const fields = ['操作系统', 'CPU 占用', '系统负载', '系统内存', '运行时间', 'Java 版本'];
        for (const key of fields) {
          if (data[key] !== undefined && data[key] !== null) {
            console.log(`  ${key}:      ${data[key]}`);
          }
        }
      }
    });
}

module.exports = { register };
