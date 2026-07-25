# lantech-cli 项目约定

## 打包 / 发布

- **每次让我"重新打包"（`npm pack`）时，必须先 bump 版本号，再打包**——不允许用同一个版本号重复打包。
  - 默认 bump `package.json` 的 patch 位（如 1.0.2 → 1.0.3）。除非我明确说要 bump minor / major。
  - 版本来源唯一：`package.json`。`bin/cli.js` 的 `-V` 读的是 `pkg.version`，改版本号只改 `package.json` 即可，不要再硬编码。
- 打包产物文件名固定为 `lantech-cli.tgz`（不带版本号），对应下载地址 `https://cli.lantech.top/lantech-cli.tgz`。
  `npm pack` 会生成带版本号的文件（如 `lantech-cli-1.0.3.tgz`），打完后 `mv -f` 覆盖成 `lantech-cli.tgz`。
- 完整流程：bump `package.json` 版本 → `npm pack` → 重命名为 `lantech-cli.tgz` → 冒烟测试（`node bin/cli.js -V` 应显示新版本）→ commit → push。
- 打完包后提醒我：① 把 `lantech-cli.tgz` 上传到 `cli.lantech.top`；② 把版本接口 `/api/version/check?platform=cli` 的 `data.version` 同步成新版本号，`data.log` 填更新日志。

## 定位

- CLI 面向 AI agent 托管后台管理，人走 UI 操作。因此数据类命令**统一输出 JSON**（`lib/output.js` 的 `success`），不做表格美化。仅 `system status`、`update` 这类纯展示、结果不回填给下一条命令的输出可用友好格式。
