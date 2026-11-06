-- ============================================================
-- 工具种子数据（60 条，覆盖 8 个分类）
-- 依赖：02-seed-reference.sql
-- 说明：
--   1. logo_url 统一留空，前端按 website_url 的域名取 favicon 兜底，
--      运营后续可在后台单独覆盖。
--   2. price_note 只写模式不写精确价格，避免随时间失效；上线前请人工核实。
--   3. 平台字段用 JSON 数组：web / ios / android / desktop / api / chrome。
-- ============================================================

SET NAMES utf8mb4;
USE ai_tools;

INSERT INTO tools
(id, slug, name, tagline, description, website_url, category_id, pricing_type, price_note, platforms, supports_chinese, requires_login, has_free_trial, is_featured, sort_order, status, published_at)
VALUES
-- ---------- 写作与内容 ----------
(1, 'chatgpt', 'ChatGPT', '通用对话助手，写作、翻译、分析一站搞定',
 'OpenAI 的旗舰产品，文本、图像、代码、文件分析都覆盖，通用场景的默认选择。',
 'https://chatgpt.com', 1, 'freemium', '免费版可用，Plus 按月订阅',
 '["web","ios","android","desktop"]', 1, 1, 0, 1, 100, 'published', NOW()),

(2, 'claude', 'Claude', '长文写作与代码理解，上下文又稳又长',
 'Anthropic 出品，擅长长文档处理、结构化写作与代码重构，语气控制更自然。',
 'https://claude.ai', 1, 'freemium', '免费额度 + Pro 订阅',
 '["web","ios","android","desktop","api"]', 1, 1, 0, 1, 95, 'published', NOW()),

(3, 'deepseek', 'DeepSeek', '国产开源模型对话，推理和代码很能打',
 '深度求索的对话产品，数学与代码推理突出，同时提供价格极低的 API。',
 'https://chat.deepseek.com', 1, 'freemium', '免费使用，API 按量计费',
 '["web","ios","android","api"]', 1, 1, 0, 1, 90, 'published', NOW()),

(4, 'jasper', 'Jasper', '给营销团队用的品牌语气文案工厂',
 '围绕品牌语气库和营销模板设计，适合批量产出广告语、落地页和社媒内容。',
 'https://www.jasper.ai', 1, 'paid', '订阅制，无长期免费版',
 '["web","api","chrome"]', 0, 1, 1, 0, 10, 'published', NOW()),

(5, 'copy-ai', 'Copy.ai', '营销文案与销售话术批量生成',
 '以工作流方式组织文案生产，适合销售外呼邮件、产品描述等重复性写作。',
 'https://www.copy.ai', 1, 'freemium', '免费额度 + 付费套餐',
 '["web","api"]', 0, 1, 1, 0, 10, 'published', NOW()),

(6, 'grammarly', 'Grammarly', '英文写作的实时语法与语气修正',
 '浏览器与 Office 插件形态，边写边改，适合英文邮件、论文和客户沟通。',
 'https://www.grammarly.com', 1, 'freemium', '免费版 + Premium 订阅',
 '["web","desktop","chrome","ios","android"]', 0, 1, 0, 0, 10, 'published', NOW()),

(7, 'quillbot', 'QuillBot', '英文改写、摘要与引用一条龙',
 '学生和写作场景常用，改写模式多，配合摘要与引用生成能省不少时间。',
 'https://quillbot.com', 1, 'freemium', '免费版限字数',
 '["web","chrome"]', 0, 1, 0, 0, 10, 'published', NOW()),

-- ---------- 图像与设计 ----------
(8, 'midjourney', 'Midjourney', '出图审美在线的文生图天花板',
 '以 Discord 和网页版使用，风格一致性强，适合概念图和视觉探索。',
 'https://www.midjourney.com', 2, 'paid', '订阅制，无免费额度',
 '["web","desktop"]', 0, 1, 0, 1, 100, 'published', NOW()),

(9, 'stable-diffusion', 'Stable Diffusion', '开源可本地部署的图像生成底座',
 'Stability AI 开源，模型与插件生态最丰富，可完全离线运行并自行微调。',
 'https://stability.ai', 2, 'free', '开源免费，算力自备',
 '["web","desktop","api"]', 0, 0, 0, 0, 20, 'published', NOW()),

(10, 'dalle-3', 'DALL·E 3', '用日常语言描述就能出图',
 '已并入 ChatGPT，理解复杂中文描述的能力不错，对话式改图也顺手。',
 'https://openai.com/dall-e-3', 2, 'freemium', '随 ChatGPT 订阅使用',
 '["web","api"]', 1, 1, 0, 0, 15, 'published', NOW()),

(11, 'adobe-firefly', 'Adobe Firefly', '可商用的 Adobe 系生成模型',
 '与 Photoshop、Illustrator 打通，训练数据授权清晰，商用顾虑小。',
 'https://firefly.adobe.com', 2, 'freemium', '每月生成额度 + 订阅',
 '["web"]', 0, 1, 0, 0, 15, 'published', NOW()),

(12, 'canva-magic-studio', 'Canva Magic Studio', '模板设计加 AI，一键成套出图',
 '在成熟模板体系上叠加 AI 能力，做海报、社媒图和演示文稿最快的一条路。',
 'https://www.canva.com/magic-studio/', 2, 'freemium', '免费版 + Pro 订阅',
 '["web","ios","android"]', 1, 1, 0, 0, 12, 'published', NOW()),

(13, 'leonardo-ai', 'Leonardo.Ai', '偏游戏美术风格的图像生成',
 '模型预设偏插画与游戏资产，自带画布编辑和素材放大，适合做美术参考。',
 'https://leonardo.ai', 2, 'freemium', '每日免费额度 + 订阅',
 '["web","api"]', 0, 1, 0, 0, 10, 'published', NOW()),

(14, 'ideogram', 'Ideogram', '少数能把图上文字写对的模型',
 '海报与 Logo 场景优势明显，文字排版准确率高于同类模型。',
 'https://ideogram.ai', 2, 'freemium', '免费额度 + 订阅',
 '["web"]', 0, 1, 0, 0, 10, 'published', NOW()),

(15, 'remove-bg', 'Remove.bg', '一键抠图去背景',
 '只做一件事但做得足够好，提供 API，电商和素材处理常备。',
 'https://www.remove.bg', 2, 'freemium', '免费低分辨率，高清按张计费',
 '["web","api","desktop"]', 0, 0, 0, 0, 8, 'published', NOW()),

(16, 'jimeng', '即梦 AI', '字节的中文绘画与视频生成',
 '中文提示词友好，图生视频与数字人能力打包在一起，国内可直接访问。',
 'https://jimeng.jianying.com', 2, 'freemium', '每日积分免费，可充值',
 '["web","ios","android"]', 1, 1, 0, 0, 20, 'published', NOW()),

(17, 'tongyi-wanxiang', '通义万相', '阿里系中文图像生成',
 '中文语义理解好，与通义生态打通，适合国内团队的日常配图需求。',
 'https://tongyi.aliyun.com/wanxiang/', 2, 'freemium', '免费额度 + 按量计费',
 '["web","api"]', 1, 1, 0, 0, 18, 'published', NOW()),

-- ---------- 视频与动画 ----------
(18, 'runway', 'Runway', 'Gen 系列文生视频与 AI 剪辑',
 '影视级工具链，镜头运动、风格迁移、抠像都覆盖，创作者社区活跃。',
 'https://runwayml.com', 3, 'freemium', '免费额度 + 订阅',
 '["web"]', 0, 1, 1, 1, 100, 'published', NOW()),

(19, 'pika', 'Pika', '轻量文生视频，短视频素材利器',
 '上手快，特效模板多，适合做社交平台的短素材和动图。',
 'https://pika.art', 3, 'freemium', '免费额度 + 订阅',
 '["web","ios"]', 0, 1, 0, 0, 20, 'published', NOW()),

(20, 'sora', 'Sora', 'OpenAI 的文本生成视频模型',
 '画面一致性和物理感领先，按订阅档位开放，生成时长仍有限制。',
 'https://openai.com/sora', 3, 'paid', '需 ChatGPT 付费订阅',
 '["web"]', 0, 1, 0, 0, 18, 'published', NOW()),

(21, 'heygen', 'HeyGen', '数字人播报与多语言口型同步',
 '上传形象和声音即可批量出讲解视频，翻译后口型能对上，适合出海内容。',
 'https://www.heygen.com', 3, 'freemium', '免费试用 + 订阅',
 '["web","api"]', 1, 1, 1, 0, 15, 'published', NOW()),

(22, 'synthesia', 'Synthesia', '企业级数字人培训视频',
 '主打合规与团队协作，模板化的企业培训视频生产流程。',
 'https://www.synthesia.io', 3, 'paid', '订阅制，需询价',
 '["web"]', 0, 1, 1, 0, 10, 'published', NOW()),

(23, 'kling', '可灵 AI', '快手的中文视频生成',
 '中文提示词与物理运动表现稳定，国内访问快，图生视频口碑不错。',
 'https://klingai.com', 3, 'freemium', '每日免费额度 + 会员',
 '["web","ios","android"]', 1, 1, 0, 1, 90, 'published', NOW()),

(24, 'luma-dream-machine', 'Luma Dream Machine', '图生视频与镜头运镜控制',
 '从关键帧生成连贯视频，运镜指令直观，适合做产品演示片段。',
 'https://lumalabs.ai/dream-machine', 3, 'freemium', '免费额度 + 订阅',
 '["web"]', 0, 1, 0, 0, 15, 'published', NOW()),

(25, 'jianying', '剪映', '剪辑软件里长出来的 AI 能力',
 '自动字幕、智能成片、数字人配音一体化，国内短视频工作流的事实标准。',
 'https://www.capcut.cn', 3, 'freemium', '基础免费，会员增值',
 '["web","desktop","ios","android"]', 1, 1, 0, 0, 25, 'published', NOW()),

-- ---------- 编程与开发 ----------
(26, 'github-copilot', 'GitHub Copilot', 'IDE 里的代码补全与对话',
 '覆盖主流编辑器，补全质量与生态集成成熟，企业版支持私有代码索引。',
 'https://github.com/features/copilot', 4, 'paid', '订阅制，学生与开源作者免费',
 '["desktop","api"]', 0, 1, 1, 1, 95, 'published', NOW()),

(27, 'cursor', 'Cursor', 'AI 原生编辑器，多文件重构利器',
 '基于 VS Code 改造，Agent 模式能读整个仓库并跨文件改代码，效率最高的形态之一。',
 'https://cursor.com', 4, 'freemium', '免费额度 + Pro 订阅',
 '["desktop"]', 1, 1, 0, 1, 100, 'published', NOW()),

(28, 'windsurf', 'Windsurf', 'Agent 模式驱动的 AI IDE',
 '用 Cascade 流程把改代码、跑命令、看结果串起来，适合中大型任务。',
 'https://windsurf.com', 4, 'freemium', '免费额度 + 订阅',
 '["desktop"]', 0, 1, 1, 0, 20, 'published', NOW()),

(29, 'tabnine', 'Tabnine', '主打私有化部署的代码补全',
 '支持本地或私有云运行，代码不能出内网时是少数可选方案。',
 'https://www.tabnine.com', 4, 'freemium', '免费版 + 企业授权',
 '["desktop","api"]', 0, 1, 1, 0, 8, 'published', NOW()),

(30, 'v0', 'v0 by Vercel', '一句话生成 React 界面',
 '输出 Tailwind 组件并可直接部署，前端原型阶段最省时间的工具之一。',
 'https://v0.dev', 4, 'freemium', '免费额度 + 订阅',
 '["web"]', 0, 1, 0, 0, 18, 'published', NOW()),

(31, 'bolt-new', 'Bolt.new', '浏览器里生成并部署全栈应用',
 '在沙箱里直接跑 npm 和构建，适合快速验证想法和小工具。',
 'https://bolt.new', 4, 'freemium', '免费额度 + 订阅',
 '["web"]', 0, 1, 0, 0, 15, 'published', NOW()),

(32, 'replit', 'Replit', '云端 IDE 加 Agent',
 '环境开箱即用，Agent 能从零搭一个能跑的应用，协作体验好。',
 'https://replit.com', 4, 'freemium', '免费版 + 订阅',
 '["web","ios","android"]', 0, 1, 0, 0, 10, 'published', NOW()),

(33, 'tongyi-lingma', '通义灵码', '阿里免费的中文代码助手',
 '中文注释与业务语义理解好，个人版免费，国内网络环境稳定。',
 'https://lingma.aliyun.com', 4, 'free', '个人版免费',
 '["desktop"]', 1, 1, 0, 1, 85, 'published', NOW()),

(34, 'trae', 'Trae', '字节的 AI IDE，中文友好',
 '内置 Builder 模式可端到端搭项目，界面全中文，国内可直接使用。',
 'https://www.trae.ai', 4, 'free', '免费使用',
 '["desktop"]', 1, 1, 0, 1, 80, 'published', NOW()),

-- ---------- 音频与语音 ----------
(35, 'elevenlabs', 'ElevenLabs', '目前最自然的语音合成与音色克隆',
 '情感和呼吸感接近真人，支持多语种，配音和有声书场景常用。',
 'https://elevenlabs.io', 5, 'freemium', '每月字符额度 + 订阅',
 '["web","api"]', 1, 1, 0, 0, 20, 'published', NOW()),

(36, 'suno', 'Suno', '一句话生成完整歌曲',
 '从旋律、编曲到人声一次生成，做短视频配乐和创意小样的首选。',
 'https://suno.com', 5, 'freemium', '每日免费额度 + 订阅',
 '["web","ios","android"]', 0, 1, 0, 1, 90, 'published', NOW()),

(37, 'udio', 'Udio', '高质量 AI 音乐生成',
 '音质与结构控制更细，支持延长和分段编辑，适合认真做 demo 的人。',
 'https://www.udio.com', 5, 'freemium', '免费额度 + 订阅',
 '["web"]', 0, 1, 0, 0, 15, 'published', NOW()),

(38, 'murf', 'Murf', '商用配音与多语种旁白',
 '主打商用授权和企业配音流程，音色库偏正式场合。',
 'https://murf.ai', 5, 'freemium', '免费试听，导出需订阅',
 '["web","api"]', 1, 1, 1, 0, 8, 'published', NOW()),

(39, 'whisper', 'Whisper', '开源语音转写，多语言都稳',
 'OpenAI 开源，可本地跑，中文识别质量在开源方案里领先。',
 'https://github.com/openai/whisper', 5, 'free', '开源免费，算力自备',
 '["desktop","api"]', 1, 0, 0, 0, 15, 'published', NOW()),

-- ---------- 效率与办公 ----------
(40, 'notion-ai', 'Notion AI', '长在笔记库里的写作与问答',
 '直接在文档与数据库里调用，能跨页面检索，把知识沉淀变成可问答的资产。',
 'https://www.notion.so/product/ai', 6, 'paid', '随 Notion 订阅加购',
 '["web","desktop","ios","android"]', 1, 1, 1, 0, 20, 'published', NOW()),

(41, 'gamma', 'Gamma', '一句话生成可分享的演示文稿',
 '版式自动排版，改内容不用重排版，导出 PPT 与网页都方便。',
 'https://gamma.app', 6, 'freemium', '免费额度 + 订阅',
 '["web"]', 1, 1, 0, 0, 18, 'published', NOW()),

(42, 'tome', 'Tome', '叙事式 AI 演示工具',
 '以故事线组织页面，适合融资路演和产品发布这类需要节奏感的场合。',
 'https://tome.app', 6, 'freemium', '免费额度 + 订阅',
 '["web"]', 0, 1, 0, 0, 8, 'published', NOW()),

(43, 'otter-ai', 'Otter.ai', '会议录音转写与自动纪要',
 '实时转写并提取行动项，接入 Zoom 和 Meet，英文会议体验最好。',
 'https://otter.ai', 6, 'freemium', '每月免费分钟数 + 订阅',
 '["web","ios","android"]', 0, 1, 0, 0, 15, 'published', NOW()),

(44, 'perplexity', 'Perplexity', '每个答案都带引用来源的搜索引擎',
 '把检索和生成合成一体，做资料调研比传统搜索快很多。',
 'https://www.perplexity.ai', 6, 'freemium', '免费额度 + Pro 订阅',
 '["web","ios","android","chrome"]', 1, 1, 0, 1, 95, 'published', NOW()),

(45, 'napkin-ai', 'Napkin AI', '把文字自动变成信息图',
 '粘贴一段说明文字就能生成可编辑的流程图和对比图，做文档配图很省事。',
 'https://www.napkin.ai', 6, 'freemium', '内测阶段免费',
 '["web"]', 0, 1, 0, 0, 10, 'published', NOW()),

(46, 'feishu-ai', '飞书智能伙伴', '长在企业协作流里的 AI 助手',
 '能读文档、会议和群聊上下文，中文办公场景落地最顺的一类产品。',
 'https://www.feishu.cn/product/ai', 6, 'paid', '随飞书版本订阅',
 '["web","desktop","ios","android"]', 1, 1, 1, 0, 12, 'published', NOW()),

-- ---------- 智能体与自动化 ----------
(47, 'dify', 'Dify', '开源的 LLM 应用与 Agent 编排平台',
 '可视化编排加知识库加 API 发布一体，可自托管，做企业级 AI 应用上手快。',
 'https://dify.ai', 7, 'freemium', '开源自托管免费，云版订阅',
 '["web","api"]', 1, 1, 0, 0, 25, 'published', NOW()),

(48, 'coze', '扣子 Coze', '零代码搭 Bot 并发布到多平台',
 '字节出品，插件和知识库开箱即用，能一键发布到飞书、微信等渠道。',
 'https://www.coze.cn', 7, 'free', '免费使用',
 '["web"]', 1, 1, 0, 1, 85, 'published', NOW()),

(49, 'n8n', 'n8n', '开源自动化工作流，可接大模型节点',
 '自托管友好，把 API、数据库、消息渠道和 LLM 串成自动化流程。',
 'https://n8n.io', 7, 'freemium', '开源自托管免费，云版订阅',
 '["web","api"]', 1, 1, 0, 0, 20, 'published', NOW()),

(50, 'autogpt', 'AutoGPT', '自主拆解任务的开源 Agent 框架',
 '最早把目标驱动的自动执行跑通的项目之一，适合研究 Agent 架构。',
 'https://github.com/Significant-Gravitas/AutoGPT', 7, 'free', '开源免费，算力自备',
 '["desktop","api"]', 0, 0, 0, 0, 10, 'published', NOW()),

(51, 'langchain', 'LangChain', '构建 LLM 应用的开发框架',
 '生态最全的编排库，链、工具调用、记忆、检索都有现成实现，配套 LangSmith 可观测。',
 'https://www.langchain.com', 7, 'free', '开源免费',
 '["api"]', 0, 0, 0, 0, 12, 'published', NOW()),

(52, 'manus', 'Manus', '通用任务型 Agent',
 '给定目标后自行搜索、操作浏览器并交付结果，适合调研与批量信息处理。',
 'https://manus.im', 7, 'paid', '邀请制订阅',
 '["web"]', 1, 1, 0, 0, 30, 'published', NOW()),

(53, 'zapier-ai', 'Zapier AI', '跨应用自动化里插入 AI 步骤',
 '连接数千个 SaaS，把摘要、分类、生成内容嵌进现有业务流程。',
 'https://zapier.com/ai', 7, 'freemium', '免费额度 + 订阅',
 '["web","api"]', 0, 1, 1, 0, 12, 'published', NOW()),

-- ---------- 模型与平台 ----------
(54, 'hugging-face', 'Hugging Face', '模型与数据集的最大开源社区',
 '找模型、试 Space、看榜单都在这，几乎所有开源模型的发布源头。',
 'https://huggingface.co', 8, 'freemium', '免费使用，推理按量计费',
 '["web","api"]', 0, 1, 0, 0, 25, 'published', NOW()),

(55, 'replicate', 'Replicate', '一行代码调用开源模型 API',
 '托管大量开源模型，按秒计费，免去自己部署 GPU 的麻烦。',
 'https://replicate.com', 8, 'paid', '按调用时长计费',
 '["api","web"]', 0, 1, 1, 0, 15, 'published', NOW()),

(56, 'openrouter', 'OpenRouter', '一个 API 聚合多家模型',
 '统一接口和计费，可对比不同模型的价格与延迟，方便做多模型兜底。',
 'https://openrouter.ai', 8, 'freemium', '按 token 计费，部分模型免费',
 '["api"]', 0, 1, 0, 0, 18, 'published', NOW()),

(57, 'ollama', 'Ollama', '本地一键跑开源大模型',
 '命令行拉起模型，提供兼容 OpenAI 的本地接口，隐私敏感场景首选。',
 'https://ollama.com', 8, 'free', '开源免费',
 '["desktop","api"]', 1, 0, 0, 0, 22, 'published', NOW()),

(58, 'siliconflow', '硅基流动', '国产模型 API 聚合与推理加速',
 '一个 Key 调多家国产开源模型，价格低，国内直连不需要额外网络配置。',
 'https://siliconflow.cn', 8, 'freemium', '新用户赠额 + 按量计费',
 '["api","web"]', 1, 1, 0, 0, 20, 'published', NOW()),

(59, 'deepseek-platform', 'DeepSeek 开放平台', '高性价比的国产推理 API',
 '与开源权重同源，长上下文价格低，适合批量文本处理和 Agent 后端。',
 'https://platform.deepseek.com', 8, 'freemium', '新用户赠额 + 按量计费',
 '["api"]', 1, 1, 0, 0, 18, 'published', NOW()),

(60, 'together-ai', 'Together AI', '开源模型托管与微调平台',
 '提供推理、微调与私有部署，适合把开源模型做成产品级服务。',
 'https://www.together.ai', 8, 'paid', '按量计费',
 '["api"]', 0, 1, 1, 0, 8, 'published', NOW());
