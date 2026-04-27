# 文档格式说明

## 文件命名规则

- 文件名格式：`doc-001.md`, `doc-002.md`, `doc-003.md` ...
- 数字必须连续，不连续则不会被加载
- 所有文档放在 `projects/` 目录下

## 文档结构

每个 Markdown 文档由两部分组成：

### 1. 元数据（YAML Front Matter）

位于文档开头的 `---` 之间，用于定义文档基本信息：

```markdown
---
name: 文档名称
version: 1.0.0
lastUpdated: 2024-01-15
description: 文档简短描述
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| name | ✅ | 文档/项目名称 |
| version | ❌ | 版本号，默认 1.0.0 |
| lastUpdated | ❌ | 最后更新日期 |
| description | ❌ | 简短描述 |

### 2. 正文内容（Markdown）

使用标准 Markdown 语法编写文档内容。

## Markdown 语法示例

### 标题

```markdown
# 一级标题（文档名，不推荐使用）
## 二级标题（章节）
### 三级标题（子章节）
```

> 💡 **提示**：标题会自动生成目录导航。

### 代码块

```python
# Python 代码
def hello():
    print("Hello, World!")
```

```javascript
// JavaScript 代码
function hello() {
    console.log("Hello!");
}
```

### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容 | 内容 | 内容 |
```

### 提示框

使用 HTML 语法添加提示和警告：

```html
> 💡 **提示**：这是一条提示信息。
```

```html
> ⚠️ **注意**：这是一条注意事项。
```

### 列表

```markdown
- 第一项
- 第二项
    - 子项（缩进 4 个空格）
- 第三项
```

## 示例文档

请参考 `doc-001.md` 查看完整的示例。
