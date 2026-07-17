const api = require('../lib/api');

function register(program) {
  const cmd = program.command('stats')
    .description('查看博客统计数据');

  cmd.command('show')
    .description('显示博客统计数据')
    .action(async () => {
      const [baseRes, aiRes] = await Promise.all([
        api.get('/api/admin/stats/baseData'),
        api.get('/api/admin/stats/aiData').catch(() => ({ data: null })),
      ]);

      const base = baseRes.data || baseRes;

      console.log('📊 博客统计数据');
      console.log('');

      if (base) {
        console.log(`  文章总数:      ${base.totalArticles || 0}`);
        console.log(`  总访问量:      ${base.totalViews || 0}`);
        console.log(`  本月发布:      ${base.monthlyArticles || 0}`);
        console.log(`  运行天数:      ${base.runningDays || 0}`);
        console.log(`  总评论:        ${base.totalComments || 0}`);
      }

      const ai = aiRes.data || aiRes;
      if (ai) {
        console.log('');
        console.log('  AI 摘要统计:');
        console.log(`  总 Token 消耗: ${ai.totalTokens || 0}`);
        console.log(`  摘要数量:      ${ai.totalSummaries || 0}`);
      }

      console.log('');
      console.log('  提示：使用 lantech-cli article list 查看文章列表');
    });
}

module.exports = { register };
