# Cardo · 单任务专注与时间校准小工具

> **Cardo** 是一个面向开发者和研究者的**单任务专注与时间预估校准小工具**。
>
> 结合 Agent 本地工程代码检索与多模态解析，帮你把宏观大目标拆解为可落地的具体小任务；并参考历史同类任务的真实执行耗时进行动态校准，让任务时间预估越来越准。

---

## 🎯 解决了什么实际问题？

在日常编码与工程研究中，常常会遇到以下小困扰：

1. **大目标无从下手 / 缺乏具体下一步**
   - 目标写得太宽泛（如「重构后端存储层」），中途容易迷失或拖延；
   - **Cardo 做法**：Agent 自动扫描本地代码结构与依赖，拆解为 $\le 35$ 分钟的可执行单任务，并支持自然语言对话微调。
2. **任务时间预估永远过于乐观（计划谬误）**
   - 凭感觉预估往往偏差很大，缺乏客观参照；
   - **Cardo 做法**：自动记录每次任务的真实用时，并在后续规划同类任务时结合历史真实数据进行加权参考，让预估时间越来越贴合个人真实节奏。
3. **编译、跑测试或卡壳时容易走神**
   - 几分钟的等待空档容易顺手拿起手机，打断后再回过神往往耗费大量时间；
   - **Cardo 做法**：预设 **Fallback Routine（兜底小任务）**，等待或卡壳时一键切换做点低认知整理活（如看一段接口文档、整理代码注释），保持专注状态。
4. **缺少独立的时间感知提醒**
   - **Cardo 做法**：局域网手机副屏打卡（同一 Wi-Fi 免配置直接扫码/打开），手机作为桌面端的触感震动打卡器与秒表。

---

## 📸 功能视图

| 规划与 Agent 拆解 (Planning) | 单任务执行通道 (Execution) |
| :---: | :---: |
| ![Planning Architecture](./docs/assets/cardo-planning.png) | ![Execution Channel](./docs/assets/cardo-execution.png) |
| **本地代码多模态探查 · 4 步就绪检查 · 精力贴士** | **单通道聚焦 · 纯数字时钟 · 兜底任务一键切换** |

| 时间偏差复盘 (History & Calibration) | 局域网副屏协同 (Mobile Companion) |
| :---: | :---: |
| ![History & Calibration](./docs/assets/cardo-history.png) | <img src="./docs/assets/cardo-mobile.png" width="300" alt="Mobile Companion" /> |
| **预估偏差统计 · 历史任务管理 · 随时读档恢复** | **100% 局域网 Wi-Fi 直连 · 触感震动打卡 · PWA** |

---

## 🛠️ 主要功能一览

### 1. Agent 代码感知拆解与时间校准
- 🔍 **本地工程与多模态检索**：
  - `search_files`：多文件代码正则检索，定位函数定义与 API 接口；
  - `inspect_project_structure`：扫描工程目录树与核心清单（README/package.json/Cargo.toml 等）；
  - `read_file`：跨文件精读源码实现细节；
  - `read_image`：多模态识别 UI 原型图、架构设计草图与白板图。
- 💬 **对话式任务微调**：支持自然语言随时调整步骤粒度（如「把第 2 步拆细一点」「为单测多留 15% 缓冲时间」）；执行过程中也可继续多轮对话，让 Agent 根据实际进展重排、拆分或重构剩余任务。
- 📈 **参考历史耗时的有据预估**：自动召回历史同类任务的真实执行耗时进行加权融合，越用越准。

### 2. 执行与注意力保护
- ⏱️ **整轮总用时计时**：大字号纯数字累计本轮真实专注时长（暂停不计时）；子任务默认不计独立用时（现实中任务常相互耦合、顺手完成），需要时可为个别任务手动补录；
- ✅ **任意顺序 / 顺手完成**：不强制按预期顺序推进，做 A 时把 B、C 一起做完，可随手勾掉任意任务，完成当前聚焦任务自动续接下一个；
- ✏️ **执行中实时编辑**：剩余任务可随时改标题、调预估、增删、上移下移，计划走样随时修正；
- 🤖 **执行期 Agent 对话**（多轮记忆）：把实际进展告诉 Agent，让它思考并重排、拆分或增删剩余任务；对话随本轮会话持久保存，刷新或手机端可继续；
- 🔕 **Zen 沉浸模式**（快捷键 `Alt + Z`）：隐藏一切非必要元素，只保留当前任务与总用时时钟；
- ⏸️ **防卡壳兜底任务**（快捷键 `Alt + F`）：等待或卡壳时阻断无意识刷手机；
- 📋 **4 步就绪清单**：物理隔离、切断通知、生理补给、锁定单任务；
- 💾 **随时暂存读档**：支持随时「⏸ 暂存读档」退出，主页与历史页随时一键恢复现场。

### 3. 局域网手机副屏 (100% 本地离线)
- 手机与电脑在同一 Wi-Fi 下，直接访问内网地址（`/mobile`）即可作为桌面端副屏；
- 点击完成带手机系统级触感震动反馈，零公网服务器依赖，零隐私泄露风险。

---

## 🌿 致谢 (Acknowledgments)

本项目中的部分精力管理技巧与 4 步就绪指引，参考了 GitHub 开源知识库：
- **[HowToLiveBetter (如何更好地生活 / 《不要浪费精力》)](https://github.com/HowToLiveBetter)**

---

## 🚀 快速启动

### 环境要求
- Node.js 18.17+ 或 20+

### 本地运行

```bash
# 1. 克隆代码
git clone https://github.com/Bright-Chengliang/Cardo.git
cd Cardo

# 2. 安装依赖
npm install

# 3. 开发模式 (默认端口 3025)
npm run dev

# 4. 生产构建运行
npm run build
npm start
```

### Windows 后台静默运行
内置 PowerShell 后台启动脚本（避免占用终端窗口）：
```powershell
Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-File", "scripts\start-background.ps1", "-Restart" -WindowStyle Hidden
```
- 访问地址：`http://localhost:3025`
- 手机副屏：`http://localhost:3025/mobile`
- 日志文件：`.logs/cardo.log`

---

## ⌨️ 常用快捷键

| 快捷键 | 功能 |
| :--- | :--- |
| `Ctrl + Enter` / `Cmd + Enter` | 标记当前子任务完成并切换到下一项 |
| `Alt + Z` | 进入 / 退出极简沉浸模式 (Zen Mode) |
| `Alt + F` | 展开 / 折叠等待兜底任务 (Fallback Routine) |
| `Enter` (在输入框中) | 快速添加临时子任务 |

---

## 📄 License
MIT License © 2026 Cardo Contributors.
