# 🐒 Monkey - 油猴脚本合集

> 基于 [Tampermonkey](https://www.tampermonkey.net/) 的个人实用工具脚本集合，旨在提升日常工作效率。

---

## 📦 脚本列表

| 脚本名称 | 版本 | 描述 | 匹配站点 |
|:--|:--|:--|:--|
| [Figma Activity Counter](#figma-activity-counter) | 9.5.6 | 统计 Figma 文件操作活跃度，支持设置面板、CSV导出和可拖拽悬浮球 | `figma.com` |

---

## 🔥 Figma Activity Counter

### 功能介绍

一款专为 Figma 用户设计的协作统计工具，可以帮助你快速了解团队成员在特定时间段内的操作活跃度。

#### ✨ 核心特性

- **月度活跃统计**：按关键词（如月份）筛选统计范围
- **自动 CSV 导出**：一键生成并下载统计报告
- **可拖拽悬浮球**：自由拖动按钮至屏幕任意位置，且位置自动保存
- **智能样式识别**：通过锚点文本自动识别 Figma 页面元素
- **本地设置持久化**：配置信息自动保存至 LocalStorage

#### 📸 使用流程

1. 打开任意 Figma 文件页面
2. 点击屏幕上的 🔥 悬浮球按钮
3. 在弹出面板中填写：
   - **锚点人名**：屏幕上可见的任意协作者名字（用于识别样式）
   - **日期范例**：屏幕上可见的任意日期小标题（如 `Jan 14, 4:41 PM`）
   - **过滤关键词**：统计范围，如 `Jan`、`Feb` 等月份缩写
4. 点击「保存并开始统计」
5. 统计完成后自动下载 CSV 报告

#### ⚠️ 注意事项

- 本工具主要用于统计**过往月份**的历史数据
- 因 Figma 格式差异，**"Today" (今日)** 的数据暂不包含在统计范围内

---

## 🛠️ 安装指南

### 前置条件

在你的浏览器中安装 **Tampermonkey** 扩展：

- [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

### 安装步骤

1. 点击浏览器工具栏中的 **Tampermonkey** 图标
2. 选择「添加新脚本」或「Create a new script...」
3. 清空编辑器内容，将所需脚本的 `.user.js` 文件内容粘贴进去
4. 按 `Ctrl + S` (Windows) 或 `Cmd + S` (Mac) 保存
5. 刷新目标网页即可生效

---

## 📁 项目结构

```
Monkey/
├── README.md                         # 本文档
├── Figma Activity Counter.user.js    # Figma 活跃度统计脚本
└── .gitignore                        # Git 忽略配置
```

---

## 🧑‍💻 作者

**Noiz77**

---

## 📄 许可证

本项目仅供个人学习与使用。

---

## 🗓️ 更新日志

### Figma Activity Counter

| 版本 | 日期 | 更新内容 |
|:--|:--|:--|
| 9.5.6 | 2026-01 | 初始发布版本，包含完整统计、CSV导出与可拖拽UI |

---

> 💡 **提示**：如需添加新脚本或有功能建议，欢迎贡献代码或提交 Issue！
