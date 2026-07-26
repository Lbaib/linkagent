# Demo Closed Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打通「访客匿名提问 → 真实 RAG 流式回复 → 转人工 → 单客服真实接管」的双浏览器演示闭环，并顺带清理 `.gitignore` / `target/` 工程债。

**Architecture:** `chat-server` 只做 WS 握手、连接表与帧转发（经 Redis Pub/Sub 与 `customer-service` 通信）；`customer-service` 承载会话态、转人工分配与 AI 编排（Feign 调 `ai-rag-service`）；`ai-rag-service` 保持大模型防腐层，密钥仅来自配置。前端访客用匿名 JWT，客服用 `SysUser` 登录 JWT，连同一个 `/ws/chat`。

**Tech Stack:** Java 17、Spring Boot 3.2.4、Spring Cloud 2023.0.1、Redis、PostgreSQL(pgvector)、React 19 + TypeScript + Zustand + Vitest

**设计文档：** `docs/superpowers/specs/2026-07-26-demo-closed-loop-design.md`

## Global Constraints

- 后端 Java 17、Spring Boot 3.2.4；不新增框架级依赖，除 `spring-boot-starter-test`（`<scope>test</scope>`）。
- 前端 React 19.2 / TypeScript 6.0 / Vite 8 / Zustand 5；测试用 Vitest + @testing-library/react，命令 `npm test`。
- WebSocket 直连 `chat-server:8081`，**不得**挂到 `api-gateway:8080` 之后（ADR-0001）。
- JWT 通过 WS URL Query 参数 `token` 传递；签发与校验共用 `common-core` 的 `JwtUtils`。
- 禁止在源码中硬编码 API Key、密码、令牌；模型密钥只能来自配置或环境变量。
- 禁止提交 `target/`、`node_modules/` 等构建产物。
- 禁止留下 TODO / TBD / 占位实现。
- 每个任务结束必须提交（commit），提交信息用英文、遵循 `feat|fix|chore|docs|test(scope): ...` 格式。
- 后端测试运行目录为 `linkedagent-backend/`；前端为 `linkedagent-frontend/`。
- 模型不可用时必须返回明确错误，**禁止伪造 AI 回答**。

---

## File Structure

**新建**

| 文件 | 职责 |
|---|---|
| `.gitignore`（仓库根） | 忽略构建产物 |
| `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/constant/JwtRoles.java` | `visitor` / `agent` 角色常量 |
| `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/constant/WsFrames.java` | WS 帧类型常量 |
| `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/constant/ChatChannels.java` | Redis 上下行频道常量 |
| `linkedagent-backend/common-core/src/test/java/com/linkedagent/common/util/JwtUtilsTest.java` | JWT role claim 测试 |
| `linkedagent-backend/chat-server/src/test/java/com/linkedagent/chatserver/websocket/JwtWebSocketInterceptorTest.java` | 握手属性测试 |
| `linkedagent-backend/chat-server/src/test/java/com/linkedagent/chatserver/websocket/ChatWebSocketHandlerTest.java` | 帧转发测试 |
| `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/chat/ChatDownstreamPublisher.java` | 下行帧发布 |
| `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/chat/ChatUpstreamListener.java` | 上行信封解析与分发 |
| `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/chat/ChatOrchestrationService.java` | 会话编排（CHAT / TRANSFER / AGENT_READY / DISCONNECT） |
| `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/config/ChatRedisConfig.java` | 上行频道订阅配置 |
| `linkedagent-backend/customer-service/src/test/java/...`（4 个测试类） | 编排、路由、认证角色测试 |
| `linkedagent-backend/ai-rag-service/src/main/java/com/linkedagent/airagservice/exception/AiServiceException.java` | 模型不可用异常 |
| `linkedagent-backend/ai-rag-service/src/test/java/com/linkedagent/airagservice/service/AiRagServiceTest.java` | 密钥缺失快速失败测试 |
| `linkedagent-frontend/src/store/agentStore.ts` | 客服工作台真实 WS 状态 |
| `linkedagent-frontend/src/store/agentStore.test.ts` | 客服 store 测试 |

**修改**

| 文件 | 改动 |
|---|---|
| `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/util/JwtUtils.java` | 支持 `role` claim |
| `linkedagent-backend/chat-server/.../JwtWebSocketInterceptor.java` | 写入 `connectionId` + `role` |
| `linkedagent-backend/chat-server/.../ChatWebSocketHandler.java` | 新帧转发模型，废弃 `direct` |
| `linkedagent-backend/chat-server/.../config/RedisPubSubConfig.java` | 订阅 `chat:downstream` |
| `linkedagent-backend/customer-service/.../AuthController.java`、`AuthService.java` | 签发带 role 的 token |
| `linkedagent-backend/customer-service/.../RoutingService.java` | 客服注册 / 分配 / 解绑 |
| `linkedagent-backend/customer-service/.../client/AiRagClient.java` | JSON 契约对齐 |
| `linkedagent-backend/ai-rag-service/.../AiRagService.java`、`AiController.java` | 密钥走配置、失败明确 |
| `linkedagent-frontend/src/api/auth/index.ts` | 匿名 token 接口 |
| `linkedagent-frontend/src/store/chatStore.ts`、`chatStore.test.ts` | 匿名握手、`ERROR` 帧 |
| `linkedagent-frontend/src/components/AgentWorkbench.tsx` | 改用 `agentStore` |
| `brain/00-core/project-map.md`、`brain/40-working/open-questions.md`、`brain/40-working/current-focus.md` | 记忆同步 |

## 契约细化（对设计文档的补充）

设计文档 §4.2 中客服发送的 `CHAT` 帧 payload 增加 `visitorId`，用于指明回复对象：`{ text, visitorId }`。另新增仅用于服务内部上行的 `DISCONNECT` 帧（由 `chat-server` 在连接关闭时产生，不面向浏览器）。Task 11 会把这两条同步回设计文档。

---

### Task 1: 工程债 — 根 `.gitignore`、移除 `target/` 跟踪、修正项目地图

**Files:**
- Create: `.gitignore`
- Modify: `brain/00-core/project-map.md`

**Interfaces:**
- Consumes: 无
- Produces: 干净的 `git status`（后续任务的验证依赖它）

- [ ] **Step 1: 创建根 `.gitignore`**

创建 `.gitignore`，内容：

```gitignore
# Build output
target/
dist/
build/

# Dependencies
node_modules/

# Logs
*.log
logs/

# IDE
.idea/
*.iml
.vscode/

# OS
Thumbs.db
.DS_Store

# Local env
.env
.env.local
```

- [ ] **Step 2: 从 Git 索引移除已跟踪的构建产物**

在仓库根目录运行（PowerShell）：

```powershell
git rm -r --cached --quiet linkedagent-backend/ai-rag-service/target linkedagent-backend/api-gateway/target linkedagent-backend/chat-server/target linkedagent-backend/common-core/target linkedagent-backend/customer-service/target linkedagent-backend/system-management/target
```

若某个路径未被跟踪会报 `did not match any files`，忽略该条继续。

- [ ] **Step 3: 验证 `target/` 不再出现在待提交列表**

运行：`git status --short | Select-String "target/" | Select-Object -First 5`
预期：仅出现 `D  ...target/...`（删除跟踪）条目，不再出现 `??` 未跟踪噪音。

- [ ] **Step 4: 修正项目地图中的文档上传锚点**

在 `brain/00-core/project-map.md` 的「代码锚点」表格中，`| 技术规格书 |` 那一行之前插入一行：

```markdown
| 知识库文档上传 | `linkedagent-backend/ai-rag-service/src/main/java/com/linkedagent/airagservice/controller/AiController.java`（`POST /api/ai/doc/upload`；旧 `DocumentController` 已删除） |
```

- [ ] **Step 5: 提交**

```powershell
git add .gitignore brain/00-core/project-map.md
git commit -m "chore: add root gitignore, untrack build output, fix project map anchor"
```

---

### Task 2: `common-core` — JWT 增加 role claim 与共享常量

**Files:**
- Modify: `linkedagent-backend/common-core/pom.xml`
- Create: `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/constant/JwtRoles.java`
- Create: `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/constant/WsFrames.java`
- Create: `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/constant/ChatChannels.java`
- Modify: `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/util/JwtUtils.java`
- Test: `linkedagent-backend/common-core/src/test/java/com/linkedagent/common/util/JwtUtilsTest.java`

**Interfaces:**
- Consumes: 无
- Produces:
  - `JwtRoles.VISITOR = "visitor"`、`JwtRoles.AGENT = "agent"`
  - `WsFrames.CHAT/TRANSFER_AGENT/AGENT_READY/AI_STREAM/STATUS_UPDATE/SESSION_OFFER/ERROR/DISCONNECT`
  - `ChatChannels.UPSTREAM = "chat:upstream"`、`ChatChannels.DOWNSTREAM = "chat:downstream"`
  - `JwtUtils.generateToken(String subject, String role)`、`JwtUtils.getRole(String token)`、保留 `parseToken(String)`

- [ ] **Step 1: 给 `common-core` 加测试依赖**

在 `linkedagent-backend/common-core/pom.xml` 的 `</dependencies>` 之前插入：

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
```

- [ ] **Step 2: 写失败测试**

创建 `linkedagent-backend/common-core/src/test/java/com/linkedagent/common/util/JwtUtilsTest.java`：

```java
package com.linkedagent.common.util;

import com.linkedagent.common.constant.JwtRoles;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtUtilsTest {

    @Test
    void generateTokenCarriesSubjectAndRole() {
        String token = JwtUtils.generateToken("visitor_abc", JwtRoles.VISITOR);

        assertEquals("visitor_abc", JwtUtils.parseToken(token).getSubject());
        assertEquals(JwtRoles.VISITOR, JwtUtils.getRole(token));
    }

    @Test
    void agentTokenCarriesAgentRole() {
        String token = JwtUtils.generateToken("test_admin", JwtRoles.AGENT);

        assertEquals(JwtRoles.AGENT, JwtUtils.getRole(token));
    }

    @Test
    void invalidTokenIsRejected() {
        assertThrows(RuntimeException.class, () -> JwtUtils.parseToken("not-a-jwt"));
    }
}
```

- [ ] **Step 3: 运行测试确认失败**

在 `linkedagent-backend/` 运行：`mvn -pl common-core test`
预期：编译失败，提示找不到 `JwtRoles` 与 `generateToken(String,String)`。

- [ ] **Step 4: 创建常量类**

创建 `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/constant/JwtRoles.java`：

```java
package com.linkedagent.common.constant;

public final class JwtRoles {

    public static final String VISITOR = "visitor";
    public static final String AGENT = "agent";

    private JwtRoles() {
    }
}
```

创建 `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/constant/WsFrames.java`：

```java
package com.linkedagent.common.constant;

public final class WsFrames {

    public static final String CHAT = "CHAT";
    public static final String TRANSFER_AGENT = "TRANSFER_AGENT";
    public static final String AGENT_READY = "AGENT_READY";
    public static final String AI_STREAM = "AI_STREAM";
    public static final String STATUS_UPDATE = "STATUS_UPDATE";
    public static final String SESSION_OFFER = "SESSION_OFFER";
    public static final String ERROR = "ERROR";

    /** Internal upstream-only frame emitted by chat-server when a connection closes. */
    public static final String DISCONNECT = "DISCONNECT";

    private WsFrames() {
    }
}
```

创建 `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/constant/ChatChannels.java`：

```java
package com.linkedagent.common.constant;

public final class ChatChannels {

    /** chat-server -> customer-service */
    public static final String UPSTREAM = "chat:upstream";

    /** customer-service -> chat-server */
    public static final String DOWNSTREAM = "chat:downstream";

    private ChatChannels() {
    }
}
```

- [ ] **Step 5: 修改 `JwtUtils` 支持 role**

把 `linkedagent-backend/common-core/src/main/java/com/linkedagent/common/util/JwtUtils.java` 全文替换为：

```java
package com.linkedagent.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

public class JwtUtils {

    public static final String CLAIM_ROLE = "role";

    // Static shared secret for cross-JVM validation
    private static final String SECRET_STRING = "linkedagent_default_secret_string_min_32_bytes_long";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));
    private static final long EXPIRATION_TIME = 86400000; // 24 hours

    public static String generateToken(String subject, String role) {
        return Jwts.builder()
                .setSubject(subject)
                .claim(CLAIM_ROLE, role)
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public static Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public static String getRole(String token) {
        return parseToken(token).get(CLAIM_ROLE, String.class);
    }
}
```

注意：单参数 `generateToken(String)` 被移除，`AuthController` / `AuthService` 将在 Task 4 更新；本任务只需 `common-core` 自身编译与测试通过。

- [ ] **Step 6: 运行测试确认通过**

在 `linkedagent-backend/` 运行：`mvn -pl common-core test`
预期：`Tests run: 3, Failures: 0, Errors: 0` 且 BUILD SUCCESS。

- [ ] **Step 7: 提交**

```powershell
git add linkedagent-backend/common-core
git commit -m "feat(common-core): add role claim to JWT and shared chat constants"
```

---

### Task 3: `chat-server` — 握手写入 connectionId 与 role

**Files:**
- Modify: `linkedagent-backend/chat-server/pom.xml`
- Modify: `linkedagent-backend/chat-server/src/main/java/com/linkedagent/chatserver/websocket/JwtWebSocketInterceptor.java`
- Test: `linkedagent-backend/chat-server/src/test/java/com/linkedagent/chatserver/websocket/JwtWebSocketInterceptorTest.java`

**Interfaces:**
- Consumes: `JwtUtils.generateToken(String,String)`、`JwtUtils.getRole(String)`、`JwtRoles`
- Produces: 握手成功后 session attributes 含 `connectionId`（String，= JWT subject）与 `role`（String，`visitor`/`agent`）

- [ ] **Step 1: 给 `chat-server` 加测试依赖**

在 `linkedagent-backend/chat-server/pom.xml` 的 `</dependencies>` 之前插入：

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
```

- [ ] **Step 2: 写失败测试**

创建 `linkedagent-backend/chat-server/src/test/java/com/linkedagent/chatserver/websocket/JwtWebSocketInterceptorTest.java`：

```java
package com.linkedagent.chatserver.websocket;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import org.junit.jupiter.api.Test;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtWebSocketInterceptorTest {

    private final JwtWebSocketInterceptor interceptor = new JwtWebSocketInterceptor();

    private boolean handshake(String token, Map<String, Object> attributes) throws Exception {
        MockHttpServletRequest servletRequest = new MockHttpServletRequest();
        if (token != null) {
            servletRequest.setParameter("token", token);
        }
        return interceptor.beforeHandshake(
                new ServletServerHttpRequest(servletRequest),
                new ServletServerHttpResponse(new MockHttpServletResponse()),
                null,
                attributes);
    }

    @Test
    void visitorTokenPopulatesConnectionIdAndRole() throws Exception {
        Map<String, Object> attributes = new HashMap<>();
        String token = JwtUtils.generateToken("visitor_abc", JwtRoles.VISITOR);

        assertTrue(handshake(token, attributes));
        assertEquals("visitor_abc", attributes.get("connectionId"));
        assertEquals(JwtRoles.VISITOR, attributes.get("role"));
    }

    @Test
    void agentTokenPopulatesAgentRole() throws Exception {
        Map<String, Object> attributes = new HashMap<>();
        String token = JwtUtils.generateToken("test_admin", JwtRoles.AGENT);

        assertTrue(handshake(token, attributes));
        assertEquals(JwtRoles.AGENT, attributes.get("role"));
    }

    @Test
    void missingTokenIsRejected() throws Exception {
        assertFalse(handshake(null, new HashMap<>()));
    }

    @Test
    void invalidTokenIsRejected() throws Exception {
        assertFalse(handshake("not-a-jwt", new HashMap<>()));
    }
}
```

- [ ] **Step 3: 运行测试确认失败**

在 `linkedagent-backend/` 运行：`mvn -pl chat-server -am test`
预期：`visitorTokenPopulatesConnectionIdAndRole` 失败（`connectionId` 为 null，旧代码只写 `visitorId`）。

- [ ] **Step 4: 修改拦截器**

把 `linkedagent-backend/chat-server/src/main/java/com/linkedagent/chatserver/websocket/JwtWebSocketInterceptor.java` 全文替换为：

```java
package com.linkedagent.chatserver.websocket;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import io.jsonwebtoken.Claims;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

public class JwtWebSocketInterceptor implements HandshakeInterceptor {

    public static final String ATTR_CONNECTION_ID = "connectionId";
    public static final String ATTR_ROLE = "role";

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest)) {
            return false;
        }
        String token = ((ServletServerHttpRequest) request).getServletRequest().getParameter("token");
        if (token == null || token.isEmpty()) {
            return false;
        }
        try {
            Claims claims = JwtUtils.parseToken(token);
            String role = claims.get(JwtUtils.CLAIM_ROLE, String.class);
            if (role == null) {
                role = JwtRoles.VISITOR;
            }
            attributes.put(ATTR_CONNECTION_ID, claims.getSubject());
            attributes.put(ATTR_ROLE, role);
            return true;
        } catch (Exception e) {
            // Never log the raw token: it is a credential.
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
```

- [ ] **Step 5: 运行测试确认通过**

在 `linkedagent-backend/` 运行：`mvn -pl chat-server -am test`
预期：`JwtWebSocketInterceptorTest` 4 个用例全部通过。`ChatWebSocketHandler` 仍读取 `visitorId`，将在 Task 4 重写；本步骤只要求编译与该测试通过。

- [ ] **Step 6: 提交**

```powershell
git add linkedagent-backend/chat-server
git commit -m "feat(chat-server): expose connectionId and role from websocket handshake"
```

---

### Task 4: `chat-server` — 帧转发模型（上行信封 / 下行分发）

**Files:**
- Modify: `linkedagent-backend/chat-server/src/main/java/com/linkedagent/chatserver/websocket/ChatWebSocketHandler.java`
- Modify: `linkedagent-backend/chat-server/src/main/java/com/linkedagent/chatserver/config/RedisPubSubConfig.java`
- Test: `linkedagent-backend/chat-server/src/test/java/com/linkedagent/chatserver/websocket/ChatWebSocketHandlerTest.java`

**Interfaces:**
- Consumes: `ChatChannels.UPSTREAM/DOWNSTREAM`、`WsFrames.DISCONNECT`、`JwtWebSocketInterceptor.ATTR_CONNECTION_ID/ATTR_ROLE`
- Produces:
  - 上行信封 JSON：`{"connectionId":"...","role":"visitor|agent","frame":"<原始帧 JSON 字符串>"}` 发布到 `chat:upstream`
  - 下行消息 JSON：`{"targetId":"...","frame":"<帧 JSON 字符串>"}`，由 `handleRedisMessage(String)` 消费
  - `ChatWebSocketHandler#handleRedisMessage(String)` 保持公开方法名（Redis 适配器依赖）

- [ ] **Step 1: 写失败测试**

创建 `linkedagent-backend/chat-server/src/test/java/com/linkedagent/chatserver/websocket/ChatWebSocketHandlerTest.java`：

```java
package com.linkedagent.chatserver.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedagent.common.constant.ChatChannels;
import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.constant.WsFrames;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatWebSocketHandlerTest {

    private ChatWebSocketHandler handler;
    private StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private WebSocketSession session(String connectionId, String role) {
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attributes = new HashMap<>();
        attributes.put(JwtWebSocketInterceptor.ATTR_CONNECTION_ID, connectionId);
        attributes.put(JwtWebSocketInterceptor.ATTR_ROLE, role);
        when(session.getAttributes()).thenReturn(attributes);
        when(session.isOpen()).thenReturn(true);
        return session;
    }

    @BeforeEach
    void setUp() {
        handler = new ChatWebSocketHandler();
        redisTemplate = mock(StringRedisTemplate.class);
        ReflectionTestUtils.setField(handler, "redisTemplate", redisTemplate);
    }

    @Test
    void incomingFrameIsPublishedUpstreamWithIdentity() throws Exception {
        WebSocketSession session = session("visitor_abc", JwtRoles.VISITOR);
        handler.afterConnectionEstablished(session);

        handler.handleTextMessage(session, new TextMessage("{\"type\":\"CHAT\",\"payload\":{\"text\":\"hi\"}}"));

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(redisTemplate).convertAndSend(eq(ChatChannels.UPSTREAM), captor.capture());

        JsonNode envelope = objectMapper.readTree(captor.getValue());
        assertEquals("visitor_abc", envelope.get("connectionId").asText());
        assertEquals(JwtRoles.VISITOR, envelope.get("role").asText());
        assertEquals("CHAT", objectMapper.readTree(envelope.get("frame").asText()).get("type").asText());
    }

    @Test
    void downstreamMessageIsDeliveredToTargetSession() throws Exception {
        WebSocketSession session = session("visitor_abc", JwtRoles.VISITOR);
        handler.afterConnectionEstablished(session);

        String frame = "{\"type\":\"AI_STREAM\",\"payload\":{\"text\":\"hello\",\"isDone\":true}}";
        handler.handleRedisMessage(objectMapper.createObjectNode()
                .put("targetId", "visitor_abc")
                .put("frame", frame)
                .toString());

        verify(session).sendMessage(new TextMessage(frame));
    }

    @Test
    void downstreamMessageForUnknownTargetIsIgnored() throws Exception {
        handler.handleRedisMessage(objectMapper.createObjectNode()
                .put("targetId", "visitor_missing")
                .put("frame", "{\"type\":\"CHAT\"}")
                .toString());

        verify(redisTemplate, never()).convertAndSend(anyString(), anyString());
    }

    @Test
    void closingConnectionPublishesDisconnectFrame() throws Exception {
        WebSocketSession session = session("agent_1", JwtRoles.AGENT);
        handler.afterConnectionEstablished(session);

        handler.afterConnectionClosed(session, CloseStatus.NORMAL);

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(redisTemplate).convertAndSend(eq(ChatChannels.UPSTREAM), captor.capture());

        JsonNode envelope = objectMapper.readTree(captor.getValue());
        assertEquals("agent_1", envelope.get("connectionId").asText());
        assertEquals(WsFrames.DISCONNECT,
                objectMapper.readTree(envelope.get("frame").asText()).get("type").asText());
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

在 `linkedagent-backend/` 运行：`mvn -pl chat-server -am test -Dtest=ChatWebSocketHandlerTest`
预期：失败，旧实现发布到 `chat:routing:topic` 且信封字段不同。

- [ ] **Step 3: 重写 handler**

把 `linkedagent-backend/chat-server/src/main/java/com/linkedagent/chatserver/websocket/ChatWebSocketHandler.java` 全文替换为：

```java
package com.linkedagent.chatserver.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.linkedagent.common.constant.ChatChannels;
import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.constant.WsFrames;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PingMessage;
import org.springframework.web.socket.PongMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String connectionId = connectionId(session);
        if (connectionId != null) {
            sessions.put(connectionId, session);
            log.info("WebSocket connected: {} ({})", connectionId, role(session));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String connectionId = connectionId(session);
        if (connectionId == null) {
            return;
        }
        String payload = message.getPayload();
        try {
            JsonNode frame = objectMapper.readTree(payload);
            if (!frame.hasNonNull("type")) {
                log.warn("Dropping frame without type from {}", connectionId);
                return;
            }
            publishUpstream(connectionId, role(session), payload);
        } catch (Exception e) {
            log.warn("Dropping malformed frame from {}: {}", connectionId, e.getMessage());
        }
    }

    /** Invoked by MessageListenerAdapter for the downstream channel. */
    public void handleRedisMessage(String message) {
        try {
            JsonNode node = objectMapper.readTree(message);
            String targetId = node.path("targetId").asText(null);
            String frame = node.path("frame").asText(null);
            if (targetId == null || frame == null) {
                return;
            }
            WebSocketSession target = sessions.get(targetId);
            if (target != null && target.isOpen()) {
                target.sendMessage(new TextMessage(frame));
            }
        } catch (Exception e) {
            log.warn("Failed to deliver downstream message: {}", e.getMessage());
        }
    }

    @Override
    protected void handlePongMessage(WebSocketSession session, PongMessage message) {
        log.debug("Pong from {}", connectionId(session));
    }

    @Scheduled(fixedRate = 30000)
    public void sendPings() {
        PingMessage ping = new PingMessage();
        sessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(ping);
                }
            } catch (Exception e) {
                log.debug("Ping failed, session will be cleaned up on close");
            }
        });
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String connectionId = connectionId(session);
        if (connectionId == null) {
            return;
        }
        sessions.remove(connectionId);
        log.info("WebSocket closed: {} ({})", connectionId, status.getCode());
        ObjectNode frame = objectMapper.createObjectNode();
        frame.put("type", WsFrames.DISCONNECT);
        publishUpstream(connectionId, role(session), frame.toString());
    }

    private void publishUpstream(String connectionId, String role, String frameJson) {
        ObjectNode envelope = objectMapper.createObjectNode();
        envelope.put("connectionId", connectionId);
        envelope.put("role", role);
        envelope.put("frame", frameJson);
        redisTemplate.convertAndSend(ChatChannels.UPSTREAM, envelope.toString());
    }

    private String connectionId(WebSocketSession session) {
        return (String) session.getAttributes().get(JwtWebSocketInterceptor.ATTR_CONNECTION_ID);
    }

    private String role(WebSocketSession session) {
        Object role = session.getAttributes().get(JwtWebSocketInterceptor.ATTR_ROLE);
        return role == null ? JwtRoles.VISITOR : (String) role;
    }
}
```

- [ ] **Step 4: 让订阅指向下行频道**

把 `linkedagent-backend/chat-server/src/main/java/com/linkedagent/chatserver/config/RedisPubSubConfig.java` 全文替换为：

```java
package com.linkedagent.chatserver.config;

import com.linkedagent.chatserver.websocket.ChatWebSocketHandler;
import com.linkedagent.common.constant.ChatChannels;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class RedisPubSubConfig {

    @Bean
    public RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory,
                                                   MessageListenerAdapter listenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(listenerAdapter, new ChannelTopic(ChatChannels.DOWNSTREAM));
        return container;
    }

    @Bean
    public MessageListenerAdapter listenerAdapter(ChatWebSocketHandler handler) {
        return new MessageListenerAdapter(handler, "handleRedisMessage");
    }
}
```

- [ ] **Step 5: 运行测试确认通过**

在 `linkedagent-backend/` 运行：`mvn -pl chat-server -am test`
预期：`ChatWebSocketHandlerTest` 4 个用例 + `JwtWebSocketInterceptorTest` 4 个用例全部通过。

- [ ] **Step 6: 提交**

```powershell
git add linkedagent-backend/chat-server
git commit -m "feat(chat-server): forward websocket frames over redis upstream/downstream channels"
```

---

### Task 5: `customer-service` — 认证签发带角色的 token

**Files:**
- Modify: `linkedagent-backend/customer-service/pom.xml`
- Modify: `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/controller/AuthController.java`
- Modify: `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/service/AuthService.java`
- Test: `linkedagent-backend/customer-service/src/test/java/com/linkedagent/customerservice/service/AuthServiceTest.java`
- Test: `linkedagent-backend/customer-service/src/test/java/com/linkedagent/customerservice/controller/AuthControllerTest.java`

**Interfaces:**
- Consumes: `JwtUtils.generateToken(String,String)`、`JwtRoles`
- Produces:
  - `GET /api/auth/anonymous` → `{code:200, data:{token, visitorId}}`，token role = `visitor`，subject 以 `visitor_` 开头
  - `POST /api/auth/login` → `{code:200, data:{token, username, role}}`，token role = `agent`，subject = `SysUser.username`

- [ ] **Step 1: 给 `customer-service` 加测试依赖**

在 `linkedagent-backend/customer-service/pom.xml` 的 `</dependencies>` 之前插入：

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
```

- [ ] **Step 2: 写失败测试**

创建 `linkedagent-backend/customer-service/src/test/java/com/linkedagent/customerservice/service/AuthServiceTest.java`：

```java
package com.linkedagent.customerservice.service;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import com.linkedagent.customerservice.entity.SysUser;
import com.linkedagent.customerservice.repository.SysUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private AuthService authService;
    private SysUserRepository userRepository;

    @BeforeEach
    void setUp() {
        authService = new AuthService();
        userRepository = mock(SysUserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        ReflectionTestUtils.setField(authService, "userRepository", userRepository);
        ReflectionTestUtils.setField(authService, "passwordEncoder", passwordEncoder);
    }

    @Test
    @SuppressWarnings("unchecked")
    void loginIssuesAgentRoleToken() {
        SysUser user = new SysUser();
        user.setUsername("test_admin");
        user.setPassword("encoded");
        user.setRole("ROLE_ADMIN");
        user.setActive(true);
        when(userRepository.findByUsername("test_admin")).thenReturn(Optional.of(user));

        Map<String, Object> response = authService.login("test_admin", "123456");

        assertEquals(200, response.get("code"));
        Map<String, String> data = (Map<String, String>) response.get("data");
        assertEquals("test_admin", JwtUtils.parseToken(data.get("token")).getSubject());
        assertEquals(JwtRoles.AGENT, JwtUtils.getRole(data.get("token")));
    }

    @Test
    void loginRejectsUnknownUser() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertEquals(401, authService.login("ghost", "123456").get("code"));
    }
}
```

创建 `linkedagent-backend/customer-service/src/test/java/com/linkedagent/customerservice/controller/AuthControllerTest.java`：

```java
package com.linkedagent.customerservice.controller;

import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.util.JwtUtils;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthControllerTest {

    @Test
    @SuppressWarnings("unchecked")
    void anonymousTokenCarriesVisitorRole() {
        Map<String, Object> response = new AuthController().getAnonymousToken();

        assertEquals(200, response.get("code"));
        Map<String, String> data = (Map<String, String>) response.get("data");
        assertTrue(data.get("visitorId").startsWith("visitor_"));
        assertEquals(data.get("visitorId"), JwtUtils.parseToken(data.get("token")).getSubject());
        assertEquals(JwtRoles.VISITOR, JwtUtils.getRole(data.get("token")));
    }
}
```

- [ ] **Step 3: 运行测试确认失败**

在 `linkedagent-backend/` 运行：`mvn -pl customer-service -am test`
预期：编译失败，`generateToken(String)` 已不存在。

- [ ] **Step 4: 更新签发逻辑**

在 `AuthController.java` 中，把匿名 token 签发行

```java
        String token = JwtUtils.generateToken(visitorId);
```

替换为：

```java
        String token = JwtUtils.generateToken(visitorId, JwtRoles.VISITOR);
```

并在 import 区加入：

```java
import com.linkedagent.common.constant.JwtRoles;
```

在 `AuthService.java` 中，把

```java
        String token = JwtUtils.generateToken(user.getUsername());
```

替换为：

```java
        String token = JwtUtils.generateToken(user.getUsername(), JwtRoles.AGENT);
```

并在 import 区加入：

```java
import com.linkedagent.common.constant.JwtRoles;
```

- [ ] **Step 5: 确认没有遗留的单参数调用**

运行：`rg "generateToken\(" linkedagent-backend --glob "*.java"`
预期：所有命中都是两参数形式（`JwtUtils.java` 的定义除外）。

- [ ] **Step 6: 运行测试确认通过**

在 `linkedagent-backend/` 运行：`mvn -pl customer-service -am test`
预期：`AuthServiceTest` 2 个 + `AuthControllerTest` 1 个用例通过。

- [ ] **Step 7: 提交**

```powershell
git add linkedagent-backend/customer-service
git commit -m "feat(customer-service): issue role-aware jwt for visitors and agents"
```

---

### Task 6: `customer-service` — 路由服务（客服在线 / 分配 / 解绑）

**Files:**
- Modify: `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/service/RoutingService.java`
- Test: `linkedagent-backend/customer-service/src/test/java/com/linkedagent/customerservice/service/RoutingServiceTest.java`

**Interfaces:**
- Consumes: `StringRedisTemplate`
- Produces（供 Task 7 编排调用）：
  - `void registerAgent(String agentId)`
  - `void unregisterAgent(String agentId)` — 返回前清理该客服所有绑定
  - `Optional<String> assignAgent(String visitorId)` — 成功时写 `session:state:{visitorId}=AGENT:{agentId}`、`session:bind:{visitorId}=agentId`、`agent:sessions:{agentId}` 加入 visitorId
  - `void markQueueing(String visitorId)` — 写 `session:state:{visitorId}=QUEUEING`
  - `Optional<String> getBoundAgent(String visitorId)`
  - `void releaseVisitor(String visitorId)` — 解绑并把状态回退为 `QUEUEING`
  - 常量 `MAX_CONCURRENT_SESSIONS = 5`

- [ ] **Step 1: 写失败测试**

创建 `linkedagent-backend/customer-service/src/test/java/com/linkedagent/customerservice/service/RoutingServiceTest.java`：

```java
package com.linkedagent.customerservice.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RoutingServiceTest {

    private RoutingService routingService;
    private ValueOperations<String, String> valueOps;
    private ZSetOperations<String, String> zSetOps;
    private SetOperations<String, String> setOps;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        routingService = new RoutingService();
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        valueOps = mock(ValueOperations.class);
        zSetOps = mock(ZSetOperations.class);
        setOps = mock(SetOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(redisTemplate.opsForZSet()).thenReturn(zSetOps);
        when(redisTemplate.opsForSet()).thenReturn(setOps);
        ReflectionTestUtils.setField(routingService, "redisTemplate", redisTemplate);
    }

    private void agentsAvailable(String agentId, double score) {
        ZSetOperations.TypedTuple<String> tuple = mock(ZSetOperations.TypedTuple.class);
        when(tuple.getValue()).thenReturn(agentId);
        when(tuple.getScore()).thenReturn(score);
        Set<ZSetOperations.TypedTuple<String>> agents = new LinkedHashSet<>();
        agents.add(tuple);
        when(zSetOps.rangeWithScores("agents:active", 0, 0)).thenReturn(agents);
    }

    @Test
    void assignsLeastLoadedOnlineAgent() {
        agentsAvailable("agent_1", 0d);

        Optional<String> assigned = routingService.assignAgent("visitor_abc");

        assertTrue(assigned.isPresent());
        assertEquals("agent_1", assigned.get());
        verify(valueOps).set("session:state:visitor_abc", "AGENT:agent_1");
        verify(valueOps).set("session:bind:visitor_abc", "agent_1");
        verify(setOps).add("agent:sessions:agent_1", "visitor_abc");
        verify(zSetOps).incrementScore("agents:active", "agent_1", 1);
    }

    @Test
    void returnsEmptyWhenNoAgentOnline() {
        when(zSetOps.rangeWithScores("agents:active", 0, 0)).thenReturn(Collections.emptySet());

        assertFalse(routingService.assignAgent("visitor_abc").isPresent());
    }

    @Test
    void returnsEmptyWhenAgentAtCapacity() {
        agentsAvailable("agent_1", (double) RoutingService.MAX_CONCURRENT_SESSIONS);

        assertFalse(routingService.assignAgent("visitor_abc").isPresent());
    }

    @Test
    void registerAgentAddsToOnlineSet() {
        routingService.registerAgent("agent_1");

        verify(zSetOps).addIfAbsent("agents:active", "agent_1", 0d);
    }

    @Test
    void unregisterAgentReleasesItsVisitors() {
        when(setOps.members("agent:sessions:agent_1"))
                .thenReturn(new LinkedHashSet<>(Set.of("visitor_abc")));

        Set<String> released = routingService.unregisterAgent("agent_1");

        assertEquals(Set.of("visitor_abc"), released);
        verify(valueOps).set("session:state:visitor_abc", "QUEUEING");
        verify(zSetOps).remove("agents:active", "agent_1");
    }

    @Test
    void getBoundAgentReadsBinding() {
        when(valueOps.get("session:bind:visitor_abc")).thenReturn("agent_1");

        assertEquals(Optional.of("agent_1"), routingService.getBoundAgent("visitor_abc"));
    }

    @Test
    void markQueueingWritesState() {
        routingService.markQueueing("visitor_abc");

        verify(valueOps).set("session:state:visitor_abc", "QUEUEING");
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

在 `linkedagent-backend/` 运行：`mvn -pl customer-service -am test -Dtest=RoutingServiceTest`
预期：编译失败，`assignAgent` / `registerAgent` 等方法不存在。

- [ ] **Step 3: 重写 `RoutingService`**

把 `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/service/RoutingService.java` 全文替换为：

```java
package com.linkedagent.customerservice.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class RoutingService {

    public static final int MAX_CONCURRENT_SESSIONS = 5;

    private static final String ONLINE_AGENTS_KEY = "agents:active";
    private static final String STATE_PREFIX = "session:state:";
    private static final String BIND_PREFIX = "session:bind:";
    private static final String AGENT_SESSIONS_PREFIX = "agent:sessions:";
    private static final String STATE_QUEUEING = "QUEUEING";

    @Autowired
    private StringRedisTemplate redisTemplate;

    public void registerAgent(String agentId) {
        redisTemplate.opsForZSet().addIfAbsent(ONLINE_AGENTS_KEY, agentId, 0d);
    }

    /** Removes the agent and returns the visitors that were bound to it. */
    public Set<String> unregisterAgent(String agentId) {
        Set<String> visitors = redisTemplate.opsForSet().members(AGENT_SESSIONS_PREFIX + agentId);
        Set<String> released = visitors == null ? Collections.emptySet() : new LinkedHashSet<>(visitors);
        for (String visitorId : released) {
            redisTemplate.delete(BIND_PREFIX + visitorId);
            redisTemplate.opsForValue().set(STATE_PREFIX + visitorId, STATE_QUEUEING);
        }
        redisTemplate.delete(AGENT_SESSIONS_PREFIX + agentId);
        redisTemplate.opsForZSet().remove(ONLINE_AGENTS_KEY, agentId);
        return released;
    }

    public Optional<String> assignAgent(String visitorId) {
        Set<TypedTuple<String>> agents = redisTemplate.opsForZSet().rangeWithScores(ONLINE_AGENTS_KEY, 0, 0);
        if (agents == null || agents.isEmpty()) {
            return Optional.empty();
        }
        TypedTuple<String> candidate = agents.iterator().next();
        String agentId = candidate.getValue();
        Double load = candidate.getScore();
        if (agentId == null || load == null || load >= MAX_CONCURRENT_SESSIONS) {
            return Optional.empty();
        }
        redisTemplate.opsForZSet().incrementScore(ONLINE_AGENTS_KEY, agentId, 1);
        redisTemplate.opsForValue().set(STATE_PREFIX + visitorId, "AGENT:" + agentId);
        redisTemplate.opsForValue().set(BIND_PREFIX + visitorId, agentId);
        redisTemplate.opsForSet().add(AGENT_SESSIONS_PREFIX + agentId, visitorId);
        return Optional.of(agentId);
    }

    public void markQueueing(String visitorId) {
        redisTemplate.opsForValue().set(STATE_PREFIX + visitorId, STATE_QUEUEING);
    }

    public Optional<String> getBoundAgent(String visitorId) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(BIND_PREFIX + visitorId));
    }

    /** Unbinds a visitor from its agent and puts the session back into the queue. */
    public void releaseVisitor(String visitorId) {
        Optional<String> agentId = getBoundAgent(visitorId);
        agentId.ifPresent(id -> {
            redisTemplate.opsForSet().remove(AGENT_SESSIONS_PREFIX + id, visitorId);
            redisTemplate.opsForZSet().incrementScore(ONLINE_AGENTS_KEY, id, -1);
        });
        redisTemplate.delete(BIND_PREFIX + visitorId);
        redisTemplate.opsForValue().set(STATE_PREFIX + visitorId, STATE_QUEUEING);
    }
}
```

- [ ] **Step 4: 运行测试确认通过**

在 `linkedagent-backend/` 运行：`mvn -pl customer-service -am test -Dtest=RoutingServiceTest`
预期：7 个用例全部通过。

- [ ] **Step 5: 提交**

```powershell
git add linkedagent-backend/customer-service
git commit -m "feat(customer-service): rework routing service for agent presence and binding"
```

---

### Task 7: `customer-service` — 会话编排（CHAT / TRANSFER / AGENT_READY / DISCONNECT）

**Files:**
- Create: `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/chat/ChatDownstreamPublisher.java`
- Create: `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/chat/ChatOrchestrationService.java`
- Create: `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/chat/ChatUpstreamListener.java`
- Create: `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/config/ChatRedisConfig.java`
- Modify: `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/client/AiRagClient.java`
- Test: `linkedagent-backend/customer-service/src/test/java/com/linkedagent/customerservice/chat/ChatOrchestrationServiceTest.java`

**Interfaces:**
- Consumes: `RoutingService`（Task 6 全部方法）、`ChatChannels`、`WsFrames`、`JwtRoles`
- Produces:
  - `ChatDownstreamPublisher#send(String targetId, String frameJson)`
  - `ChatOrchestrationService#handleUpstream(String connectionId, String role, String frameJson)`
  - `AiRagClient#ask(Map<String,String> body)` → `Map<String,Object>`（键 `success`、`answer`）
  - 聊天内容按 `visitorId:文本` 追加到 Redis List `chat:messages`，供既有 `MessagePersistenceTask` 落库（旧的 `chat-server` 缓冲路径已在 Task 4 移除，必须由本任务补上）

- [ ] **Step 1: 写失败测试**

创建 `linkedagent-backend/customer-service/src/test/java/com/linkedagent/customerservice/chat/ChatOrchestrationServiceTest.java`：

```java
package com.linkedagent.customerservice.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.constant.WsFrames;
import com.linkedagent.customerservice.client.AiRagClient;
import com.linkedagent.customerservice.service.RoutingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.ListOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatOrchestrationServiceTest {

    private ChatOrchestrationService service;
    private ChatDownstreamPublisher publisher;
    private RoutingService routingService;
    private AiRagClient aiRagClient;
    private ListOperations<String, String> listOps;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        service = new ChatOrchestrationService();
        publisher = mock(ChatDownstreamPublisher.class);
        routingService = mock(RoutingService.class);
        aiRagClient = mock(AiRagClient.class);
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        listOps = mock(ListOperations.class);
        when(redisTemplate.opsForList()).thenReturn(listOps);
        ReflectionTestUtils.setField(service, "publisher", publisher);
        ReflectionTestUtils.setField(service, "routingService", routingService);
        ReflectionTestUtils.setField(service, "aiRagClient", aiRagClient);
        ReflectionTestUtils.setField(service, "redisTemplate", redisTemplate);
    }

    private List<JsonNode> framesSentTo(String targetId) {
        ArgumentCaptor<String> target = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> frame = ArgumentCaptor.forClass(String.class);
        verify(publisher, atLeastOnce()).send(target.capture(), frame.capture());
        List<JsonNode> frames = new ArrayList<>();
        for (int i = 0; i < target.getAllValues().size(); i++) {
            if (targetId.equals(target.getAllValues().get(i))) {
                try {
                    frames.add(objectMapper.readTree(frame.getAllValues().get(i)));
                } catch (Exception e) {
                    throw new IllegalStateException(e);
                }
            }
        }
        return frames;
    }

    @Test
    void visitorChatStreamsAiAnswer() {
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.empty());
        when(aiRagClient.ask(any())).thenReturn(Map.of("success", true, "answer", "退货政策是七天无理由。"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"退货政策?\"}}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertTrue(frames.stream().allMatch(f -> WsFrames.AI_STREAM.equals(f.get("type").asText())));
        JsonNode last = frames.get(frames.size() - 1);
        assertTrue(last.get("payload").get("isDone").asBoolean());
        assertEquals("退货政策是七天无理由。", last.get("payload").get("text").asText());
        assertFalse(frames.get(0).get("payload").get("isDone").asBoolean());
    }

    @Test
    void aiFailureProducesErrorFrameAndNoFakeAnswer() {
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.empty());
        when(aiRagClient.ask(any())).thenThrow(new RuntimeException("connection refused"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"退货政策?\"}}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertEquals(1, frames.size());
        assertEquals(WsFrames.ERROR, frames.get(0).get("type").asText());
        assertEquals("AI_UNAVAILABLE", frames.get(0).get("payload").get("code").asText());
    }

    @Test
    void visitorChatIsForwardedToBoundAgent() {
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.of("agent_1"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"在吗\"}}");

        JsonNode frame = framesSentTo("agent_1").get(0);
        assertEquals(WsFrames.CHAT, frame.get("type").asText());
        assertEquals("visitor", frame.get("payload").get("sender").asText());
        assertEquals("visitor_abc", frame.get("payload").get("visitorId").asText());
        assertEquals("在吗", frame.get("payload").get("text").asText());
    }

    @Test
    void transferWithOnlineAgentMovesBothSidesToAgentChat() {
        when(routingService.assignAgent("visitor_abc")).thenReturn(Optional.of("agent_1"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR, "{\"type\":\"TRANSFER_AGENT\"}");

        JsonNode visitorFrame = framesSentTo("visitor_abc").stream()
                .filter(f -> WsFrames.STATUS_UPDATE.equals(f.get("type").asText()))
                .reduce((first, second) -> second)
                .orElseThrow();
        assertEquals("agent_chat", visitorFrame.get("payload").get("status").asText());

        JsonNode agentFrame = framesSentTo("agent_1").stream()
                .filter(f -> WsFrames.SESSION_OFFER.equals(f.get("type").asText()))
                .findFirst()
                .orElseThrow();
        assertEquals("visitor_abc", agentFrame.get("payload").get("visitorId").asText());
    }

    @Test
    void transferWithoutAgentKeepsVisitorQueuing() {
        when(routingService.assignAgent("visitor_abc")).thenReturn(Optional.empty());

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR, "{\"type\":\"TRANSFER_AGENT\"}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertTrue(frames.stream().anyMatch(f -> WsFrames.STATUS_UPDATE.equals(f.get("type").asText())
                && "queuing".equals(f.get("payload").get("status").asText())));
        assertTrue(frames.stream().anyMatch(f -> WsFrames.CHAT.equals(f.get("type").asText())
                && "system".equals(f.get("payload").get("sender").asText())));
        verify(routingService).markQueueing("visitor_abc");
    }

    @Test
    void agentReadyRegistersAgent() {
        service.handleUpstream("agent_1", JwtRoles.AGENT, "{\"type\":\"AGENT_READY\"}");

        verify(routingService).registerAgent("agent_1");
    }

    @Test
    void agentChatIsForwardedToVisitor() {
        service.handleUpstream("agent_1", JwtRoles.AGENT,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"您好\",\"visitorId\":\"visitor_abc\"}}");

        JsonNode frame = framesSentTo("visitor_abc").get(0);
        assertEquals(WsFrames.CHAT, frame.get("type").asText());
        assertEquals("agent", frame.get("payload").get("sender").asText());
        assertEquals("您好", frame.get("payload").get("text").asText());
    }

    @Test
    void agentDisconnectPutsVisitorsBackToQueuing() {
        when(routingService.unregisterAgent("agent_1")).thenReturn(Set.of("visitor_abc"));

        service.handleUpstream("agent_1", JwtRoles.AGENT, "{\"type\":\"DISCONNECT\"}");

        List<JsonNode> frames = framesSentTo("visitor_abc");
        assertTrue(frames.stream().anyMatch(f -> WsFrames.STATUS_UPDATE.equals(f.get("type").asText())
                && "queuing".equals(f.get("payload").get("status").asText())));
    }

    @Test
    void visitorDisconnectReleasesBinding() {
        service.handleUpstream("visitor_abc", JwtRoles.VISITOR, "{\"type\":\"DISCONNECT\"}");

        verify(routingService).releaseVisitor("visitor_abc");
    }

    @Test
    void malformedFrameIsIgnored() {
        service.handleUpstream("visitor_abc", JwtRoles.VISITOR, "not-json");

        verify(publisher, org.mockito.Mockito.never()).send(anyString(), anyString());
    }

    @Test
    void chatMessagesAreBufferedForPersistence() {
        when(routingService.getBoundAgent("visitor_abc")).thenReturn(Optional.of("agent_1"));

        service.handleUpstream("visitor_abc", JwtRoles.VISITOR,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"在吗\"}}");
        service.handleUpstream("agent_1", JwtRoles.AGENT,
                "{\"type\":\"CHAT\",\"payload\":{\"text\":\"您好\",\"visitorId\":\"visitor_abc\"}}");

        verify(listOps).rightPush("chat:messages", "visitor_abc:在吗");
        verify(listOps).rightPush("chat:messages", "visitor_abc:您好");
    }
}
```

- [ ] **Step 2: 运行测试确认失败**

在 `linkedagent-backend/` 运行：`mvn -pl customer-service -am test -Dtest=ChatOrchestrationServiceTest`
预期：编译失败，`ChatOrchestrationService` 不存在。

- [ ] **Step 3: 创建下行发布器**

创建 `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/chat/ChatDownstreamPublisher.java`：

```java
package com.linkedagent.customerservice.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.linkedagent.common.constant.ChatChannels;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class ChatDownstreamPublisher {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private StringRedisTemplate redisTemplate;

    public void send(String targetId, String frameJson) {
        ObjectNode message = objectMapper.createObjectNode();
        message.put("targetId", targetId);
        message.put("frame", frameJson);
        redisTemplate.convertAndSend(ChatChannels.DOWNSTREAM, message.toString());
    }
}
```

- [ ] **Step 4: 创建编排服务**

创建 `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/chat/ChatOrchestrationService.java`：

```java
package com.linkedagent.customerservice.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.linkedagent.common.constant.JwtRoles;
import com.linkedagent.common.constant.WsFrames;
import com.linkedagent.customerservice.client.AiRagClient;
import com.linkedagent.customerservice.service.RoutingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class ChatOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(ChatOrchestrationService.class);
    private static final int STREAM_CHUNK_SIZE = 6;
    private static final String MESSAGE_BUFFER_KEY = "chat:messages";
    private static final String NO_AGENT_HINT = "当前暂无客服在线，您可以继续与 AI 对话，我们会在客服上线后为您接入。";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ChatDownstreamPublisher publisher;

    @Autowired
    private RoutingService routingService;

    @Autowired
    private AiRagClient aiRagClient;

    @Autowired
    private StringRedisTemplate redisTemplate;

    public void handleUpstream(String connectionId, String role, String frameJson) {
        JsonNode frame;
        try {
            frame = objectMapper.readTree(frameJson);
        } catch (Exception e) {
            log.warn("Ignoring malformed upstream frame from {}", connectionId);
            return;
        }
        String type = frame.path("type").asText("");
        JsonNode payload = frame.path("payload");
        boolean isAgent = JwtRoles.AGENT.equals(role);

        switch (type) {
            case WsFrames.CHAT -> {
                if (isAgent) {
                    handleAgentChat(connectionId, payload);
                } else {
                    handleVisitorChat(connectionId, payload);
                }
            }
            case WsFrames.TRANSFER_AGENT -> handleTransfer(connectionId);
            case WsFrames.AGENT_READY -> routingService.registerAgent(connectionId);
            case WsFrames.DISCONNECT -> handleDisconnect(connectionId, isAgent);
            default -> log.debug("Unhandled frame type {} from {}", type, connectionId);
        }
    }

    private void handleVisitorChat(String visitorId, JsonNode payload) {
        String text = payload.path("text").asText("");
        if (text.isBlank()) {
            return;
        }
        bufferForPersistence(visitorId, text);
        Optional<String> boundAgent = routingService.getBoundAgent(visitorId);
        if (boundAgent.isPresent()) {
            publisher.send(boundAgent.get(), chatFrame("visitor", text, visitorId));
            return;
        }
        streamAiAnswer(visitorId, text);
    }

    private void handleAgentChat(String agentId, JsonNode payload) {
        String text = payload.path("text").asText("");
        String visitorId = payload.path("visitorId").asText("");
        if (text.isBlank() || visitorId.isBlank()) {
            log.warn("Agent {} sent a chat frame without text or visitorId", agentId);
            return;
        }
        bufferForPersistence(visitorId, text);
        publisher.send(visitorId, chatFrame("agent", text, visitorId));
    }

    /** Keeps the existing MessagePersistenceTask fed now that chat-server no longer buffers. */
    private void bufferForPersistence(String visitorId, String text) {
        redisTemplate.opsForList().rightPush(MESSAGE_BUFFER_KEY, visitorId + ":" + text);
    }

    private void handleTransfer(String visitorId) {
        Optional<String> agentId = routingService.assignAgent(visitorId);
        if (agentId.isPresent()) {
            publisher.send(visitorId, statusFrame("agent_chat"));
            publisher.send(agentId.get(), sessionOfferFrame(visitorId));
            publisher.send(agentId.get(), statusFrame("agent_chat"));
            return;
        }
        routingService.markQueueing(visitorId);
        publisher.send(visitorId, statusFrame("queuing"));
        publisher.send(visitorId, chatFrame("system", NO_AGENT_HINT, visitorId));
    }

    private void handleDisconnect(String connectionId, boolean isAgent) {
        if (isAgent) {
            Set<String> released = routingService.unregisterAgent(connectionId);
            for (String visitorId : released) {
                publisher.send(visitorId, statusFrame("queuing"));
                publisher.send(visitorId, chatFrame("system", "客服已离线，正在为您重新排队。", visitorId));
            }
            return;
        }
        routingService.releaseVisitor(connectionId);
    }

    private void streamAiAnswer(String visitorId, String question) {
        String answer;
        try {
            Map<String, String> body = new HashMap<>();
            body.put("query", question);
            body.put("sessionId", visitorId);
            Map<String, Object> response = aiRagClient.ask(body);
            Object success = response == null ? null : response.get("success");
            Object content = response == null ? null : response.get("answer");
            if (!Boolean.TRUE.equals(success) || !(content instanceof String) || ((String) content).isBlank()) {
                publisher.send(visitorId, errorFrame("AI_UNAVAILABLE", "AI 服务暂不可用，请稍后重试或转人工。"));
                return;
            }
            answer = (String) content;
        } catch (Exception e) {
            log.warn("AI call failed for {}: {}", visitorId, e.getMessage());
            publisher.send(visitorId, errorFrame("AI_UNAVAILABLE", "AI 服务暂不可用，请稍后重试或转人工。"));
            return;
        }

        for (int end = Math.min(STREAM_CHUNK_SIZE, answer.length()); end < answer.length(); end += STREAM_CHUNK_SIZE) {
            publisher.send(visitorId, aiStreamFrame(answer.substring(0, end), false));
        }
        publisher.send(visitorId, aiStreamFrame(answer, true));
    }

    private String chatFrame(String sender, String text, String visitorId) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("sender", sender);
        payload.put("text", text);
        payload.put("visitorId", visitorId);
        return frame(WsFrames.CHAT, payload);
    }

    private String aiStreamFrame(String text, boolean isDone) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("text", text);
        payload.put("isDone", isDone);
        return frame(WsFrames.AI_STREAM, payload);
    }

    private String statusFrame(String status) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("status", status);
        return frame(WsFrames.STATUS_UPDATE, payload);
    }

    private String sessionOfferFrame(String visitorId) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("visitorId", visitorId);
        return frame(WsFrames.SESSION_OFFER, payload);
    }

    private String errorFrame(String code, String message) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("code", code);
        payload.put("message", message);
        return frame(WsFrames.ERROR, payload);
    }

    private String frame(String type, ObjectNode payload) {
        ObjectNode frame = objectMapper.createObjectNode();
        frame.put("type", type);
        frame.set("payload", payload);
        return frame.toString();
    }
}
```

- [ ] **Step 5: 对齐 Feign 契约**

把 `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/client/AiRagClient.java` 全文替换为：

```java
package com.linkedagent.customerservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "ai-rag-service")
public interface AiRagClient {

    @PostMapping(value = "/api/ai/ask", consumes = MediaType.APPLICATION_JSON_VALUE)
    Map<String, Object> ask(@RequestBody Map<String, String> body);
}
```

- [ ] **Step 6: 订阅上行频道**

创建 `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/chat/ChatUpstreamListener.java`：

```java
package com.linkedagent.customerservice.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.linkedagent.common.constant.JwtRoles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ChatUpstreamListener {

    private static final Logger log = LoggerFactory.getLogger(ChatUpstreamListener.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ChatOrchestrationService orchestrationService;

    /** Invoked by MessageListenerAdapter for the upstream channel. */
    public void handleUpstreamMessage(String message) {
        try {
            JsonNode envelope = objectMapper.readTree(message);
            String connectionId = envelope.path("connectionId").asText(null);
            String frame = envelope.path("frame").asText(null);
            if (connectionId == null || frame == null) {
                return;
            }
            String role = envelope.path("role").asText(JwtRoles.VISITOR);
            orchestrationService.handleUpstream(connectionId, role, frame);
        } catch (Exception e) {
            log.warn("Failed to process upstream envelope: {}", e.getMessage());
        }
    }
}
```

创建 `linkedagent-backend/customer-service/src/main/java/com/linkedagent/customerservice/config/ChatRedisConfig.java`：

```java
package com.linkedagent.customerservice.config;

import com.linkedagent.common.constant.ChatChannels;
import com.linkedagent.customerservice.chat.ChatUpstreamListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

@Configuration
public class ChatRedisConfig {

    @Bean
    public MessageListenerAdapter chatUpstreamListenerAdapter(ChatUpstreamListener listener) {
        return new MessageListenerAdapter(listener, "handleUpstreamMessage");
    }

    @Bean
    public RedisMessageListenerContainer chatUpstreamContainer(RedisConnectionFactory connectionFactory,
                                                               MessageListenerAdapter chatUpstreamListenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(chatUpstreamListenerAdapter, new ChannelTopic(ChatChannels.UPSTREAM));
        return container;
    }
}
```

- [ ] **Step 7: 运行测试确认通过**

在 `linkedagent-backend/` 运行：`mvn -pl customer-service -am test`
预期：`ChatOrchestrationServiceTest` 11 个用例 + 之前的认证 / 路由用例全部通过。

- [ ] **Step 8: 提交**

```powershell
git add linkedagent-backend/customer-service
git commit -m "feat(customer-service): orchestrate chat frames, ai streaming and agent handover"
```

---

### Task 8: `ai-rag-service` — 密钥迁出源码、失败明确报错

**Files:**
- Modify: `linkedagent-backend/ai-rag-service/pom.xml`
- Create: `linkedagent-backend/ai-rag-service/src/main/java/com/linkedagent/airagservice/exception/AiServiceException.java`
- Modify: `linkedagent-backend/ai-rag-service/src/main/java/com/linkedagent/airagservice/service/AiRagService.java`
- Modify: `linkedagent-backend/ai-rag-service/src/main/java/com/linkedagent/airagservice/controller/AiController.java`
- Test: `linkedagent-backend/ai-rag-service/src/test/java/com/linkedagent/airagservice/service/AiRagServiceTest.java`

**Interfaces:**
- Consumes: 配置项 `openai.api.base-url`、`openai.api.key`、`openai.api.chat-model`
- Produces:
  - `AiRagService#generateResponseSync(String sessionId, String query)` 成功返回答案字符串，失败抛 `AiServiceException`
  - `POST /api/ai/ask` 失败时返回 `{success:false, message:"..."}`（HTTP 200，供 Feign 判定）

- [ ] **Step 1: 给 `ai-rag-service` 加测试依赖**

在 `linkedagent-backend/ai-rag-service/pom.xml` 的 `</dependencies>` 之前插入：

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
```

- [ ] **Step 2: 写失败测试**

创建 `linkedagent-backend/ai-rag-service/src/test/java/com/linkedagent/airagservice/service/AiRagServiceTest.java`：

```java
package com.linkedagent.airagservice.service;

import com.linkedagent.airagservice.exception.AiServiceException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiRagServiceTest {

    private AiRagService aiRagService;

    @BeforeEach
    void setUp() {
        aiRagService = new AiRagService();
        ReflectionTestUtils.setField(aiRagService, "baseUrl", "https://example.invalid");
        ReflectionTestUtils.setField(aiRagService, "chatModel", "gpt-5.5");
    }

    @Test
    void blankKeyFailsFast() {
        ReflectionTestUtils.setField(aiRagService, "apiKey", "  ");

        AiServiceException error = assertThrows(AiServiceException.class,
                () -> aiRagService.generateResponseSync("visitor_abc", "退货政策?"));
        assertTrue(error.getMessage().contains("OPENAI_API_KEY"));
    }

    @Test
    void placeholderKeyFailsFast() {
        ReflectionTestUtils.setField(aiRagService, "apiKey", "sk-dummy-key");

        assertThrows(AiServiceException.class,
                () -> aiRagService.generateResponseSync("visitor_abc", "退货政策?"));
    }
}
```

- [ ] **Step 3: 运行测试确认失败**

在 `linkedagent-backend/` 运行：`mvn -pl ai-rag-service -am test -Dtest=AiRagServiceTest`
预期：编译失败，`AiServiceException` 不存在。

- [ ] **Step 4: 创建异常类型**

创建 `linkedagent-backend/ai-rag-service/src/main/java/com/linkedagent/airagservice/exception/AiServiceException.java`：

```java
package com.linkedagent.airagservice.exception;

public class AiServiceException extends RuntimeException {

    public AiServiceException(String message) {
        super(message);
    }

    public AiServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

- [ ] **Step 5: 重写 `AiRagService`**

把 `linkedagent-backend/ai-rag-service/src/main/java/com/linkedagent/airagservice/service/AiRagService.java` 全文替换为：

```java
package com.linkedagent.airagservice.service;

import com.linkedagent.airagservice.exception.AiServiceException;
import com.linkedagent.airagservice.repository.DocumentChunkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiRagService {

    private static final Logger log = LoggerFactory.getLogger(AiRagService.class);
    private static final String PLACEHOLDER_KEY = "sk-dummy-key";

    @Value("${openai.api.base-url:https://yundu.lat}")
    private String baseUrl;

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.api.chat-model:gpt-5.5}")
    private String chatModel;

    @Autowired
    private EmbeddingService embeddingService;

    @Autowired
    private DocumentChunkRepository documentChunkRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public String generateResponseSync(String sessionId, String query) {
        requireApiKey();

        String augmentedQuery = augmentWithKnowledge(query);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", augmentedQuery);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(userMessage);

        Map<String, Object> body = new HashMap<>();
        body.put("model", chatModel);
        body.put("messages", messages);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    baseUrl + "/v1/chat/completions", new HttpEntity<>(body, headers), Map.class);
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null || !responseBody.containsKey("choices")) {
                throw new AiServiceException("LLM returned an empty response for session " + sessionId);
            }
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
            if (choices.isEmpty()) {
                throw new AiServiceException("LLM returned no choices for session " + sessionId);
            }
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = message == null ? null : (String) message.get("content");
            if (content == null || content.isBlank()) {
                throw new AiServiceException("LLM returned blank content for session " + sessionId);
            }
            return content;
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AiServiceException("LLM call failed: " + e.getMessage(), e);
        }
    }

    private void requireApiKey() {
        if (apiKey == null || apiKey.isBlank() || PLACEHOLDER_KEY.equals(apiKey.trim())) {
            throw new AiServiceException("Model API key is not configured. Set OPENAI_API_KEY before serving traffic.");
        }
    }

    private String augmentWithKnowledge(String query) {
        try {
            List<Double> embedding = embeddingService.getEmbedding(query);
            String vectorStr = "[" + embedding.stream().map(String::valueOf).collect(Collectors.joining(",")) + "]";
            List<String> similarChunks = documentChunkRepository.findTop3Similar(vectorStr);
            if (similarChunks == null || similarChunks.isEmpty()) {
                return query;
            }
            return "Background context:\n" + String.join("\n\n", similarChunks) + "\n\nUser Question:\n" + query;
        } catch (Exception e) {
            log.warn("Vector retrieval unavailable, answering without knowledge context: {}", e.getMessage());
            return query;
        }
    }
}
```

注意：原来的 `generateResponse(String,String)`（假流式，向 `chat:routing:topic` 推 mock 文本）已删除，流式由 `customer-service` 负责。

- [ ] **Step 6: 让接口显式暴露失败**

在 `AiController.java` 中，把 `askQuestion` 方法体替换为：

```java
    @PostMapping("/ask")
    public Map<String, Object> askQuestion(@RequestBody Map<String, String> payload) {
        String query = payload.get("query");
        String sessionId = payload.getOrDefault("sessionId", "anonymous");

        Map<String, Object> result = new HashMap<>();
        try {
            result.put("success", true);
            result.put("answer", aiRagService.generateResponseSync(sessionId, query));
        } catch (AiServiceException e) {
            result.clear();
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return result;
    }
```

并在 import 区加入：

```java
import com.linkedagent.airagservice.exception.AiServiceException;
```

- [ ] **Step 7: 补齐可配置的模型名**

在 `linkedagent-backend/ai-rag-service/src/main/resources/application.yml` 的 `openai.api` 段落中，把

```yaml
    key: ${OPENAI_API_KEY:sk-dummy-key}
```

替换为：

```yaml
    key: ${OPENAI_API_KEY:}
    chat-model: ${OPENAI_CHAT_MODEL:gpt-5.5}
```

- [ ] **Step 8: 确认源码中不再有硬编码密钥**

运行：`rg "sk-[a-zA-Z0-9]{20,}" linkedagent-backend --glob "!**/target/**"`
预期：无输出。

- [ ] **Step 9: 运行测试确认通过**

在 `linkedagent-backend/` 运行：`mvn -pl ai-rag-service -am test`
预期：`AiRagServiceTest` 2 个用例通过，模块 BUILD SUCCESS。

- [ ] **Step 10: 提交**

```powershell
git add linkedagent-backend/ai-rag-service
git commit -m "fix(ai-rag-service): move model credentials to config and fail loudly"
```

---

### Task 9: 前端访客侧 — 匿名握手与新帧处理

**Files:**
- Modify: `linkedagent-frontend/src/api/auth/index.ts`
- Modify: `linkedagent-frontend/src/store/chatStore.ts`
- Test: `linkedagent-frontend/src/store/chatStore.test.ts`

**Interfaces:**
- Consumes: `GET /api/auth/anonymous`（Task 5）、后端帧 `AI_STREAM` / `STATUS_UPDATE` / `CHAT` / `ERROR`（Task 7）
- Produces:
  - `authApi.getAnonymousToken(): Promise<{ token: string; visitorId: string }>`
  - `useChatStore` 增加 `visitorId: string | null`、`lastError: string | null`；`connect(): Promise<void>`
  - 访客 token 存于 `sessionStorage`，键名 `visitorToken`（与客服的 `localStorage.accessToken` 隔离）

- [ ] **Step 1: 写失败测试**

把 `linkedagent-frontend/src/store/chatStore.test.ts` 全文替换为：

```typescript
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from './chatStore';

vi.mock('../api/auth', () => ({
  authApi: {
    getAnonymousToken: vi.fn().mockResolvedValue({ token: 'jwt-token', visitorId: 'visitor_abc' })
  }
}));

class FakeWebSocket {
  static last: FakeWebSocket | null = null;
  url: string;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.last = this;
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.onclose?.();
  }
}

const initialState = useChatStore.getState();

beforeEach(() => {
  sessionStorage.clear();
  FakeWebSocket.last = null;
  vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
  useChatStore.setState({ ...initialState, ws: null, messages: initialState.messages.slice(0, 1) }, true);
});

async function connectAndOpen() {
  await act(async () => {
    await useChatStore.getState().connect();
  });
  act(() => {
    FakeWebSocket.last?.onopen?.();
  });
}

function receive(frame: unknown) {
  act(() => {
    FakeWebSocket.last?.onmessage?.({ data: JSON.stringify(frame) });
  });
}

describe('chatStore', () => {
  it('starts disconnected with a welcome message', () => {
    expect(useChatStore.getState().wsStatus).toBe('disconnected');
    expect(useChatStore.getState().sessionStatus).toBe('ai_chat');
    expect(useChatStore.getState().messages).toHaveLength(1);
  });

  it('fetches an anonymous token and connects with it', async () => {
    await connectAndOpen();

    expect(sessionStorage.getItem('visitorToken')).toBe('jwt-token');
    expect(FakeWebSocket.last?.url).toContain('token=jwt-token');
    expect(useChatStore.getState().wsStatus).toBe('connected');
    expect(useChatStore.getState().visitorId).toBe('visitor_abc');
  });

  it('accumulates AI_STREAM frames into one message', async () => {
    await connectAndOpen();

    receive({ type: 'AI_STREAM', payload: { text: '七天', isDone: false } });
    receive({ type: 'AI_STREAM', payload: { text: '七天无理由', isDone: true } });

    const messages = useChatStore.getState().messages;
    const last = messages[messages.length - 1];
    expect(messages).toHaveLength(2);
    expect(last.text).toBe('七天无理由');
    expect(last.isStreaming).toBe(false);
  });

  it('records ERROR frames without faking an answer', async () => {
    await connectAndOpen();

    receive({ type: 'ERROR', payload: { code: 'AI_UNAVAILABLE', message: 'AI 服务暂不可用' } });

    const state = useChatStore.getState();
    expect(state.lastError).toBe('AI 服务暂不可用');
    expect(state.messages[state.messages.length - 1].sender).toBe('system');
  });

  it('applies STATUS_UPDATE frames', async () => {
    await connectAndOpen();

    receive({ type: 'STATUS_UPDATE', payload: { status: 'agent_chat' } });

    expect(useChatStore.getState().sessionStatus).toBe('agent_chat');
  });

  it('sends CHAT and TRANSFER_AGENT frames', async () => {
    await connectAndOpen();

    act(() => {
      useChatStore.getState().sendMessage('你好');
      useChatStore.getState().requestTransfer();
    });

    expect(FakeWebSocket.last?.sent[0]).toBe(JSON.stringify({ type: 'CHAT', payload: { text: '你好' } }));
    expect(FakeWebSocket.last?.sent[1]).toBe(JSON.stringify({ type: 'TRANSFER_AGENT' }));
    expect(useChatStore.getState().sessionStatus).toBe('queuing');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

在 `linkedagent-frontend/` 运行：`npm test`
预期：`chatStore` 用例失败（`getAnonymousToken` 未被调用、`lastError` 不存在）。

- [ ] **Step 3: 增加匿名 token API**

在 `linkedagent-frontend/src/api/auth/index.ts` 中，把 `authApi` 对象替换为：

```typescript
export interface AnonymousToken {
  token: string;
  visitorId: string;
}

export const authApi = {
  login: (data: LoginDTO) => {
    return http.post<any, { token: string }>('/api/auth/login', data);
  },
  getUserInfo: () => {
    return http.get<any, UserInfo>('/api/auth/user-info');
  },
  getAnonymousToken: () => {
    return http.get<any, AnonymousToken>('/api/auth/anonymous');
  }
};
```

- [ ] **Step 4: 重写 `chatStore`**

把 `linkedagent-frontend/src/store/chatStore.ts` 全文替换为：

```typescript
import { create } from 'zustand';
import { authApi } from '../api/auth';

export interface Message {
  id: string;
  sender: 'visitor' | 'ai' | 'agent' | 'system';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface ChatState {
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  sessionStatus: 'ai_chat' | 'queuing' | 'agent_chat' | 'offline_leave';
  messages: Message[];
  ws: WebSocket | null;
  visitorId: string | null;
  lastError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  requestTransfer: () => void;
  _pushMessage: (msg: Message) => void;
}

const VISITOR_TOKEN_KEY = 'visitorToken';
const VISITOR_ID_KEY = 'visitorId';

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const useChatStore = create<ChatState>((set, get) => ({
  wsStatus: 'disconnected',
  sessionStatus: 'ai_chat',
  messages: [{
    id: 'welcome',
    sender: 'ai',
    text: '您好！我是 LinkedAgent 智能客服助手。请问有什么可以帮您？',
    timestamp: now()
  }],
  ws: null,
  visitorId: null,
  lastError: null,

  connect: async () => {
    if (get().ws) return;

    set({ wsStatus: 'connecting', lastError: null });

    let token = sessionStorage.getItem(VISITOR_TOKEN_KEY);
    let visitorId = sessionStorage.getItem(VISITOR_ID_KEY);

    if (!token) {
      try {
        const anonymous = await authApi.getAnonymousToken();
        token = anonymous.token;
        visitorId = anonymous.visitorId;
        sessionStorage.setItem(VISITOR_TOKEN_KEY, token);
        sessionStorage.setItem(VISITOR_ID_KEY, visitorId);
      } catch {
        set({
          wsStatus: 'disconnected',
          lastError: '无法获取访客身份，请稍后重试。'
        });
        return;
      }
    }

    const ws = new WebSocket(`ws://${window.location.host}/ws/chat?token=${token}`);

    ws.onopen = () => set({ wsStatus: 'connected' });

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'AI_STREAM') {
          set((state) => {
            const msgs = [...state.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.sender === 'ai' && lastMsg.isStreaming) {
              msgs[msgs.length - 1] = {
                ...lastMsg,
                text: data.payload.text,
                isStreaming: !data.payload.isDone
              };
            } else {
              msgs.push({
                id: `ai-${Date.now()}`,
                sender: 'ai',
                text: data.payload.text,
                timestamp: now(),
                isStreaming: !data.payload.isDone
              });
            }
            return { messages: msgs };
          });
        } else if (data.type === 'STATUS_UPDATE') {
          set({ sessionStatus: data.payload.status });
        } else if (data.type === 'CHAT') {
          set((state) => ({
            messages: [...state.messages, {
              id: `chat-${Date.now()}`,
              sender: data.payload.sender || 'system',
              text: data.payload.text,
              timestamp: now()
            }]
          }));
        } else if (data.type === 'ERROR') {
          set((state) => ({
            lastError: data.payload.message,
            messages: [...state.messages, {
              id: `error-${Date.now()}`,
              sender: 'system',
              text: data.payload.message,
              timestamp: now()
            }]
          }));
        }
      } catch (e) {
        console.error('WebSocket message parsing failed', e);
      }
    };

    ws.onclose = () => set({ wsStatus: 'disconnected', ws: null });

    ws.onerror = () => set({ wsStatus: 'disconnected', lastError: '连接中断，请重新打开会话。' });

    set({ ws, visitorId });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
    }
    set({ wsStatus: 'disconnected', ws: null });
  },

  sendMessage: (text: string) => {
    const { ws, wsStatus } = get();
    if (wsStatus !== 'connected' || !ws) return;

    set((state) => ({
      messages: [...state.messages, {
        id: `visitor-${Date.now()}`,
        sender: 'visitor',
        text,
        timestamp: now()
      }]
    }));
    ws.send(JSON.stringify({ type: 'CHAT', payload: { text } }));
  },

  requestTransfer: () => {
    const { ws, wsStatus } = get();
    if (wsStatus !== 'connected' || !ws) return;

    ws.send(JSON.stringify({ type: 'TRANSFER_AGENT' }));
    set({ sessionStatus: 'queuing' });
  },

  _pushMessage: (msg: Message) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  }
}));
```

- [ ] **Step 5: 修正 `VisitorClient` 的连接调用与留言提示**

在 `linkedagent-frontend/src/components/VisitorClient.tsx` 中，把

```tsx
  useEffect(() => {
    if (isOpen && wsStatus === 'disconnected') {
      connect();
    }
  }, [isOpen, wsStatus, connect]);
```

替换为：

```tsx
  useEffect(() => {
    if (isOpen && wsStatus === 'disconnected') {
      void connect();
    }
  }, [isOpen, wsStatus, connect]);
```

并把离线留言提交处

```tsx
    // Mock leave submit for now
    alert('留言已提交：' + offlineMessage);
```

替换为：

```tsx
    alert('离线留言功能尚未接入后端，本次演示不会保存内容。');
```

- [ ] **Step 6: 运行测试确认通过**

在 `linkedagent-frontend/` 运行：`npm test`
预期：`chatStore` 6 个用例全部通过。

- [ ] **Step 7: 类型与 lint 检查**

运行：`npm run build`，随后 `npm run lint`
预期：两条命令均无错误退出。

- [ ] **Step 8: 提交**

```powershell
git add linkedagent-frontend/src
git commit -m "feat(frontend): connect visitor chat with anonymous jwt and error frames"
```

---

### Task 10: 前端客服侧 — 工作台接真实 WebSocket

**Files:**
- Create: `linkedagent-frontend/src/store/agentStore.ts`
- Test: `linkedagent-frontend/src/store/agentStore.test.ts`
- Modify: `linkedagent-frontend/src/components/AgentWorkbench.tsx`

**Interfaces:**
- Consumes: `localStorage.accessToken`（登录后由 `AuthContext` 写入）、帧 `SESSION_OFFER` / `CHAT` / `STATUS_UPDATE`（Task 7）
- Produces: `useAgentStore` 暴露 `agentState`、`setAgentState`、`activeSessions`、`queuedSessions`、`selectedSessionId`、`setSelectedSessionId`、`sendAgentMessage`、`acceptSession`、`closeSessionByAgent`、`agentConfig`、`metrics`、`connect`、`disconnect`，字段名与 `AgentWorkbench` 现有用法一致

- [ ] **Step 1: 写失败测试**

创建 `linkedagent-frontend/src/store/agentStore.test.ts`：

```typescript
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAgentStore } from './agentStore';

class FakeWebSocket {
  static last: FakeWebSocket | null = null;
  url: string;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.last = this;
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.onclose?.();
  }
}

const initialState = useAgentStore.getState();

beforeEach(() => {
  localStorage.clear();
  FakeWebSocket.last = null;
  vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
  useAgentStore.setState({ ...initialState, ws: null, sessions: [] }, true);
});

function connectAndOpen() {
  localStorage.setItem('accessToken', 'agent-jwt');
  act(() => {
    useAgentStore.getState().connect();
    FakeWebSocket.last?.onopen?.();
  });
}

function receive(frame: unknown) {
  act(() => {
    FakeWebSocket.last?.onmessage?.({ data: JSON.stringify(frame) });
  });
}

describe('agentStore', () => {
  it('connects with the agent token and announces readiness', () => {
    connectAndOpen();

    expect(FakeWebSocket.last?.url).toContain('token=agent-jwt');
    expect(FakeWebSocket.last?.sent[0]).toBe(JSON.stringify({ type: 'AGENT_READY' }));
    expect(useAgentStore.getState().wsStatus).toBe('connected');
  });

  it('adds an offered session to the queued list', () => {
    connectAndOpen();

    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });

    expect(useAgentStore.getState().queuedSessions).toHaveLength(1);
    expect(useAgentStore.getState().queuedSessions[0].id).toBe('visitor_abc');
    expect(useAgentStore.getState().activeSessions).toHaveLength(0);
  });

  it('moves a session to active on accept', () => {
    connectAndOpen();
    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });

    act(() => {
      useAgentStore.getState().acceptSession('visitor_abc');
    });

    expect(useAgentStore.getState().activeSessions).toHaveLength(1);
    expect(useAgentStore.getState().selectedSessionId).toBe('visitor_abc');
  });

  it('appends incoming visitor messages to the right session', () => {
    connectAndOpen();
    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });

    receive({ type: 'CHAT', payload: { sender: 'visitor', text: '在吗', visitorId: 'visitor_abc' } });

    const session = useAgentStore.getState().queuedSessions[0];
    expect(session.messages[session.messages.length - 1].text).toBe('在吗');
  });

  it('sends agent replies with the visitor id', () => {
    connectAndOpen();
    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });
    act(() => {
      useAgentStore.getState().acceptSession('visitor_abc');
      useAgentStore.getState().sendAgentMessage('visitor_abc', '您好');
    });

    const sent = FakeWebSocket.last?.sent ?? [];
    expect(sent[sent.length - 1]).toBe(
      JSON.stringify({ type: 'CHAT', payload: { text: '您好', visitorId: 'visitor_abc' } })
    );
    const session = useAgentStore.getState().activeSessions[0];
    expect(session.messages[session.messages.length - 1].sender).toBe('agent');
  });

  it('closes a session on demand', () => {
    connectAndOpen();
    receive({ type: 'SESSION_OFFER', payload: { visitorId: 'visitor_abc' } });
    act(() => {
      useAgentStore.getState().acceptSession('visitor_abc');
      useAgentStore.getState().closeSessionByAgent('visitor_abc');
    });

    expect(useAgentStore.getState().activeSessions).toHaveLength(0);
    expect(useAgentStore.getState().selectedSessionId).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

在 `linkedagent-frontend/` 运行：`npm test`
预期：找不到模块 `./agentStore`。

- [ ] **Step 3: 创建 `agentStore`**

创建 `linkedagent-frontend/src/store/agentStore.ts`：

```typescript
import { create } from 'zustand';
import type { Message } from './chatStore';

export interface AgentSession {
  id: string;
  name: string;
  status: 'queuing' | 'agent_chat';
  queuePosition?: number;
  messages: Message[];
}

interface AgentState {
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  agentState: 'online' | 'busy' | 'offline';
  sessions: AgentSession[];
  selectedSessionId: string | null;
  lastError: string | null;
  ws: WebSocket | null;
  agentConfig: { maxConcurrent: number };
  metrics: { activeConnections: number; totalRequests: number };
  activeSessions: AgentSession[];
  queuedSessions: AgentSession[];
  connect: () => void;
  disconnect: () => void;
  setAgentState: (state: 'online' | 'busy' | 'offline') => void;
  setSelectedSessionId: (id: string | null) => void;
  acceptSession: (sessionId: string) => void;
  closeSessionByAgent: (sessionId: string) => void;
  sendAgentMessage: (sessionId: string, text: string) => void;
}

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const derive = (sessions: AgentSession[]) => ({
  sessions,
  activeSessions: sessions.filter((s) => s.status === 'agent_chat'),
  queuedSessions: sessions.filter((s) => s.status === 'queuing'),
  metrics: {
    activeConnections: sessions.filter((s) => s.status === 'agent_chat').length,
    totalRequests: sessions.reduce((total, s) => total + s.messages.length, 0)
  }
});

const withMessage = (sessions: AgentSession[], sessionId: string, message: Message) =>
  sessions.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s));

export const useAgentStore = create<AgentState>((set, get) => ({
  wsStatus: 'disconnected',
  agentState: 'online',
  sessions: [],
  selectedSessionId: null,
  lastError: null,
  ws: null,
  agentConfig: { maxConcurrent: 5 },
  metrics: { activeConnections: 0, totalRequests: 0 },
  activeSessions: [],
  queuedSessions: [],

  connect: () => {
    if (get().ws) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ wsStatus: 'disconnected', lastError: '未检测到登录状态，请重新登录。' });
      return;
    }

    set({ wsStatus: 'connecting', lastError: null });
    const ws = new WebSocket(`ws://${window.location.host}/ws/chat?token=${token}`);

    ws.onopen = () => {
      set({ wsStatus: 'connected' });
      ws.send(JSON.stringify({ type: 'AGENT_READY' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SESSION_OFFER') {
          const visitorId: string = data.payload.visitorId;
          set((state) => {
            if (state.sessions.some((s) => s.id === visitorId)) return state;
            const session: AgentSession = {
              id: visitorId,
              name: `访客 ${visitorId.slice(-6)}`,
              status: 'queuing',
              queuePosition: state.sessions.filter((s) => s.status === 'queuing').length + 1,
              messages: []
            };
            return derive([...state.sessions, session]);
          });
        } else if (data.type === 'CHAT') {
          const visitorId: string = data.payload.visitorId;
          set((state) => derive(withMessage(state.sessions, visitorId, {
            id: `in-${Date.now()}`,
            sender: data.payload.sender || 'system',
            text: data.payload.text,
            timestamp: now()
          })));
        } else if (data.type === 'ERROR') {
          set({ lastError: data.payload.message });
        }
      } catch (e) {
        console.error('Agent WebSocket message parsing failed', e);
      }
    };

    ws.onclose = () => set({ wsStatus: 'disconnected', ws: null });
    ws.onerror = () => set({ wsStatus: 'disconnected', lastError: '客服连接中断，请刷新页面。' });

    set({ ws });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) ws.close();
    set({ wsStatus: 'disconnected', ws: null });
  },

  setAgentState: (agentState) => set({ agentState }),

  setSelectedSessionId: (selectedSessionId) => set({ selectedSessionId }),

  acceptSession: (sessionId) => {
    set((state) => derive(state.sessions.map((s) =>
      s.id === sessionId ? { ...s, status: 'agent_chat', queuePosition: undefined } : s)));
    set({ selectedSessionId: sessionId });
  },

  closeSessionByAgent: (sessionId) => {
    set((state) => derive(state.sessions.filter((s) => s.id !== sessionId)));
    if (get().selectedSessionId === sessionId) {
      set({ selectedSessionId: null });
    }
  },

  sendAgentMessage: (sessionId, text) => {
    const { ws, wsStatus } = get();
    if (wsStatus !== 'connected' || !ws) return;

    ws.send(JSON.stringify({ type: 'CHAT', payload: { text, visitorId: sessionId } }));
    set((state) => derive(withMessage(state.sessions, sessionId, {
      id: `agent-${Date.now()}`,
      sender: 'agent',
      text,
      timestamp: now()
    })));
  }
}));
```

- [ ] **Step 4: 运行测试确认通过**

在 `linkedagent-frontend/` 运行：`npm test`
预期：`agentStore` 6 个用例通过，`chatStore` 用例保持通过。

- [ ] **Step 5: 把工作台切换到真实数据源**

在 `linkedagent-frontend/src/components/AgentWorkbench.tsx` 中，把

```tsx
import { useSimulation } from '../context/SimulationContext';
```

替换为：

```tsx
import { useAgentStore } from '../store/agentStore';
```

把

```tsx
  const {
    agentState, setAgentState, activeSessions, queuedSessions,
    selectedSessionId, setSelectedSessionId, sendAgentMessage,
    acceptSession, closeSessionByAgent, agentConfig, metrics
  } = useSimulation();
```

替换为：

```tsx
  const {
    agentState, setAgentState, activeSessions, queuedSessions,
    selectedSessionId, setSelectedSessionId, sendAgentMessage,
    acceptSession, closeSessionByAgent, agentConfig, metrics,
    wsStatus, connect
  } = useAgentStore();
```

并在 `const selectedSession = ...` 那一行之后插入连接副作用：

```tsx
  useEffect(() => {
    if (wsStatus === 'disconnected') {
      connect();
    }
  }, [wsStatus, connect]);
```

- [ ] **Step 6: 运行测试、类型检查与 lint**

在 `linkedagent-frontend/` 依次运行：`npm test`、`npm run build`、`npm run lint`
预期：全部通过；若 `oxlint` 报 `SimulationContext` 相关未使用导入，删除对应导入行。

- [ ] **Step 7: 提交**

```powershell
git add linkedagent-frontend/src
git commit -m "feat(frontend): drive agent workbench from real websocket sessions"
```

---

### Task 11: 端到端验收、文档与记忆同步

**Files:**
- Modify: `docs/superpowers/specs/2026-07-26-demo-closed-loop-design.md`
- Modify: `brain/40-working/open-questions.md`
- Modify: `brain/40-working/current-focus.md`
- Create: `openspec/changes/2026-07-26-ws-frame-contract/proposal.md`

**Interfaces:**
- Consumes: Task 1–10 全部产出
- Produces: 通过验收的演示链路 + 同步后的规格与记忆

- [ ] **Step 1: 全量构建与测试**

在 `linkedagent-backend/` 运行：`mvn test`
预期：所有模块 BUILD SUCCESS，无测试失败。

在 `linkedagent-frontend/` 运行：`npm test`，随后 `npm run build`
预期：均无错误。

- [ ] **Step 2: 启动依赖与服务**

确认 PostgreSQL（含 pgvector）、Redis、Nacos 已运行，并已设置模型密钥环境变量：

```powershell
$env:OPENAI_API_KEY = "<你的真实密钥>"
```

按 `ONE_CLICK_START.md` 启动 `api-gateway`、`chat-server`、`customer-service`、`ai-rag-service`、`system-management`，以及 `linkedagent-frontend` 的 `npm run dev`。

- [ ] **Step 3: 执行演示脚本并记录结果**

1. 浏览器 A 打开 `http://localhost:5173`，点击右下角气泡 → 发送「退货政策是什么？」→ 观察逐段出现的 AI 回复。
2. 浏览器 B（无痕窗口）打开 `http://localhost:5173/login`，用 `test_admin / 123456` 登录 → 进入 `/agent`。
3. 浏览器 A 点击「转人工」→ 浏览器 B 待接管列表出现该访客 → 点「接入」→ B 发送回复 → A 能看到客服消息。
4. 关闭浏览器 B → 浏览器 A 收到「客服已离线，正在为您重新排队。」
5. 临时取消 `OPENAI_API_KEY` 重启 `ai-rag-service` → 访客提问应看到明确错误提示，而不是编造答案。

每步在终端与浏览器控制台确认无异常堆栈。

- [ ] **Step 4: 把契约细化同步进设计文档**

在 `docs/superpowers/specs/2026-07-26-demo-closed-loop-design.md` 的 §4.2 表格中，把 `CHAT` 那一行替换为：

```markdown
| `CHAT` | 访客 / 客服 | 访客 `{ text }`；客服 `{ text, visitorId }` | 当前会话态下发消息 |
```

并在该表格下方追加一行说明：

```markdown
> 内部帧：`chat-server` 在连接关闭时向 `customer-service` 上行发送 `DISCONNECT`，浏览器不会收到该帧。
```

- [ ] **Step 5: 写 openspec 变更提案**

创建 `openspec/changes/2026-07-26-ws-frame-contract/proposal.md`：

```markdown
# WebSocket 帧契约对齐与人工接管闭环

## Why

前端 `chatStore` 与后端 `chat-server` 的消息帧语义不一致（前端 `CHAT`/`TRANSFER_AGENT`，后端 `direct`），导致访客侧无法真正走通 AI 问答与转人工。

## What Changes

- `client-auth`：匿名与登录 JWT 增加 `role` claim（`visitor` / `agent`）；WS 握手写入 `connectionId` 与 `role`。
- `ai-chat`：AI 回答通过 `AI_STREAM` 帧分片回推；模型不可用时下发 `ERROR` 帧，不返回伪造回答。
- `agent-routing`：`TRANSFER_AGENT` 触发分配；有在线客服即接管，否则保持 `queuing` 并提示；客服断线时访客回退 `queuing`。
- `agent-chat`：客服 `CHAT` 帧携带 `visitorId`，与访客双向转发。

## Impact

- Affected specs: `client-auth`、`ai-chat`、`agent-routing`、`agent-chat`
- Affected code: `common-core`、`chat-server`、`customer-service`、`ai-rag-service`、`linkedagent-frontend`
- 未纳入本次：满载排队压力、离线留言落库、token 级 LLM 流式
```

- [ ] **Step 6: 更新记忆库**

在 `brain/40-working/open-questions.md` 的「待决」列表中：
- 把 `.gitignore` / `target/` 那一条整行替换为：

```markdown
- [x] 根 `.gitignore` 已补齐，已跟踪的 `target/` 已从索引移除。(2026-07-26 演示闭环)
```

- 把 `DocumentController` 那一条整行替换为：

```markdown
- [x] 知识库文档上传入口确认仍在 `ai-rag-service` 的 `AiController`（`POST /api/ai/doc/upload`），`project-map` 已更新。(2026-07-26 演示闭环)
```

在 `brain/40-working/current-focus.md` 的「当前状态」列表末尾追加：

```markdown
- ✅ 演示闭环：访客匿名 AI 流式 → 转人工 → 单客服真实接管；WS 帧契约前后端对齐；模型密钥迁出源码。
```

并把「下一步（按优先级）」的第 1 条替换为：

```markdown
1. **演示闭环的下一层**：离线留言落库、满载排队与队列位次、token 级 LLM 流式，三选一立项。
```

- [ ] **Step 7: 提交**

```powershell
git add docs/superpowers/specs/2026-07-26-demo-closed-loop-design.md openspec/changes/2026-07-26-ws-frame-contract brain/40-working
git commit -m "docs: record ws contract change and sync memory after demo closed loop"
```
