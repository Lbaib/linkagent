# 🚀 LinkedAgent 全自动一键极速启动指引 (ONE_CLICK_START.md)

本项目已全面重构为**模块化单体架构 (Modular Monolith)**，彻底告别了过往 5 个微服务 + Nacos 的复杂环境包袱！
- **彻底告别 Nacos**：不再需要启动 Nacos 容器，没有 8848/9848 端口占用与 WSL IP 注册失联问题。
- **彻底告别端口冲突**：不再占用 8081/8082/8083/8084 等碎片化端口（彻底解决 8083 微信冲突），单一后端统一监听 **`8080`** 端口（涵盖 HTTP 与 WebSocket）。
- **极速启动**：从过去的 6 个后台任务直接精简为 **1 个中间件容器 + 1 个后端服务 + 1 个前端服务**。

---

## 🤖 标准启动作业程序

### 第一步：启动基础中间件（仅 PostgreSQL + Redis）
在 `linkedagent-backend` 目录下：
```bash
docker compose up -d
```
> 容器清单：
> - `linkedagent-postgres`（包含 pgvector 向量支持，端口 5432）
> - `linkedagent-redis`（高速缓存与会话状态，端口 6379）

---

### 第二步：一键启动后端服务 (`linkedagent-server`)
> **JWT 密钥环境变量：** 设置 `LINKEDAGENT_JWT_SECRET`（建议 ≥32 字符，开发环境可直接使用默认密钥）。

在 `linkedagent-backend` 目录下运行：
```bash
mvn spring-boot:run -pl linkedagent-server
```
或者直接运行编译好的 Jar 包：
```bash
java -jar linkedagent-server/target/linkedagent-server-1.0.0-SNAPSHOT.jar
```
后端启动后将提供完整功能：
* **HTTP API 统一入口**：`http://localhost:8080/api/...`
* **WebSocket 对话长连接**：`ws://localhost:8080/ws/chat`

---

### 第三步：启动前端开发服务器
在 `linkedagent-frontend` 目录下运行：
```bash
npm run dev
```

---

### 第四步：浏览器访问
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🛑 一键停止全区服务
```bash
# 终止本地 Java 与前端 Node 进程：
pkill -f "linkedagent-server|vite"

# 若需要休眠 Docker 容器：
cd linkedagent-backend && docker compose down
```
