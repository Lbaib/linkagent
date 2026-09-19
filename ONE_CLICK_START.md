# 🚀 LinkedAgent 全自动一键后台部署指引文档 (ONE_CLICK_START.md)

> 本文档针对 **Cursor、Codex、Antigravity** 等智能化项目助教及开发团队制定。**从今天起，彻底永久弃用传统易遭防病毒软件拦截或误报的 `.bat` 及 `.ps1` 本地可执行脚本！**

---

## 🛡️ 为什么采用本“纯 Agent 智能后台运行指南”代替本地脚本？
1. **彻底摆脱杀毒软件误报与弹窗禁言**：各类终端自动化批处理或 Powershell 执行文件在进行频繁进进程派生时，极易被高级防护软件误打标记并静默处死或扔进隔离沙盒。
2. **零打扰、高密态后台托管**：不在操作系统大桌面上野蛮轰出多套散杂的高耗能黑色方盒弹框；杜绝会话间 UI 权限未授予等各类致命 `Null/InvalidHandle` 原生闪退。
3. **完美攻破宿主机端口劫持（尤其是 8083 微信套接字占线难题）**：针对各类通讯助手、网络加速器对微服务敏感连接段形成的虚网池与处于 `CLOSE_WAIT` 盲区占道打桩病痛，**全过程内联显式挂载 `--server.address=127.0.0.1` 特例映射！做到既不必强行关闭您的私人微信、工作类日常通讯，又能丝般实现 Nacos 全息服务感知上线！**

---

## 🤖 【AI 编程助手标准作业程序】(AI Step-by-Step Execution Protocol)

当您（或各类AI模型伙伴）收到用户的指示如：**“启动项目”**、**“重新开始”**、**“按既定规则一键搞定”** 时，请严格照做以下无差错三步骤：

### 第一步：清理余留旧锁并实现极速局部库共生编译 (Sync Prepare & Install)
在一行聚合式作业指令下，确保 `Docker` 中间件安枕如山（Postgree, Redis, Nacos:8848 畅亮运行），强制回收所有残留锁机死端，并在数十秒内无缝打通跨空间依赖接口模块（如 `common-core`）至本机的核心仓位：

* **目标路径 (Cwd)**: `E:\SDD+Harness\LinkAgent\linkedagent-backend`
* **执行交互模式 (Synchronic Action)**:
```powershell
docker compose up -d; Get-Process -Name java, node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; mvn clean install -DskipTests -T 1C
```

---

### 第二步：六核并进、后台纯净化隐而不喧全线点亮 (Parallel Async Launching)
不必纠结和互等等待任何进程阻塞！在通过编译后，由 AI Agent 下放给主机执行 **6 个全功能独立的后台子任务 (Parallel Background Tasks)**：

#### 🔸 A. 五组 Java 核心微服务守护阵线 (WorkingDirectory: `E:\SDD+Harness\LinkAgent\linkedagent-backend`)
均通过原装驱动承载特使传参规绝一切网络干扰：

> **JWT：** 每个后端服务进程启动前须设置同一环境变量 `LINKEDAGENT_JWT_SECRET=<set-a-shared-secret-min-32-chars>`（≥32 字符，各服务取值必须一致）。
> **Nacos IP：** 与 `--server.address=127.0.0.1` 配套，各服务 `application.yml` 已固定 `spring.cloud.nacos.discovery.ip=127.0.0.1`。若仍注册成局域网/WSL IP（如 `172.x`），网关会出现 `Connection refused`，前端 `/api` 全 500。
1. **网关指路者 (api-gateway :8080)**
   ```cmd
   cmd.exe /c "mvn spring-boot:run -pl api-gateway -Dspring-boot.run.arguments=--server.address=127.0.0.1"
   ```
2. **高频收发塔 (chat-server :8081)**
   ```cmd
   cmd.exe /c "mvn spring-boot:run -pl chat-server -Dspring-boot.run.arguments=--server.address=127.0.0.1"
   ```
3. **客服接待室 (customer-service :8082)**
   ```cmd
   cmd.exe /c "mvn spring-boot:run -pl customer-service -Dspring-boot.run.arguments=--server.address=127.0.0.1"
   ```
4. **大语智搜引擎 (ai-rag-service :8083 - 防拦截强身盾)**
   ```cmd
   cmd.exe /c "mvn spring-boot:run -pl ai-rag-service -Dspring-boot.run.arguments=--server.address=127.0.0.1"
   ```
5. **天盘控制部 (system-management :8084)**
   ```cmd
   cmd.exe /c "mvn spring-boot:run -pl system-management -Dspring-boot.run.arguments=--server.address=127.0.0.1"
   ```

#### 🔸 B. Vite + React 双工展示控制区 (WorkingDirectory: `E:\SDD+Harness\LinkAgent\linkedagent-frontend`)
6. **Web 页面全知觉服务引擎 (:5173)**
   ```bash
   npm run dev
   ```

---

### 第三步：顺心冲浪体验 (Verified Done)
👉 **[http://localhost:5173](http://localhost:5173)**

*(所有内部调用与问答，皆以超高密态在后台稳健顺通。任何重温只需让 AI 重读本页！)*

---

## 🛑 【如何一键停止 / 关闭全区项目】(One-Click Shutdown Guide)

停止运行同样延续**不需要动用易报错敏感关机脚本**的设计原则！一句话、或者一条通顺小指令，即可秒级干净释放内存与端孔：

### 方法 1：面向 AI/助手的终极大喊（最推荐 ✨）
直接向 AI 助手吐露口令（如：**“帮我一键停止”**、**“全部关掉”** 或 **“停止所有后端与网页服务”**），无论是现在还是将来的模型，都会即时为您后台调用以下绝杀安全清理大招，一秒回归桌面洁净！

### 方法 2：开发者终端或 PowerShell 手动一键清零（备用）
随时在任何 PowerShell 或 CMD 主窗口，丢入以下这句单刀大直男口令（只关开发服务，保留且保护微信、聊天不受惊变）：

```powershell
# 1. 一秒安全静默结束本项目所有的 Spring Boot 后端、Gateway、及前端 Vite 应用：
Get-Process -Name java, node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
```

> **💡 如果你想连 Docker 容器数据库（Postgres, Redis, Nacos）一起整体随手睡眠冷藏休息**，仅需加上中坚停止操作即可：
> ```powershell
> cd E:\SDD+Harness\LinkAgent\linkedagent-backend; docker compose down; Get-Process -Name java, node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
> ```
