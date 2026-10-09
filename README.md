# Cardo · 深度工作与精力管理系统 (Cartesian Architecture)

> **Cardo（卡尔多 / 枢轴）** — 来源于罗马古建筑与笛卡尔网格中的南北主轴（Cardo Maximus），象征在注意力碎片化的时代，为心智建立起一道笔直、纯净、免受侵扰的**单通道工作枢轴**。
>
> 结合 **Cartesian 建筑志与博物馆图录美学**，基于实证认知科学、注意力恢复理论（ART）与精力管理实证研究打造，彻底阻断**空档内耗反刍**、**多任务注意力残留**与**时间感知过度乐观**。

---

## 📸 系统视觉与架构概览 (Gallery & Highlights)

### 1. 规划阶段与实证精力管理 (Planning Architecture)
开阔的暖石画布与单发丝极简表单，集成实证精力法则横幅、4 步就绪仪式与多模态智能拆解。
![Cardo Planning Architecture](./docs/assets/cardo-planning.png)

### 2. 单通道深度执行与 Didone 艺术计时 (Execution Channel)
去除所有冗余封闭矩形，聚焦当前单一原子任务，提供大号 Didone 衬线艺术计时器、即时暂存读档与反刍阻断兜底通道。
![Cardo Execution Channel](./docs/assets/cardo-execution.png)

### 3. 时间感知校准与历史复盘分析 (History & Calibration)
多维度准确率收敛趋势、工时统计、多 Tab 读档中枢与任意历史轮次的一键恢复。
![Cardo History & Calibration](./docs/assets/cardo-history.png)

### 4. 移动端副屏实时协同 (Mobile Live Companion)
局域网一键直连，手机作为桌面端的触感秒表与打卡副屏，支持 PWA 全屏沉浸与触感震动反馈。
<div align="center">
  <img src="./docs/assets/cardo-mobile.png" width="360" alt="Cardo Mobile Companion" />
</div>

---

## 🏛️ Cartesian 视觉设计系统规范

本项目统一采用 **Cartesian**（笛卡尔/建筑志与博物馆图录）极简设计系统：

- **色彩哲学 (Color Palette)**：
  - **暖石画布**：`#EDE8E0`（`bg-cartesian-bg`），温暖自然的哑光暖灰石质纸感。
  - **浅石辅助色**：`#E2DBD1`（`bg-cartesian-bg-subtle`），用于微高亮与状态容器。
  - **主墨水色**：`#1A1A1A`（`text-cartesian-ink`），典雅致密的工学碳黑。
  - **次级灰度**：`#5A5A5A`（`text-cartesian-muted`）与暖灰标线 `#8A8178`（`text-cartesian-accent`）。
  - **矿物浅绿重音**：`bg-[#EAF1EB]` 与墨绿条 `#3B6647`，用于突出实证精力法则。
- **排版与字体 (Typography)**：
  - **中文与通用英文**：统一采用现代中西文混排体系（`Inter + PingFang SC / Microsoft YaHei / 微软雅黑 / Noto Sans SC / system-ui`），杜绝中英文混排撕裂。
  - **数字艺术计时器**：纯数字大时钟采用 `Playfair Display`（Didone 衬线体），突出时间的庄重与仪式感。
  - **眉标与元数据**：全大写 + `letter-spacing: 2px ~ 3px` 字符微间距。
- **几何与空间秩序 (Geometry & Layout)**：
  - **开阔去框线化 (No Bounding Boxes)**：消除传统卡片的厚重封闭黑边，内容直接在石色画布上呼吸。
  - **1px 发丝单横线 (Hairline System)**：功能分区与任务列表间仅采用 `1px` 极细横线（`border-b border-cartesian-line/30`）区隔。
  - **建筑圆规虚实圆环**：极简罗盘圆环装饰（`.geo-decoration`），呼应笛卡尔几何制图。

---

## ⚡ 核心设计与功能闭环

### 1. 深度工作三阶段闭环 (Planning · Execution · Review)
- **阶段一：规划架构 (Planning Architecture)**
  - 任务原子化微积分：严格将宏观目标拆解为 $\le 35$ 分钟的可验证单原子任务。
  - 兜底任务（Fallback Routine）：预设卡壳或等待时的低认知阻断活动，避免反刍思维与刷手机。
  - 智能读档抽屉：检测未完成轮次，支持一键「⚡ 继续读档执行」或「📝 载入到表单」。
  - **4 步专注就绪仪式 (Pre-Flight Protocols)**：
    1. **物理空间净化**：手机移出视线范围、桌面仅留必需工具、佩戴降噪耳塞。
    2. **数字干扰切断**：关闭通讯软件与桌面通知、开启单窗口全屏。
    3. **生理状态补给**：准备充足饮水、确认室温与自然光照。
    4. **认知通道锁定**：明确第一步物理级可执行动作，锁定单任务隔离通道。

- **阶段二：执行通道 (Execution Channel)**
  - 实时自适应计时器与「↺ 重置计时（Reset Timer）」支持。
  - 极简专注沉浸模式（**Zen Mode**，快捷键 `Alt + Z`）。
  - 键盘全流程盲操（`Ctrl + Enter` 标记完成、`Alt + F` 切换兜底任务）。
  - 基于 Web Audio API 动态合成的柔和双音提示音（零网络外部音频依赖）。
  - 随时点击「⏸ 暂存读档」，安全保存现场并退回主页。

- **阶段三：反思与时间感知校准 (Reflection & Flywheel)**
  - 预估耗时 vs 实际耗时逐项明细与偏差比例。
  - 准确率量化计算（$\pm 20\%$ 判定为准确）。
  - 时间感知智能校准建议，驱动时间感知能力飞轮式进化。

---

### 2. 智能 Agentic 多模态工程探查 Tooling 套件
集成强大的本地工程与多模态文件探索能力，辅助大模型进行高精准度的任务拆解：
- `inspect_project_structure`：目录深度与树状结构全景扫描。
- `search_files`：基于正则表达式与关键字的多文件内容检索。
- `read_file`：跨文件精读源码与配置文件。
- `read_image`：多模态视觉解析设计稿、架构草图与截图。
- `list_directory` / `find_by_name`：快速定位文件与模块边界。

---

### 3. 局域网跨设备副屏实时同步
- **专属路由**：`/mobile`
- **局域网 Wi-Fi 直连**：自动嗅探本机内网 IP（`/api/network/ip`），手机扫码即连或直接保存书签。
- **打卡触感震动反馈**：手机点击任务完成时触发硬件级触觉振动（`navigator.vibrate`），实时双向推送到桌面端。
- **PWA 支持**：支持添加到手机桌面主屏幕，全屏独立运行。

---

## 🌿 鸣谢与实证科学致谢 (Acknowledgments)

本项目中的核心精力管理方法论、实证科学机理库与 4 步就绪仪式规范，深度参考并致谢 GitHub 开源项目：

- **[HowToLiveBetter (如何更好地生活 / 《不要浪费精力》)](https://github.com/HowToLiveBetter)**
  - 感谢该知识库对运动抗抑郁（Noetel 2024 BMJ）、微小打断认知成本（Altmann 2014）、手机视线隔离（Ward 2017）、噪音与认知损耗（Jahncke 2011）、睡眠剥夺累积效应（Van Dongen 2003）以及情绪降温机理（Kjærvik 2024）等大量顶级医学与认知科学文献（RCT / Meta-analysis）的系统性梳理。

---

## 🚀 快速启动与部署指南

### 环境依赖
- Node.js 18.17+ 或 20+
- npm / pnpm / yarn

### 安装与运行

```bash
# 1. 克隆代码仓库
git clone https://github.com/your-username/Cardo.git
cd Cardo

# 2. 安装依赖
npm install

# 3. 本地开发模式 (默认端口 3025)
npm run dev

# 4. 生产构建与启动
npm run build
npm start
```

### Windows 无头后台静默启动
内置 PowerShell 无头后台守护脚本，支持一键开机常驻与热重启：
```powershell
# 启动或重启后台服务 (无终端窗口阻塞)
Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-File", "scripts\start-background.ps1", "-Restart" -WindowStyle Hidden
```
- 服务访问地址：`http://localhost:3025`
- 移动端副屏地址：`http://localhost:3025/mobile`
- 运行日志：`.logs/cardo.log`，PID：`.run/cardo.pid`

---

## ⌨️ 快捷键指南 (Keyboard Shortcuts)

| 快捷键 | 功能说明 |
| :--- | :--- |
| `Ctrl + Enter` / `Cmd + Enter` | 标记当前原子任务完成并切换至下一个 |
| `Alt + Z` | 进入 / 退出极简专注沉浸模式 (Zen Mode) |
| `Alt + F` | 展开 / 折叠反刍阻断兜底任务 (Fallback Routine) |
| `Enter` (在添加输入框中) | 快速添加临时子任务 |

---

## 📄 License
MIT License © 2026 Cardo Contributors.
