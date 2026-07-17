const config = require('../lib/config');
const output = require('../lib/output');

function register(program) {
  const cmd = program.command('config')
    .description('管理 CLI 配置');

  cmd.command('set')
    .description('设置 API Key 和地址')
    .option('--key <key>', 'API Key')
    .option('--url <url>', 'API 地址（默认 https://lantech.top）')
    .action((options) => {
      if (!options.key) {
        console.error('错误：请指定 --key 参数');
        process.exit(1);
      }
      const cfg = config.load();
      if (options.key) cfg.apiKey = options.key;
      if (options.url) cfg.baseUrl = options.url.replace(/\/+$/, '');
      config.save(cfg);
      output.successWithMessage(null, '配置已保存');
    });

  cmd.command('show')
    .description('查看当前配置')
    .action(() => {
      const cfg = config.load();
      output.success({
        apiKey: cfg.apiKey ? cfg.apiKey.substring(0, 12) + '****' : '(未配置)',
        baseUrl: cfg.baseUrl || '(未配置)',
      });
    });
}

module.exports = { register };
