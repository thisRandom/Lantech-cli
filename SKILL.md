# lantech-cli Skill

通过 CLI 管理 LanTech 博客内容。所有命令直接执行，无需构造 HTTP 请求。

## 协作原则

- **AI 负责**：撰写草稿、推荐分类/标签、创建/更新内容、优化格式
- **人类负责**：审核内容、在后台发布
- 文章中有 `<!-- TODO: ... -->` 图片标记 → **禁止发布**，等用户补图后手动发布
- 封面图为空 → **禁止发布**
- 不执行删除操作，除非用户明确要求

## 命令参考

### 文章管理

```
article list [--page N] [--size N] [--keyword "标题"] [--status 0|1]
article get <id>
article create --title "标题" --content "## 正文" --category <id> [--tags "a,b"] [--status 0]
article update <id> [--title "新标题"] [--content "新内容"] [--tags "a,b"]
article publish <id>
article unpublish <id>
article delete <id>
article restore <id>
article recycle
```

创建流程：查分类 → `category list` → 写正文 → 传图片 → `oss upload` → `article create --status 0` → `article list --keyword` 获取 ID → 告知用户审核。

### 分类 / 标签

```
category list
tag list | tag create --name "新标签" | tag update --id 1 --name "新名称" | tag delete <id>
```

分类固定，不新增。创建文章时 `--tags` 传不存在的名字会自动创建。

### 项目

```
project list | project create --title "项目" [--description "描述"] | project delete <id>
```

### OSS 图片上传

```
oss upload --file "本地图片路径" --type article|cover|avatar|project|default
```

上传成功返回 OSS URL，用于 `article update <id> --cover "URL"`。

### 统计与状态

```
stats show           # 文章数、访问量、运行天数
cert status          # SSL 证书到期
system status        # 系统运行状态
```

## 场景速查

| 用户说 | 执行 |
|--------|------|
| "写篇文章" | `category list` → `article create --status 0` → 查 ID → 告知用户审核 |
| "改标题/内容" | `article update <id> --title "新标题"` |
| "加标签" | `article update <id> --tags "已有标签1,已有标签2,新标签"`（不存在的自动创建） |
| "发出去" | 检查无 TODO 标记、有封面 → `article publish <id>` |
