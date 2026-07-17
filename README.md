# lantech-cli

LanTech 博客 CLI 工具。让 AI agent 通过命令行管理博客内容，无需手动拼接 HTTP 请求。

## 安装

### 从 OSS 安装（推荐）

```bash
# 下载并全局安装
curl -s -H "Referer: https://lantech.top" \
  https://cli.lantech.top/lantech-cli-1.0.0.tgz \
  | tar xz && cd package && npm install -g . && cd ..
```

### 本地开发

```bash
# 项目目录下直接运行
node bin/cli.js <command>

# 或全局安装
npm install -g .
lantech-cli <command>
```

## 配置

首次使用需配置 API Key 和服务器地址：

```bash
# 设置 API Key
lantech-cli config set --key "lantech_你的API密钥"

# 设置服务器地址（可选，默认 https://lantech.top）
lantech-cli config set --key "xxx" --url "https://lantech.top"

# 查看当前配置
lantech-cli config show
```

配置存储在 `~/.lantech/config.json`，也可通过环境变量覆盖：
- `LANTECH_API_KEY` — API Key
- `LANTECH_BASE_URL` — 服务器地址

## 验证

配置完成后验证是否正常工作：

```bash
lantech-cli permissions check
```

返回当前 Key 有权限调用的接口列表即表示配置成功。如果返回权限不足的提示，需在博客后台「AI 密钥管理」→ 编辑密钥中勾选所需权限。

---

## 命令参考

### 文章管理

```bash
# 列表（支持分页、搜索、筛选）
lantech-cli article list
lantech-cli article list --page 1 --size 10
lantech-cli article list --keyword "标题关键词"
lantech-cli article list --status 1           # 只显示已发布的
lantech-cli article list --category 1          # 按分类筛选

# 详情
lantech-cli article get 123

# 创建（必填：标题、内容、分类）
lantech-cli article create \
  --title "文章标题" \
  --content "## 二级标题\n\n正文内容" \
  --category 1

# 创建时可选的参数
lantech-cli article create \
  --title "文章标题" \
  --content "## 正文" \
  --category 1 \
  --tags "Vue,Java,前端" \
  --status 0                     # 0=草稿（默认） 1=发布

# 更新（只传需要改的字段）
lantech-cli article update 123 --title "新标题"
lantech-cli article update 123 --content "新内容" --tags "标签1,标签2"

# 发布/下架
lantech-cli article publish 123
lantech-cli article unpublish 123

# 删除（移至回收站）
lantech-cli article delete 123

# 从回收站恢复
lantech-cli article restore 123

# 查看回收站
lantech-cli article recycle
```

### 分类管理

```bash
# 获取分类列表（博客分类固定，仅查询）
lantech-cli category list
```

### 标签管理

```bash
# 列表
lantech-cli tag list

# 新增
lantech-cli tag create --name "新标签"

# 编辑
lantech-cli tag update --id 1 --name "新名称"

# 删除
lantech-cli tag delete 1

# 批量删除
lantech-cli tag delete-batch --ids "1,2,3"
```

### 项目管理

```bash
# 列表
lantech-cli project list

# 新增
lantech-cli project create --title "项目标题" \
  --description "项目描述" \
  --url "https://github.com/xxx" \
  --tags "Java,Vue"

# 编辑
lantech-cli project update --id 1 --title "新标题"

# 删除
lantech-cli project delete 1
```

### OSS 资源管理

```bash
# 资源列表
lantech-cli oss list
lantech-cli oss list --page 1 --size 20

# 上传本地图片到 OSS
lantech-cli oss upload --file "D:\图片\photo.jpg" --type article

# type 可选类型：
#   article  - 文章插图（blog/articles/）
#   cover    - 文章封面（blog/covers/）
#   avatar   - 用户头像（blog/avatars/）
#   project  - 项目图片（blog/projects/）
#   config   - 配置图片（blog/config/）
#   default  - 其他杂项（blog/misc/）
```

上传成功后返回 OSS URL，可直接用于文章的 `cover` 字段或正文中。

### 统计与状态

```bash
# 博客数据统计
lantech-cli stats show
# 输出：文章总数、访问量、本月发布、运行天数等

# SSL 证书状态
lantech-cli cert status
# 输出：签发机构、到期时间、剩余天数

# 系统运行状态
lantech-cli system status
# 输出：操作系统、CPU 占用、内存、运行时间等
```

---

## AI Agent 使用方法

### 第一步：安装 CLI

```bash
curl -s -H "Referer: https://lantech.top" \
  https://cli.lantech.top/lantech-cli-1.0.0.tgz \
  | tar xz && cd package && npm install -g . && cd ..
```

### 第二步：配置

```bash
lantech-cli config set --key "lantech_你的API密钥"
lantech-cli permissions check
```

### 第三步：开始使用

AI agent 直接用 CLI 命令操作博客，不再需要构造 curl 请求。例如：

```bash
# 查一下最近的文章
lantech-cli article list --page 1 --size 5

# 获取分类
lantech-cli category list

# 创建一篇新文章（草稿状态）
lantech-cli article create \
  --title "用 CLI 写博客" \
  --content "## 概述\n\n这是通过命令行创建的文章。" \
  --category 1 \
  --tags "CLI,工具"

# 获取刚创建的文章 ID
lantech-cli article list --keyword "用 CLI 写博客"

# 上传一张配图
lantech-cli oss upload --file "./screenshot.png" --type article

# 把配图 URL 填入文章
lantech-cli article update <id> --cover "https://oss.lantech.top/blog/articles/xxx.png"

# 通知用户审核，审核通过后发布
lantech-cli article publish <id>
```

---

## 常见错误处理

| 错误 | 原因 | 解决 |
|------|------|------|
| `API Key 无效或已过期` | Key 被禁用或删除 | 后台重新创建 Key 并配置 |
| `权限不足，请在后台...` | Key 没有该操作权限 | 后台编辑 Key 勾选所需权限 |
| `无法连接到服务器` | 网络问题或地址错误 | 检查 `config show` 中的地址 |
| `请求超时` | 网络延迟 | 重试 |
| `文件不存在` | 图片路径错误 | 检查文件路径 |

---

## 更新

```bash
# 重新下载最新版本安装
curl -s -H "Referer: https://lantech.top" \
  https://cli.lantech.top/lantech-cli-1.0.0.tgz \
  | tar xz && cd package && npm install -g . && cd ..
```

## 卸载

```bash
npm uninstall -g lantech-cli
rm -rf ~/.lantech
```
