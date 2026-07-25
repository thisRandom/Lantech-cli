const api = require('../lib/api');
const axios = require('axios');
const readline = require('readline');
const { spawnSync } = require('child_process');
const config = require('../lib/config');
const pkg = require('../package.json');

// 固定下载地址：文件名不带版本号，方便 update 命令直接使用
const TARBALL_URL = 'https://cli.lantech.top/lantech-cli.tgz';

/**
 * 比较两个语义化版本号
 * 返回 1 表示 a > b，-1 表示 a < b，0 表示相等
 * 只比较数字段，忽略 v 前缀和预发布后缀
 */
function compareVersion(a, b) {
  const parse = v => String(v).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

/**
 * 询问用户 y/n，返回 Promise<boolean>
 */
function confirm(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

/**
 * 拉取最新版本信息（公开接口，无需 API Key，但必须带 Referer 否则被拦截）
 */
async function fetchLatest() {
  const base = config.getBaseUrl();
  const res = await axios.get(base + '/api/version/check', {
    params: { platform: 'cli' },
    timeout: 15000,
    headers: { 'Referer': config.getReferer() },
  });
  const body = res.data;
  if (!body || body.code !== 200 || !body.data) {
    throw new Error((body && body.message) || '版本接口返回异常');
  }
  return body.data; // { version, log, url }
}

/**
 * 执行更新：优先用接口返回的 url，无效时回退到固定 tarball 地址
 */
function runInstall(url) {
  const target = (typeof url === 'string' && /^https?:\/\//i.test(url)) ? url : TARBALL_URL;
  console.log('从 ' + target + ' 拉取最新版本 ...');
  // 用 spawnSync 直连 stdio，让 npm 的进度条/错误直接透传
  // shell:true 保证 Windows 上能找到 npm.cmd
  const r = spawnSync('npm', ['install', '-g', target], {
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) {
    console.error('错误：更新失败（npm 退出码 ' + r.status + '）');
    console.error('提示：如提示权限不足，请以管理员身份重新运行；或手动执行：');
    console.error('  npm install -g ' + target);
    process.exit(r.status || 1);
  }
  console.log('');
  console.log('✓ 更新完成，运行 lantech-cli --version 查看新版本');
}

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

  // 顶层 update 命令：先查最新版本，与本地对比，有新版本才询问用户是否更新
  program.command('update')
    .description('检查并更新 lantech-cli 到最新版本')
    .option('-y, --yes', '跳过确认，检测到新版本直接更新')
    .option('-f, --force', '忽略版本比较，强制重新安装最新版本')
    .action(async (opts) => {
      console.log('当前版本：' + pkg.version);

      let latest;
      try {
        latest = await fetchLatest();
      } catch (e) {
        console.error('错误：获取版本信息失败 - ' + (e.message || '未知错误'));
        process.exit(1);
      }

      console.log('最新版本：' + latest.version);

      const cmp = compareVersion(latest.version, pkg.version);

      if (!opts.force && cmp <= 0) {
        console.log('');
        console.log('✓ 已是最新版本，无需更新');
        return;
      }

      // 展示更新日志
      if (latest.log) {
        console.log('');
        console.log('📋 更新日志：');
        console.log(String(latest.log).split('\n').map(l => '  ' + l).join('\n'));
      }

      // 确认
      if (!opts.yes) {
        console.log('');
        const ok = await confirm('是否更新到 ' + latest.version + '？(y/N) ');
        if (!ok) {
          console.log('已取消更新');
          return;
        }
      }

      console.log('');
      runInstall(latest.url);
    });
}

module.exports = { register };
