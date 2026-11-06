-- ============================================================
-- 智能体（Agent）：定义 / 上传文件 / 运行记录 / 消息
-- 依赖：01-schema.sql
-- ============================================================

SET NAMES utf8mb4;
USE ai_tools;

-- ------------------------------------------------------------
-- 智能体定义
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(64)   NOT NULL,
  name         VARCHAR(64)   NOT NULL,
  tagline      VARCHAR(120)  NOT NULL COMMENT '一句话说明它能干什么',
  description  TEXT          NULL COMMENT '详情页长描述，支持换行',
  icon         VARCHAR(16)   NOT NULL DEFAULT '🤖' COMMENT 'emoji',
  category     VARCHAR(32)   NOT NULL DEFAULT 'general',
  system_prompt TEXT         NOT NULL COMMENT '角色设定，运行时作为 system 消息',
  model        VARCHAR(64)   NULL COMMENT '为空用全局默认模型',
  temperature  DECIMAL(3,2)  NOT NULL DEFAULT 0.70,
  max_tokens   INT           NOT NULL DEFAULT 2000,
  capabilities JSON          NULL COMMENT '["file","image"] 决定前端显示哪些上传入口',
  starter_prompts JSON       NULL COMMENT '空状态下的推荐提问，数组',
  is_builtin   TINYINT       NOT NULL DEFAULT 0 COMMENT '内置不可删，可改',
  is_published TINYINT       NOT NULL DEFAULT 1,
  sort_order   INT           NOT NULL DEFAULT 0,
  run_count    INT UNSIGNED  NOT NULL DEFAULT 0,
  created_by   BIGINT UNSIGNED NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_agents_slug (slug),
  KEY idx_agents_listing (is_published, sort_order, id),
  CONSTRAINT fk_agents_user FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体定义';

-- ------------------------------------------------------------
-- 上传的文件（图片 / 文本）
-- 文本文件在入库时就抽出纯文本，运行时不重复解析
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_files (
  id             CHAR(36)    NOT NULL COMMENT 'uuid',
  session_id     VARCHAR(64) NULL COMMENT '匿名会话标识，接入登录后可换 user_id',
  user_id        BIGINT UNSIGNED NULL,
  original_name  VARCHAR(255) NOT NULL,
  stored_name    VARCHAR(255) NOT NULL,
  mime           VARCHAR(100) NOT NULL,
  size           INT UNSIGNED NOT NULL,
  kind           ENUM('text','image','other') NOT NULL DEFAULT 'other',
  extracted_text MEDIUMTEXT  NULL COMMENT '文本文件的正文，超长会被截断',
  created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_agent_files_session (session_id, created_at),
  CONSTRAINT fk_agent_files_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体上传文件';

-- ------------------------------------------------------------
-- 运行记录（一次提问 = 一条）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_runs (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  agent_id          INT UNSIGNED    NOT NULL,
  session_id        VARCHAR(64)     NULL,
  user_id           BIGINT UNSIGNED NULL,
  status            ENUM('ok','error') NOT NULL DEFAULT 'ok',
  model             VARCHAR(64)     NULL,
  prompt_tokens     INT             NOT NULL DEFAULT 0,
  completion_tokens INT             NOT NULL DEFAULT 0,
  latency_ms        INT             NOT NULL DEFAULT 0,
  mock              TINYINT         NOT NULL DEFAULT 0 COMMENT '1 表示未配置 API Key，走的是示例回复',
  error_message     VARCHAR(500)    NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_runs_agent (agent_id, created_at),
  KEY idx_runs_session (session_id, created_at),
  CONSTRAINT fk_runs_agent FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体运行记录';

CREATE TABLE IF NOT EXISTS agent_messages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id      BIGINT UNSIGNED NOT NULL,
  role        ENUM('system','user','assistant') NOT NULL,
  content     MEDIUMTEXT      NULL,
  attachments JSON            NULL COMMENT '[{id,name,kind}]',
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_messages_run (run_id, id),
  CONSTRAINT fk_messages_run FOREIGN KEY (run_id) REFERENCES agent_runs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='智能体对话消息';

-- ------------------------------------------------------------
-- 内置智能体
-- ------------------------------------------------------------
INSERT INTO agents
(slug, name, tagline, description, icon, category, system_prompt, temperature, max_tokens, capabilities, starter_prompts, is_builtin, is_published, sort_order)
VALUES
('file-reader', '文件阅读助手', '丢给它文档，直接问结论', 
 '支持 txt / md / json / csv / log。上传后它会先给要点摘要，再回答你针对文件的具体问题，答案只从文件里找，找不到会直说。',
 '📄', 'document',
 '你是一位严谨的文档阅读助手。用户上传的文件内容会以「--- 文件：文件名 ---」的分隔形式附在消息末尾。\n\n工作要求：\n1. 先用 3-5 条要点概括文件内容\n2. 再回答用户的具体问题，答案必须来自文件，不要补充文件以外的推测\n3. 引用时注明来自哪个文件\n4. 如果文件里没有相关信息，直接说「文件中没有提到」，不要编造\n5. 涉及数字、日期、人名时保持原样，不要四舍五入或改写',
 0.30, 2000, '["file"]',
 '["这份文件讲了什么？","帮我列出其中的关键结论","把里面的数据整理成表格","有哪些风险和待办事项？"]',
 1, 1, 100),

('image-analyst', '图片分析助手', '看图说话，把截图里的信息抠出来',
 '支持 png / jpg / webp / gif。可以描述画面、识别票据与表格、转写截图文字、判断界面元素。看不清的地方会明确说“看不清”。',
 '🖼️', 'vision',
 '你是图像分析助手。用户会发来图片，可能包含照片、截图、票据、表格或界面。\n\n工作要求：\n1. 先用一句话概括画面内容\n2. 再分点描述：主体对象、场景环境、画面中的文字信息\n3. 如果是文档或表格截图，按原文结构逐行转写，保留编号和字段名\n4. 如果是界面截图，指出页面类型和主要功能区\n5. 任何看不清、被遮挡或无法确定的内容，明确说明，绝对不要猜测数字、金额和日期',
 0.40, 2000, '["image"]',
 '["这张图里有什么？","把截图中的文字提取出来","这是一张票据，帮我提取关键字段","根据这张图，判断这是什么场景"]',
 1, 1, 90),

('task-planner', '任务拆解助手', '把一句话目标拆成能直接开干的步骤',
 '给它一个目标，它输出可执行计划：分步骤、每步的产出物、依赖关系、风险点。不给空话套话。',
 '🧭', 'planning',
 '你是任务规划助手。用户会给出一个目标或一件想做但不知从哪下手的事。\n\n输出格式要求：\n1. 第一行用一句话复述你理解的目标\n2. 然后把目标拆成 3-7 个步骤，每步写明：做什么、产出什么、预计耗时、依赖哪一步\n3. 最后列出关键风险和不确定项，以及一个「如果只有一天时间，先做哪几步」的建议\n\n硬性要求：不要输出「保持积极」「注意沟通」这类空话；每个步骤都必须是当天能动手执行的具体动作；如果目标本身有歧义，先问一个最关键的问题再给方案',
 0.60, 2000, '[]',
 '["我想做一个 AI 工具导航站，从哪开始？","帮我规划三天的学习计划","这个需求该怎么拆给团队？","我要写一份产品方案，怎么安排？"]',
 1, 1, 80);
