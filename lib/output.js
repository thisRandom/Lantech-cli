/**
 * 输出成功结果（JSON 格式，AI 可直接解析）
 */
function success(data) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * 输出成功结果 + 友好提示
 */
function successWithMessage(data, message) {
  console.log('✓ ' + message);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * 输出表格样式的列表（适合人类阅读）
 */
function tableList(items, fields) {
  if (!items || items.length === 0) {
    console.log('（无数据）');
    return;
  }
  // 先输出 JSON 给 AI 用
  console.log(JSON.stringify(items, null, 2));
}

module.exports = { success, successWithMessage, tableList };
