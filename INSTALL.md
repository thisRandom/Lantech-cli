# 安装 lantech-cli

让 AI agent 通过命令行管理 LanTech 博客内容。

## 安装 CLI

```
curl -s https://cli.lantech.top/lantech-cli-1.0.0.tgz | tar xz
cd package && npm install -g . && cd ..
```

## 配置

```
lantech-cli config set --key "lantech_你的API密钥"
```

## 安装 Skill

```
curl -s https://cli.lantech.top/SKILL.md -o ~/.claude/skills/lantech-cli.md
```

## 验证

```
lantech-cli permissions check
```
