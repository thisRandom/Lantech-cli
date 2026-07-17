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

1. **文章标题** — 明确告知用户
2. **正文内容** — AI 起草大纲，用户确认方向
3. **分类** — 从 `category list` 中选择（分类固定，不新增）
4. **标签** — 先 `tag list` 查看已有标签，优先使用已有的。如需新建，**询问用户**是否创建
5. **是否需要封面图** — 默认需要
6. **是否需要正文插图** — 默认需要

### 第二步：准备封面图

AI 提供封面图提示词 → 用户生成并下载 → AI 上传到 OSS → 拿到 URL

1. AI 根据文章主题撰写封面图提示词（描述画面风格、色调、内容）
2. 用户用提示词在 ChatGPT/其他工具生成图片，下载到本地，告知 AI 文件路径
3. AI 上传：
   ```
   lantech-cli oss upload --file "用户提供的路径" --type cover
   ```
4. 保存返回的 URL

> 用户说"不要封面" → 跳过

### 第三步：准备正文插图

写正文之前，先确定配图并全部上传好：

1. AI 根据内容列出需要配图的位置及画面描述
2. 用户逐一生成并下载，告知 AI 路径
3. AI 逐个上传：
   ```
   lantech-cli oss upload --file "路径1" --type article
   lantech-cli oss upload --file "路径2" --type article
   ```
4. 拿到所有 URL，撰写正文时直接嵌入

> 用户说"不配图" → 跳过，正文中不留 TODO

### 第四步：撰写正文

将上一步上传的图片 URL 直接嵌入 Markdown：

```markdown
## 章节标题

文字描述...

![图片描述](https://oss.lantech.top/blog/articles/xxx.jpg)
```

正文已包含真实图片，**无需 TODO 标记**。

### 第五步：创建文章

所有参数齐全后执行：

```
lantech-cli article create \
  --title "文章标题" \
  --content "含图片的完整 Markdown" \
  --category <id> \
  --tags "标签1,标签2" \
  --cover "封面URL" \
  --status 0
```

获取文章 ID：

```
lantech-cli article list --keyword "标题关键字"
```

### 第六步：发布

- 正文中**无 TODO 标记** + 有封面 → 询问用户："内容已就绪，是否发布？" 确认后：
  ```
  lantech-cli article publish <id>
  ```
- 正文中**有 TODO 标记** → **禁止发布**，告知用户还有哪些未完成，由用户手动发布
- **封面为空** → **禁止发布**

---

## 命令参考

### 文章管理

```
article list [--page N] [--size N] [--keyword "标题"] [--status 0|1]
article get <id>
article create --title "标题" --content "正文" --category <id> [--tags "a,b"] [--cover "URL"] [--status 0]
article update <id> [--title "新标题"] [--content "新内容"] [--tags "a,b"] [--cover "URL"]
article publish <id> / unpublish <id>
article delete <id> / restore <id> / recycle
```

### 分类 / 标签

```
category list
tag list | tag create --name "新标签" | tag update --id 1 --name "新名称"
```

创建文章时 `--tags` 传不存在的名字会自动创建。但**应先询问用户**是否要新建。

### OSS 图片上传

```
oss upload --file "本地路径" --type cover|article|default
```

上传成功返回 URL，用于封面或正文插图。

### 统计与状态

```
stats show | cert status | system status
```

---

## 禁止操作

以下操作 AI **不得执行**：
- 删除文章（除非用户明确要求）
- 修改系统配置
- 管理用户和角色
- 管理 AI 密钥
