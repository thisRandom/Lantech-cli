#!/usr/bin/env node
const { program } = require('commander');

program
  .name('lantech-cli')
  .description('LanTech Blog CLI - 管理博客内容的命令行工具')
  .version('1.0.1');

require('../commands/config').register(program);
require('../commands/permissions').register(program);
require('../commands/article').register(program);
require('../commands/category').register(program);
require('../commands/tag').register(program);
require('../commands/project').register(program);
require('../commands/oss').register(program);
require('../commands/stats').register(program);
require('../commands/cert').register(program);
require('../commands/system').register(program);

program.on('command:*', () => {
  console.error('错误：未知命令，请使用 lantech-cli --help 查看可用命令');
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
