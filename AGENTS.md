# Cardo · Agent 常驻开发与执行规范 (Persistent Memory)

## 1. 指令安全与无头后台非阻塞执行规范
- 当执行预期短期内应该完成、但存在长期卡死、阻塞终端或超时的指令时（例如服务启动脚本、重启脚本、后台守护进程，如 `powershell -ExecutionPolicy Bypass -File "D:\D_disk\Code\Focus\scripts\start-background.ps1" -Restart`），**必须使用无头后台非阻塞模式执行**：
  ```powershell
  Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-File", "D:\D_disk\Code\Focus\scripts\start-background.ps1", "-Restart" -WindowStyle Hidden
  ```
- **严禁**在终端前台同步阻塞运行任何潜在长时间运行或占用端口等待的启动/重启脚本。

## 2. 视觉设计系统规范 (Cartesian Architecture System)
- 本项目统一采用 **Cartesian**（笛卡尔/建筑志与博物馆图录）设计系统：
  - **色彩体系**：
    - 画布底色：`#EDE8E0` (`bg-cartesian-bg`)
    - 浅石色卡片底色：`#E2DBD1` (`bg-cartesian-bg-subtle`)
    - 硫酸纸卡片：`rgba(255, 255, 255, 0.45)` + `border: 1px solid #B8B0A4`
    - 主墨水色：`#1A1A1A` (`text-cartesian-ink`)
    - 次级灰度：`#5A5A5A` (`text-cartesian-muted`)
    - 标签与标线：`#8A8178` (`text-cartesian-accent`)、`#B8B0A4` (`border-cartesian-line`)
  - **字体体系**：
    - 统一现代黑体与 Inter 混排体系（`Inter + PingFang SC / Microsoft YaHei / 微软雅黑 / Noto Sans SC / system-ui`）
    - 大计时器数字：`Playfair Display, serif`
    - 眉标与状态：全大写 + `letter-spacing: 2px ~ 3px`
  - **几何装饰**：极简建筑圆规虚实圆环（`.geo-decoration`, `.geo-ring-lg`）、1px 发丝细线（`.cartesian-divider`, `border-cartesian-line`）。严格去除 Memphic 糖果色与胶囊高饱和圆角。

## 3. 服务与端口
- 默认端口：`3025`
- 启动脚本：`scripts/start-background.ps1`
- 日志文件：`.logs/cardo.log`, `.logs/cardo.err.log`
- 进程 PID：`.run/cardo.pid`
