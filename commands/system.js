const api = require('../lib/api');
const { spawnSync } = require('child_process');
const pkg = require('../package.json');

// 固定下载地址：文件名不带版本号，方便 update 命令直接使用
const TARBALL_URL = 'https://cli.lantech.top/lantech-cli.tgz';

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

  // 顶层 update 命令：从 cli.lantech.top 拉最新 tgz，交给 npm 全局重装
  // 走 npm install -g <url> 不需要用户 cd 到临时目录，也不用手动 tar
  program.command('update')
    .description('更新 lantech-cli 到最新版本')
    .action(() => {
      console.log('当前版本：' + pkg.version);
      console.log('从 ' + TARBALL_URL + ' 拉取最新版本 ...');
      // 用 spawnSync 直连 stdio，让 npm 的进度条/错误直接透传
      // shell:true 保证 Windows 上能找到 npm.cmd
      const r = spawnSync('npm', ['install', '-g', TARBALL_URL], {
        stdio: 'inherit',
        shell: true,
      });
      if (r.status !== 0) {
        console.error('错误：更新失败（npm 退出码 ' + r.status + '）');
        console.error('提示：如提示权限不足，请以管理员身份重新运行；或手动执行：');
        console.error('  npm install -g ' + TARBALL_URL);
        process.exit(r.status || 1);
      }
      console.log('');
      console.log('✓ 更新完成，运行 lantech-cli --version 查看新版本');
    });
}

module.exports = { register };
