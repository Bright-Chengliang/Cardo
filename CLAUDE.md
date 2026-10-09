# Cardo · Claude / Agent Development Guidelines

## 1. Execution Safety & Non-Blocking Commands
- When executing commands or scripts that are expected to finish quickly but risk hanging, blocking the terminal, or keeping ports occupied (e.g. `scripts/start-background.ps1 -Restart` or service launcher daemons), **MUST use headless background non-blocking execution**:
  ```powershell
  Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-File", "D:\D_disk\Code\Focus\scripts\start-background.ps1", "-Restart" -WindowStyle Hidden
  ```
- **Never** synchronously block the interactive terminal with background daemons or server launcher scripts.

## 2. Visual Design Standard (Cartesian Design System)
- Unified **Cartesian** (Architectural monograph & museum catalog) aesthetic:
  - Backgrounds: `#EDE8E0` (sandstone / bone canvas), `#E2DBD1` (subtle cards / highlights)
  - Ink & Text: `#1A1A1A` (near-black ink), `#5A5A5A` (muted taupe gray)
  - Accents & Lines: `#8A8178` (accent), `#B8B0A4` (1px hairlines)
  - Typography: Modern Chinese HeiTi + `Inter` for unified typography, `Playfair Display` for big numerical timers.
  - Geometry: Minimalist 1px compass drafting circles, 1px horizontal/vertical hairlines, zero heavy shadows or bubble pills.

## 3. Ports & Service
- Default Port: `3025`
- Startup Script: `scripts/start-background.ps1`
- Logs: `.logs/cardo.log`, `.logs/cardo.err.log`
- PID: `.run/cardo.pid`
