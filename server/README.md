# AI 工具站后端

AI 工具导航 + 智能体的后端服务，数据全部在 `ai_tools` 库。

## 目录

```
server/
├── app.js                     入口：装配中间件与路由
├── .env.example               配置模板，复制成 .env 使用
├── config/
│   ├── loadEnv.js             极简 .env 加载器（无第三方依赖）
│   └── aiDb.js                MySQL 连接池 → ai_tools
├── controllers/
│   ├── toolController.js      工具列表 / 详情 / 筛选
│   ├── categoryController.js  分类树 + 全站统计
│   └── agentController.js     智能体：列表 / 详情 / 上传 / 运行 / 创建
├── routes/
│   ├── tools.js / categories.js / health.js
│   └── agents.js
├── services/llm.js            大模型适配层（OpenAI 兼容 + 无 Key 时的示例模式）
├── utils/                     响应封装、camelCase 转换、分页解析
├── db/                        SQL：01 建表 / 02 基础数据 / 03 工具 / 04 关联 / 05 智能体
├── scripts/init-db.js         执行 db/*.sql 并自检
└── uploads/                   智能体上传的文件（运行时生成）
```

## 启动

```bash
cd server
cp .env.example .env      # 按实际情况改数据库账号密码
npm run db:init           # 建库 + 建表 + 灌 60 条种子数据
npm run dev               # 默认 http://localhost:8080
```

前端 `vite.config.js` 已经把 `/api` 代理到 8080，直接 `npm run dev` 起前端即可联调。

## 接口

统一响应体，和前端 `src/api/index.js` 的拦截器约定一致：

```json
{ "code": 200, "message": "ok", "data": {} }
```

失败时 HTTP 状态码与 `code` 同步（400 / 404 / 503），`data` 为 `null`。

### GET /api/tools

| 参数 | 说明 |
|---|---|
| `category` | 分类 slug，如 `coding` |
| `pricing` | `free` / `freemium` / `paid` / `trial` |
| `platform` | `web` / `ios` / `android` / `desktop` / `api` / `chrome` |
| `q` | 关键词，搜 name / tagline / description |
| `sort` | `recommend`（默认）/ `newest` / `rating` / `clicks` |
| `featured` | 传 `1` 只返回首页推荐位 |
| `page` / `pageSize` | 默认 1 / 20，pageSize 上限 50 |

```bash
curl "http://localhost:8080/api/tools?category=coding&pricing=freemium&sort=clicks&pageSize=5"
```

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 27,
        "slug": "cursor",
        "name": "Cursor",
        "tagline": "AI 原生编辑器，多文件重构利器",
        "pricingType": "freemium",
        "platforms": ["desktop"],
        "ratingAvg": 0,
        "clickCount": 0,
        "categorySlug": "coding",
        "categoryName": "编程与开发"
      }
    ],
    "total": 9,
    "page": 1,
    "pageSize": 5,
    "hasMore": true
  }
}
```

### GET /api/tools/:slug

返回工具全字段 + `tags` + `screenshots` + `related`（相关推荐，优先标签重合度，退化为同分类热门）。

```bash
curl http://localhost:8080/api/tools/cursor
```

### GET /api/categories

返回两级分类树 + 全站统计：

```json
{
  "code": 200,
  "data": {
    "list": [
      { "id": 4, "slug": "coding", "name": "编程与开发", "icon": "💻", "toolCount": 9, "children": [] }
    ],
    "stats": { "toolCount": 60, "featuredCount": 8 }
  }
}
```

### GET /api/health

确认 `ai_tools` 库连得上：

```json
{ "code": 200, "data": { "status": "up", "database": "ai_tools" } }
```

## 实现上的几个约定

- **参数白名单**：`sort` 走映射表，`pricing` / `platform` 走枚举校验，任何用户输入都不会被拼进 SQL 结构。`q` 会剔除 `%` `_` `\` 再进 LIKE。
- **LIMIT 参数化**：`LIMIT ? OFFSET ?` 由 mysql2 转义，不做字符串拼接。
- **字段命名**：数据库 snake_case，出口统一 camelCase，转换只在 `utils/case.js` 一层做。
- **JSON 列**：`platforms` 可能是字符串也可能是数组，`parseJSONField` 统一成数组再输出。
- **列表不带大字段**：`description` 只在详情返回，列表查的是精简列，省带宽。

## 还没做（下一步）

1. 管理端写接口（`POST/PUT/DELETE /api/admin/tools` + 审核），复用现有 `middleware/auth.js` 的 `adminAuth`。
2. 登录注册切到 `ai_tools.users`（现有 `/api/user` 打在 `personal_website.users` 上，表结构不同）。
3. 点击埋点 `POST /api/tools/:id/click`、收藏、评价。
4. 静态化/预渲染：Vite 保持 SPA，靠 `vite-plugin-ssg` 或独立 sitemap 脚本补 SEO。

## 智能体（Agent）

内置三个智能体定义在 `db/05-agents.sql`：文件阅读助手、图片分析助手、任务拆解助手。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/agents` | 列表 + 模型配置状态 |
| GET | `/api/agents/:slug` | 详情（**不返回 `system_prompt`**） |
| POST | `/api/agents/files` | 上传文件，`multipart/form-data`，字段名 `file` |
| POST | `/api/agents/:slug/run` | 运行一次 |

```json
{
  "message": "这份文件讲了什么？",
  "history": [{ "role": "user", "content": "上一轮提问" }],
  "fileIds": ["uuid"],
  "sessionId": "前端生成的会话 id"
}
```

支持的文件：图片（png/jpg/webp/gif）与文本类（txt/md/json/csv/log/js/ts/py/sql 等），单文件 10MB 上限，单次最多 5 个。

**文本文件**入库时就抽出纯文本存进 `agent_files.extracted_text`，运行时直接拼进 prompt；
**图片**运行时转成 data URL 走多模态消息，需要配置 `LLM_VISION_MODEL`。

### 配置模型

走 OpenAI 兼容协议，换服务商只改地址：

```bash
LLM_BASE_URL=https://api.deepseek.com/v1   # 或 openai / moonshot / ollama
LLM_API_KEY=sk-xxx
LLM_MODEL=deepseek-chat
LLM_VISION_MODEL=                          # 图片分析建议填多模态模型
```

不填 `LLM_API_KEY` 时进入**示例模式**：接口照常返回，内容标注为模拟，前端显示“示例模式”角标，交互能完整走通。

### 新增智能体

目前直接写库（管理界面是下一步）：

```sql
INSERT INTO agents
  (slug, name, tagline, description, icon, system_prompt, capabilities, starter_prompts, sort_order)
VALUES
  ('meeting-notes', '会议纪要整理', '把转写文本整理成决议和待办',
   '粘贴会议转写，输出决议、待办、负责人和截止时间。', '📝',
   '你是会议纪要助手。输出三部分：结论、待办（含负责人）、待确认项。不要编造未提及的内容。',
   '["file"]', '["帮我整理这份会议记录"]', 70);
```

`capabilities` 决定前端显示哪些上传入口：含 `file` 显示文档，含 `image` 显示图片。

## 排错

| 现象 | 原因 |
|---|---|
| `ER_ACCESS_DENIED_ERROR` | `.env` 里的账号密码和 docker 里 mysql 不一致 |
| `ER_NO_SUCH_TABLE` | 没跑 `npm run db:init`，或连到了别的库 |
| `WITH PARSER ngram` 报错 | 数据库不是 MySQL 8（MariaDB 不支持），删掉 `01-schema.sql` 里该子句并设 `SEARCH_MODE=like` |
| 前端 404 | 后端没起，或 `vite.config.js` 的代理端口不是 8080 |
