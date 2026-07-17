# lantech-cli Skill

通过 CLI 管理 LanTech 博客内容。所有命令直接执行。

## 协作原则

- **AI 负责**：撰写草稿、推荐分类/标签、上传图片、创建文章
- **人类负责**：用 AI 生成图片并下载到本地、审核内容、确认发布
- 不执行删除操作，除非用户明确要求
- 拿不准的决策问用户，不要替用户做决定

---

## 写一篇文章的完整流程

### 第一步：确认基本信息

与用户确认以下内容：

1. **文章标题**
2. **正文方向** — AI 起草大纲，用户确认
3. **分类** — `category list`（固定，不新增）
4. **标签** — 先 `tag list` 查已有的。需新建则**询问用户**
5. **是否需要封面图** — 默认需要
6. **是否需要正文插图** — 默认需要

### 第二步：准备封面图

AI 提供提示词 → 用户生成并下载 → AI 上传到 OSS

```
lantech-cli oss upload --file "用户路径" --type cover --desc "封面描述"
```

保存返回的 URL。

### 第三步：准备正文插图

AI 描述配图 → 用户生成并下载 → AI 全部上传 → 拿到所有 URL

```
lantech-cli oss upload --file "路径" --type article --desc "图片描述"
```

### 第四步：撰写正文

图片 URL 直接嵌入 Markdown。长正文建议写入文件后用 `--content-file`：

```
lantech-cli article create \
  --title "标题" \
  --content-file /tmp/article.md \
  --summary "一句话摘要" \
  --category <id> \
  --tag-ids "26,11" \
  --cover "封面URL" \
  --status 0
```

### 第五步：获取 ID

```
lantech-cli article list --keyword "标题关键字"
```

### 第六步：发布

- 无 TODO + 有封面 → 问用户 → 确认后发布
- 有 TODO → 禁止发布，用户手动发
- 无封面 → 禁止发布

---

## 命令参考

### 文章管理

```
article list [--page N] [--size N] [--keyword "标题"] [--status 0|1]
article get <id>
article create --title "标题" --content "正文" --category <id>
               [--content-file <path>] [--summary "摘要"]
               [--tag-ids "1,2"] [--cover "URL"] [--status 0]
article update <id> [--title "新标题"] [--content "新正文"]
               [--content-file <path>] [--summary "新摘要"]
               [--tag-ids "1,2"] [--cover "URL"] [--status 0|1]
article publish <id> / unpublish <id>
article delete <id> / restore <id> / recycle
```

> `update` 只传需要改的字段即可，其余自动保留。
> 长正文建议用 `--content-file` 从文件读取，避免 shell 转义问题。

### 分类 / 标签

```
category list
tag list | tag create --name "新标签"
```

`tag list` 查看标签 ID，`--tag-ids` 传 ID 数组。

### OSS 图片上传

```
oss upload --file "本地路径" --type cover|article|default [--desc "描述"]
```

### 统计与状态

```
stats show | cert status | system status
```

---

## 禁止操作

以下操作 AI 不得执行：删除文章（除非用户明确要求）、修改系统配置、管理用户和角色、管理 AI 密钥。
