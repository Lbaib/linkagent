# 前端 API 请求层架构设计与联调方案

## 1. 目标概述
本项目当前后端服务已开发完成（Spring Cloud 微服务架构，API 网关运行在 `localhost:8080`），前端项目（React + Vite）已搭建完毕但缺乏与后端的连接。
本设计的目的是为前端构建一套稳健、易用的 API 请求层，解决跨域问题、统一处理认证状态和错误，并极大提升前端获取数据的开发体验。

## 2. 核心技术选型
*   **基础通信库**：Axios
*   **状态与缓存管理**：@tanstack/react-query (React Query)
*   **TypeScript 支持**：强制所有 API 定义接口参数与返回值类型

## 3. 详细设计方案

### 3.1 Vite 本地开发代理 (Proxy)
为了解决前端向 `8080` 端口发请求产生的跨域问题，在 `vite.config.ts` 中配置代理：
- 拦截路径：`/api`
- 目标地址：`http://127.0.0.1:8080`
- 是否需要重写路径：无需重写，原样转发。

### 3.2 目录结构规划
在 `src` 下新建专门的 `api` 目录，并按后端微服务边界进行隔离：

```text
src/
  ├── api/
  │   ├── http.ts            // Axios 实例封装，全局拦截器配置
  │   ├── types.ts           // 全局基础数据类型定义 (如 BaseResponse 结构)
  │   ├── auth/              // 认证与用户信息模块
  │   ├── sys/               // 系统管理模块
  │   └── agent/             // Agent 核心业务模块
  └── providers/
      └── QueryProvider.tsx  // React Query 的 Provider 及全局配置
```

### 3.3 Axios 实例与全局拦截器
在 `src/api/http.ts` 中完成核心逻辑的封装：

*   **请求拦截 (Request)**：
    *   读取 `localStorage.getItem('accessToken')`。
    *   若存在，则附加 Header：`Authorization: Bearer <Token>`。
*   **响应拦截 (Response)**：
    *   **200 成功响应**：提取 `response.data`，供业务逻辑直接使用。
    *   **401 认证失败**：清除本地过期的 Token，使用前端路由强制跳转至 `/login` 页。
    *   **其他错误**：如果是 HTTP 500 等异常状态，通过全局 Toast (例如使用已有的 UI 库组件) 弹出错误提示，避免组件内冗余的错误捕获代码。

### 3.4 React Query 全局集成
*   **全局提供者**：在 `main.tsx` (或 `App.tsx`) 外层包裹 `<QueryClientProvider>`。
*   **默认配置**：
    *   `retry: 1` （对于网络抖动默认重试 1 次）。
    *   `refetchOnWindowFocus: false` （关闭窗口重聚刷新，节省非实时业务的性能开销）。
*   **业务开发规范**：
    *   所有请求函数必须提取在 `src/api/` 中，不应散落在组件内。
    *   业务组件通过自定义 Hook (结合 `useQuery` / `useMutation`) 调用接口，直接获取 `data`, `isLoading`, `isError` 属性，不手动调用 `useEffect` 发请求。

## 4. 后续演进范围
*   本方案聚焦于打通当前本地的联调主干。
*   如果后续存在更复杂的刷新 Token (Refresh Token) 机制，可在本架构 Axios 响应拦截器的 `401` 捕获阶段无缝扩展无感刷新逻辑。
