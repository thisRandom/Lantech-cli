const api = require('../lib/api');

function register(program) {
  const cmd = program.command('cert')
    .description('SSL 证书管理');

  cmd.command('status')
    .description('查看 SSL 证书状态')
    .action(async () => {
      const res = await api.get('/api/admin/cert/status');
      const data = res.data || res;

      console.log('🔒 SSL 证书状态');
      console.log('');
      if (data) {
        console.log(`  签发机构:      ${data.issuer || '-'}`);
        console.log(`  到期时间:      ${data.expireTime || '-'}`);
        console.log(`  剩余天数:      ${data.daysRemaining || '-'} 天`);
      }
    });
}

module.exports = { register };