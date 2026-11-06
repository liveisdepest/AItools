-- ============================================================
-- AI 工具导航站 · 数据库结构
-- 目标库：MySQL 8.0+（utf8mb4）
-- 用法：docker exec -i <mysql容器> mysql -uroot -p < 01-schema.sql
-- 说明：设计文档见 docs/data-model.md
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS ai_tools
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE ai_tools;

-- ------------------------------------------------------------
-- 1. 用户
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(32)     NOT NULL,
  email         VARCHAR(128)    NOT NULL,
  password_hash VARCHAR(100)    NOT NULL COMMENT 'bcrypt / argon2 摘要，禁止存明文',
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  avatar_url    VARCHAR(512)    NULL,
  status        TINYINT         NOT NULL DEFAULT 1 COMMENT '1 正常 0 禁用',
  last_login_at DATETIME        NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户';

-- ------------------------------------------------------------
-- 2. 分类（支持两级：parent_id 为空即一级分类）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  parent_id   INT UNSIGNED  NULL,
  slug        VARCHAR(64)   NOT NULL COMMENT 'URL 用，全局唯一',
  name        VARCHAR(64)   NOT NULL,
  name_en     VARCHAR(64)   NULL,
  icon        VARCHAR(16)   NULL COMMENT 'emoji 或图标标识',
  description VARCHAR(255)  NULL,
  sort_order  INT           NOT NULL DEFAULT 0,
  tool_count  INT           NOT NULL DEFAULT 0 COMMENT '已发布工具数，应用层或定时任务维护',
  is_active   TINYINT       NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categories_slug (slug),
  KEY idx_categories_parent (parent_id, sort_order),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id)
    REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工具分类';

-- ------------------------------------------------------------
-- 3. 工具（核心表）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tools (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(96)     NOT NULL COMMENT 'URL 用，创建后不建议再改',
  name             VARCHAR(64)     NOT NULL,
  tagline          VARCHAR(120)    NOT NULL COMMENT '一句话定位，列表卡片展示',
  description      TEXT            NULL COMMENT 'Markdown 长描述，详情页展示',
  logo_url         VARCHAR(512)    NULL,
  cover_url        VARCHAR(512)    NULL COMMENT '详情页头图 / 列表大卡',
  website_url      VARCHAR(512)    NOT NULL,
  affiliate_url    VARCHAR(512)    NULL COMMENT '带渠道参数的跳转链接，为空则用 website_url',
  category_id      INT UNSIGNED    NULL,
  pricing_type     ENUM('free','freemium','paid','trial') NOT NULL DEFAULT 'freemium',
  price_note       VARCHAR(120)    NULL COMMENT '如：免费额度 + Pro 订阅',
  platforms        JSON            NULL COMMENT '["web","ios","android","desktop","api","chrome"]',
  supports_chinese TINYINT         NOT NULL DEFAULT 0,
  requires_login   TINYINT         NOT NULL DEFAULT 0,
  has_free_trial   TINYINT         NOT NULL DEFAULT 0,
  rating_avg       DECIMAL(3,2)    NOT NULL DEFAULT 0.00,
  rating_count     INT             NOT NULL DEFAULT 0,
  view_count       INT UNSIGNED    NOT NULL DEFAULT 0,
  click_count      INT UNSIGNED    NOT NULL DEFAULT 0,
  favorite_count   INT UNSIGNED    NOT NULL DEFAULT 0,
  is_featured      TINYINT         NOT NULL DEFAULT 0 COMMENT '首页推荐位',
  is_verified      TINYINT         NOT NULL DEFAULT 0 COMMENT '人工核实过链接与价格',
  sort_order       INT             NOT NULL DEFAULT 0,
  status           ENUM('draft','pending','published','offline') NOT NULL DEFAULT 'draft',
  published_at     DATETIME        NULL,
  submitted_by     BIGINT UNSIGNED NULL COMMENT '用户投稿人，为空表示运营录入',
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tools_slug (slug),
  KEY idx_tools_listing  (status, is_featured, sort_order, id),
  KEY idx_tools_category (category_id, status, click_count),
  KEY idx_tools_pricing  (pricing_type, status),
  KEY idx_tools_name     (name),
  KEY idx_tools_publish  (status, published_at),
  -- 中文检索需要 ngram 分词器（MySQL 8 内置）。若目标库为 MariaDB，删掉 WITH PARSER 子句，
  -- 退化为 LIKE 查询，或改用 Meilisearch。
  FULLTEXT KEY ft_tools_search (name, tagline, description) WITH PARSER ngram,
  CONSTRAINT fk_tools_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE SET NULL,
  CONSTRAINT fk_tools_submitted_by FOREIGN KEY (submitted_by)
    REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI 工具';

-- ------------------------------------------------------------
-- 4. 标签（多对多，用于长尾聚合页与内链）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(64)  NOT NULL,
  name       VARCHAR(32)  NOT NULL,
  tool_count INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tags_slug (slug),
  UNIQUE KEY uk_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签';

CREATE TABLE IF NOT EXISTS tool_tags (
  tool_id BIGINT UNSIGNED NOT NULL,
  tag_id  INT UNSIGNED    NOT NULL,
  PRIMARY KEY (tool_id, tag_id),
  KEY idx_tool_tags_tag (tag_id, tool_id),
  CONSTRAINT fk_tool_tags_tool FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE,
  CONSTRAINT fk_tool_tags_tag  FOREIGN KEY (tag_id)  REFERENCES tags  (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工具-标签关联';

-- ------------------------------------------------------------
-- 5. 工具截图
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_screenshots (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tool_id    BIGINT UNSIGNED NOT NULL,
  url        VARCHAR(512)    NOT NULL,
  caption    VARCHAR(120)    NULL,
  sort_order INT             NOT NULL DEFAULT 0,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_screenshots_tool (tool_id, sort_order),
  CONSTRAINT fk_screenshots_tool FOREIGN KEY (tool_id)
    REFERENCES tools (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工具截图';

-- ------------------------------------------------------------
-- 6. 专题合集（运营位，"2025 最好用的 10 个 AI 编程工具"）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collections (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(96)  NOT NULL,
  title        VARCHAR(120) NOT NULL,
  subtitle     VARCHAR(255) NULL,
  cover_url    VARCHAR(512) NULL,
  description  TEXT         NULL,
  is_published TINYINT      NOT NULL DEFAULT 0,
  is_featured  TINYINT      NOT NULL DEFAULT 0,
  sort_order   INT          NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_collections_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='专题合集';

CREATE TABLE IF NOT EXISTS collection_tools (
  collection_id INT UNSIGNED    NOT NULL,
  tool_id       BIGINT UNSIGNED NOT NULL,
  sort_order    INT             NOT NULL DEFAULT 0,
  note          VARCHAR(255)    NULL COMMENT '入选理由，展示在合集里',
  PRIMARY KEY (collection_id, tool_id),
  KEY idx_collection_tools_tool (tool_id),
  CONSTRAINT fk_ct_collection FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE,
  CONSTRAINT fk_ct_tool       FOREIGN KEY (tool_id)       REFERENCES tools (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合集-工具关联';

-- ------------------------------------------------------------
-- 7. 收藏
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
  user_id    BIGINT UNSIGNED NOT NULL,
  tool_id    BIGINT UNSIGNED NOT NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, tool_id),
  KEY idx_favorites_tool (tool_id, created_at),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_tool FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏';

-- ------------------------------------------------------------
-- 8. 评价（每人每工具一条，可修改）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tool_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  rating     TINYINT         NOT NULL,
  content    VARCHAR(1000)   NULL,
  status     ENUM('pending','published','rejected') NOT NULL DEFAULT 'published',
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reviews_tool_user (tool_id, user_id),
  KEY idx_reviews_listing (tool_id, status, created_at),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_tool FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工具评价';

-- ------------------------------------------------------------
-- 9. 点击埋点（高频写入，独立于 tools，便于后续分区/归档）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_clicks (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tool_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NULL,
  source     VARCHAR(32)     NOT NULL DEFAULT 'detail' COMMENT 'list / detail / collection / rank',
  referer    VARCHAR(512)    NULL,
  ip_hash    CHAR(64)        NULL COMMENT 'IP 的 SHA256，不存明文',
  ua         VARCHAR(255)    NULL,
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_clicks_tool (tool_id, created_at),
  KEY idx_clicks_time (created_at),
  CONSTRAINT fk_clicks_tool FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内跳转点击';

-- ------------------------------------------------------------
-- 10. 搜索词日志（找需求缺口：哪些词搜了没结果）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_logs (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  keyword      VARCHAR(64)     NOT NULL,
  result_count INT             NOT NULL DEFAULT 0,
  user_id      BIGINT UNSIGNED NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_search_keyword (keyword),
  KEY idx_search_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='搜索日志';

SET FOREIGN_KEY_CHECKS = 1;
