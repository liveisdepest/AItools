# AI 工具导航站 · 数据模型设计

> 配套文件：`server/db/01-schema.sql`、`02-seed-reference.sql`、`03-seed-tools.sql`、`04-seed-relations.sql`
> 目标：MySQL 8.0+，Node 后端通过 `mysql2` 或 Prisma 读写

## 1. 关系总览

```
users ──┬── favorites ──┐
        ├── reviews ────┤
        └── tools(投稿)  │
                         │
categories ── tools ─────┼── tool_tags ── tags
                │        │
                ├── tool_screenshots
                ├── tool_clicks
                └── collection_tools ── collections

search_logs（独立运营表）
```

10 张表，按职责分四组：

| 组 | 表 | 说明 |
|---|---|---|
| 内容主体 | `tools` + `categories` + `tags` + `tool_tags` + `tool_screenshots` | 站点的全部可浏览内容 |
| 运营编排 | `collections` + `collection_tools` | 专题合集，首页与 SEO 专题页的数据源 |
| 用户行为 | `favorites` + `reviews` + `tool_clicks` | 登录用户产生，`tool_clicks` 匿名也记 |
| 增长分析 | `search_logs` | 看“搜了没结果”的词，反推该补什么工具 |

## 2. 六个关键取舍

**① URL 用 `slug` 不用自增 id。**
`/tools/cursor` 比 `/tools/27` 对搜索和分享都友好。代价是 slug 一旦发布就不要改，改了必须做 301。`tools.slug` 建了唯一索引，`categories`、`tags`、`collections` 同理。

**② 删除用状态位，不做物理删除。**
`status ENUM('draft','pending','published','offline')`。工具下架后页面 404，但历史点击、外链、评价都还在，方便复盘。真正要删才走 `DELETE`（外键会级联清掉关联）。

**③ 计数字段冗余存放。**
`tools.click_count` / `rating_avg` / `favorite_count`、`categories.tool_count` 都是冗余值。列表页按点击排序若每次都 `COUNT(*)` 子查询，几百条就能把数据库拖慢。代价是必须维护一致性——见第 5 节。

**④ `platforms` 用 JSON 而不是关联表。**
取值是个封闭小集合（web/ios/android/desktop/api/chrome），不会有人拿它当主查询维度。用 JSON 省两张表，筛选时 `JSON_CONTAINS(platforms, '"api"')` 即可。如果以后要按平台做聚合页，再抽表。

**⑤ 点击与工具分表。**
`tool_clicks` 是唯一会快速膨胀的表（每 UV 若干行）。独立出来才能单独加索引、按时间分区、定期归档到冷表，不影响 `tools` 的读写。

**⑥ 中文搜索依赖 ngram 分词器。**
MySQL 默认分词器把整句中文当一个 token，`FULLTEXT` 等于没用。`01-schema.sql` 里用了 `WITH PARSER ngram`（MySQL 8 内置）。如果目标库是 MariaDB，这一句会直接报错，需要删掉该子句、退回 `LIKE '%关键词%'`，或者直接上 Meilisearch。

## 3. 枚举字典

| 字段 | 取值 | 前端展示 |
|---|---|---|
| `tools.pricing_type` | `free` / `freemium` / `paid` / `trial` | 免费 / 免费+付费 / 付费 / 仅试用 |
| `tools.status` | `draft` / `pending` / `published` / `offline` | 草稿 / 待审 / 已发布 / 已下线 |
| `users.role` | `user` / `admin` | 用户 / 管理员 |
| `reviews.status` | `pending` / `published` / `rejected` | 待审 / 已展示 / 已拒绝 |
| `tool_clicks.source` | `list` / `detail` / `collection` / `rank` | 用于区分哪个位置带来的点击 |

`platforms` 允许值：`web`、`ios`、`android`、`desktop`、`api`、`chrome`。

## 4. 典型查询

**列表页（分类 + 价格 + 平台 + 排序 + 分页）**

```sql
SELECT t.id, t.slug, t.name, t.tagline, t.logo_url, t.website_url,
       t.pricing_type, t.price_note, t.platforms,
       t.rating_avg, t.click_count, t.is_featured,
       c.name AS category_name, c.slug AS category_slug
FROM tools t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.status = 'published'
  AND (? IS NULL OR c.slug = ?)
  AND (? IS NULL OR t.pricing_type = ?)
  AND (? IS NULL OR JSON_CONTAINS(t.platforms, JSON_QUOTE(?)))
ORDER BY t.is_featured DESC, t.click_count DESC, t.id DESC
LIMIT ? OFFSET ?;
```

排序策略建议只开三种，别做自由排序：`recommend`（推荐位+点击）、`newest`（`published_at`）、`rating`（评分，需 `rating_count >= 3` 才参与，否则会被一条五星刷到顶）。

**详情页（工具 + 分类 + 标签 + 截图）**

```sql
SELECT t.*, c.name AS category_name, c.slug AS category_slug
FROM tools t LEFT JOIN categories c ON c.id = t.category_id
WHERE t.slug = ? AND t.status = 'published';

SELECT g.id, g.slug, g.name
FROM tool_tags tt JOIN tags g ON g.id = tt.tag_id
WHERE tt.tool_id = ?;

SELECT url, caption FROM tool_screenshots
WHERE tool_id = ? ORDER BY sort_order LIMIT 8;
```

**相关推荐**（同分类 + 标签重叠，别用随机）

```sql
SELECT t.slug, t.name, t.tagline, t.logo_url,
       COUNT(*) AS shared_tags
FROM tool_tags a
JOIN tool_tags b ON b.tag_id = a.tag_id AND b.tool_id <> a.tool_id
JOIN tools t ON t.id = b.tool_id AND t.status = 'published'
WHERE a.tool_id = ?
GROUP BY t.id
ORDER BY shared_tags DESC, t.click_count DESC
LIMIT 6;
```

**全文搜索**

```sql
SELECT slug, name, tagline, MATCH(name, tagline, description) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
FROM tools
WHERE status = 'published'
  AND MATCH(name, tagline, description) AGAINST (? IN NATURAL LANGUAGE MODE)
ORDER BY score DESC
LIMIT 20;
```

搜不到结果时，把关键词和 `result_count = 0` 写进 `search_logs` —— 这份表才是后面选题的依据。

**热门榜（近 7 天点击）**

```sql
SELECT t.slug, t.name, COUNT(*) AS clicks
FROM tool_clicks k JOIN tools t ON t.id = k.tool_id
WHERE k.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY t.id
ORDER BY clicks DESC
LIMIT 20;
```

## 5. 冗余计数怎么维护

**方案：应用层放在同一个事务里改，不写触发器。**

- 新增评价：`INSERT reviews` 后重算该工具的 `rating_avg / rating_count`
- 收藏：`INSERT/DELETE favorites` 后 `favorite_count ± 1`
- 点击：直接 `UPDATE tools SET click_count = click_count + 1`（这条可以异步批量刷，不必同步）
- 发布/下线：重跑 `04-seed-relations.sql` 末尾那段 UPDATE

避免触发器的原因：后面接队列、批量导入、后台改状态时，触发器会变成看不见的副作用来源，排查困难。**允许短时间不一致**，每天跑一次对账 SQL 兜底：

```sql
-- 找出计数对不上的工具
SELECT t.id, t.name, t.favorite_count,
       (SELECT COUNT(*) FROM favorites f WHERE f.tool_id = t.id) AS real_count
FROM tools t
HAVING t.favorite_count <> real_count;
```

## 6. 后端接口契约

沿用现有前端的响应格式（`res.code === 200` 才进数据分支），这样 `src/api/index.js` 的拦截器一行都不用改：

```json
{ "code": 200, "message": "ok", "data": {} }
```

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/tools` | 否 | 列表：`category` `pricing` `platform` `q` `sort` `page` `pageSize` |
| GET | `/api/tools/:slug` | 否 | 详情，含标签、截图、相关推荐 |
| GET | `/api/categories` | 否 | 分类树，带 `tool_count` |
| GET | `/api/tags/:slug/tools` | 否 | 标签聚合页 |
| GET | `/api/collections/:slug` | 否 | 合集及其工具 |
| GET | `/api/search/suggest?q=` | 否 | 搜索联想，最多 10 条 |
| POST | `/api/tools/:id/click` | 否 | 记录跳转，返回目标 URL |
| GET/POST/DELETE | `/api/favorites[/:toolId]` | 是 | 我的收藏 |
| POST | `/api/tools/:id/reviews` | 是 | 提交评价 |
| POST | `/api/tools/submit` | 是 | 用户投稿，落库 `status='pending'` |
| GET | `/api/admin/tools` | 管理员 | 含草稿与待审 |
| POST/PUT/DELETE | `/api/admin/tools[/:id]` | 管理员 | 增删改 |
| PATCH | `/api/admin/tools/:id/status` | 管理员 | 审核通过 / 下线 |
| GET | `/api/admin/stats` | 管理员 | 点击、搜索词、待审数量 |

列表返回建议带分页信封：

```json
{
  "code": 200,
  "data": {
    "list": [{ "slug": "cursor", "name": "Cursor", "tagline": "...", "pricingType": "freemium" }],
    "total": 60,
    "page": 1,
    "pageSize": 20
  }
}
```

> 数据库是 snake_case，接口建议统一 camelCase，转换放在 Node 层（用 `mysql2` 的 `rowsAsArray` 或写个 `toCamel` 工具），别让前端适配两套命名。

## 7. 和现有前端的字段映射

`Projects.vue` 那套 CRUD 直接平移，改这些字段即可：

| 现有字段 | 新字段 | 说明 |
|---|---|---|
| `name` | `name` | 不变 |
| `description` | `tagline` + `description` | 拆成一句话定位和长描述 |
| `emoji` | `logo_url` | 改成真实 logo，兜底用域名 favicon |
| `gradient` | `cover_url` | 渐变占位换成真实截图 |
| `tech_stack` | `tags` | 从自由文本数组变成关联表 |
| `github_url` / `demo_url` | `website_url` / `affiliate_url` | 统一成一个官网 + 一个渠道链接 |
| — | `pricing_type` / `price_note` | 新增，筛选的核心维度 |
| — | `platforms` | 新增 |
| `sort_order` | `sort_order` + `is_featured` | 推荐位独立出来 |

`logo_url` 为空时的兜底规则（前端实现）：

```js
const logo = tool.logoUrl || `https://www.google.com/s2/favicons?domain=${new URL(tool.websiteUrl).hostname}&sz=128`
```

## 8. 初始化步骤

**方式一：Node 脚本（推荐，自动跑完四个文件并自检）**

```bash
cd server
cp .env.example .env      # 改数据库账号密码
npm run db:init           # 建库 + 建表 + 灌数据
npm run db:reset          # 需要推倒重来时（会 DROP DATABASE）
```

**方式二：直接用 docker 里的 mysql 客户端**

```bash
# 1. 建表
docker exec -i mysql容器 mysql -uroot -p < server/db/01-schema.sql
# 2. 分类 / 标签 / 合集
docker exec -i mysql容器 mysql -uroot -p < server/db/02-seed-reference.sql
# 3. 60 个工具
docker exec -i mysql容器 mysql -uroot -p < server/db/03-seed-tools.sql
# 4. 关联关系 + 计数自检
docker exec -i mysql容器 mysql -uroot -p < server/db/04-seed-relations.sql
```

最后一条会输出 `categories=8, tools=60, tags=32, collections=3`，对得上就说明灌数据成功。

## 9. 还没做、但要有心理准备的四件事

1. **logo 与截图没做**：种子数据里 `logo_url` 全为空，靠 favicon 兜底能上线，但视觉上会显得廉价，运营阶段要补。
2. **价格会过期**：`price_note` 只写了模式（“免费额度 + 订阅”），没写具体金额，这是刻意的；真要做“价格对比”功能，得单独建 `tool_pricing` 表并标注采集时间。
3. **没有多语言**：如果以后要做英文站，`name/tagline/description` 需要拆到 `tool_translations(tool_id, locale, ...)`，现在别提前优化。
4. **没有软删除标记**：物理删除会丢历史。真要删工具时，建议先 `status='offline'` 观察三个月再删。
