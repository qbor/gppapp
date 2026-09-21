# 轻账 · 个人财务记账与数据统计 Web 应用

基于 **Vue3 + Vite + Tailwind CSS + ECharts + Supabase** 的个人财务记账系统，适配毕业设计标准：功能完整、UI 精致、数据隔离安全、可直接部署演示。

## 功能特性

- **用户系统**：邮箱注册 / 登录 / 退出，登录态持久化（刷新不丢失），Supabase RLS 按用户隔离数据
- **游客模式**：未登录也能使用全部功能，数据保存在**当前设备本地**（localStorage）；注册登录后数据与账号绑定、云端同步
- **记账功能**：收入 / 支出切换（默认支出），金额 / 分类 / 时间 / 备注，表单合法性校验（金额非空、大于 0、最多两位小数）
- **分类管理**：11 个预设分类 + 自定义新增 / 重命名 / 删除（预设不可删），按收支类型分组
- **账单管理**：多维筛选（月份 / 收支类型 / 分类），时间倒序，按日分组，悬浮编辑删除，清空当月
- **数据统计**：当月收入 / 支出 / 结余 / 笔数总览卡片；分类占比饼图（支出 / 收入切换）；近 30 天折线图 / 近 12 个月柱状图
- **月度预算**：设置预算、进度条展示已用比例、超支提醒
- **交互体验**：弹窗动画、加载骨架、Toast 成功 / 失败提示、页面切换过渡、空数据占位

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3（Composition API + `<script setup>`）、Vue Router 4、Tailwind CSS 3、ECharts 5 |
| 后端 | Supabase（PostgreSQL 数据库、用户认证、自动 REST API、RLS 行级安全） |
| 构建 | Vite 5 |
| 部署 | 适配 GitHub 版本管理 + Vercel 一键部署 |

## 目录结构

```
finance-app/
├── index.html
├── vite.config.js          # Vite 配置（@ 别名、构建）
├── tailwind.config.js      # Tailwind 主题（品牌色、阴影、动画）
├── vercel.json             # SPA 路由回退（Vercel）
├── .env.example            # 环境变量模板（复制为 .env）
├── supabase/
│   └── schema.sql          # 建表 + RLS 策略 + 注册触发器（一键执行）
└── src/
    ├── main.js             # 应用入口（启动时恢复登录态）
    ├── App.vue             # 布局壳（独立页 / 侧边栏布局）
    ├── router/index.js     # 路由配置
    ├── lib/
    │   ├── supabase.js     # Supabase 客户端（读取 .env，未配置自动降级游客模式）
    │   ├── storage.js      # 游客模式 localStorage 数据层
    │   └── utils.js        # 常量与工具函数（金额校验、格式化等）
    ├── composables/
    │   ├── useAuth.js      # 认证状态（登录 / 注册 / 登出 / 会话监听）
    │   ├── useFinance.js   # 数据层（双模式：Supabase / localStorage）
    │   └── useToast.js     # 全局轻提示
    ├── components/
    │   ├── AppSidebar.vue  # 左侧固定导航
    │   ├── StatCard.vue    # 统计卡片
    │   ├── EChart.vue      # ECharts 封装（自适应）
    │   ├── AppModal.vue    # 通用弹窗
    │   ├── EmptyState.vue  # 空数据占位
    │   └── ToastContainer.vue
    └── views/
        ├── LoginView.vue       # 登录 / 注册（独立页）
        ├── HomeView.vue        # 首页数据总览（卡片 + 图表 + 近期账单）
        ├── RecordView.vue      # 记账页
        ├── TransactionsView.vue# 账单明细（筛选 + 编辑删除 + 清空当月）
        └── SettingsView.vue    # 分类与预算设置
```

## 你需要做的事（部署步骤）

### 1. 安装依赖并在本地运行

```bash
npm install
npm run dev        # 本地开发，访问 http://localhost:5173
npm run build      # 生产构建，产物在 dist/
```

> 未配置 Supabase 时应用以**纯游客模式**运行，全部功能可用、数据存本机，可先体验。

### 2. 创建 Supabase 项目并初始化数据库（约 10 分钟）

1. 打开 [supabase.com](https://supabase.com) → New project（区域选 Asia/Singapore 附近，设置数据库密码）
2. 创建完成后进入 **SQL Editor**，把 `supabase/schema.sql` 全部内容粘贴执行
3. 执行后会自动完成：建表（categories / bills / budgets）、开启 RLS、写入 6 条访问策略、注册用户自动写入预设分类的触发器

### 3. 配置环境变量

1. 将 `.env.example` 复制为 `.env`
2. 在 Supabase 控制台 **Project Settings → API** 中复制：
   - `Project URL` → 填入 `VITE_SUPABASE_URL`
   - `anon public key` → 填入 `VITE_SUPABASE_ANON_KEY`
3. 重启 `npm run dev`，注册一个新账号即可云端记账（数据按 RLS 隔离，他人不可见）

### 4. 部署到 Vercel（一键自动部署）

1. 在 GitHub 新建仓库，推送本项目（`.env` 已被 .gitignore 忽略，不会泄露密钥）
2. 打开 [vercel.com](https://vercel.com) → New Project → Import 你的 GitHub 仓库
3. 框架自动识别为 Vite；在 **Environment Variables** 中同样填入 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
4. Deploy 完成即获得线上地址，SPA 路由回退已由 `vercel.json` 处理

## 权限与数据安全说明（论文可引用）

- 三张表均开启 **RLS**，每条数据绑定 `user_id`，策略限定 `auth.uid() = user_id`，前端使用 anon key 也无法越权读取他人数据
- 金额在数据库层二次校验：`check (amount > 0)`
- 前端仅用 anon key（公开安全模式），密钥不硬编码、经 `.env` 注入

## 常见问题

- **注册后没有预设分类？** 注册触发器一般已自动写入；若异常，登录后首次进入任意页面会自动补齐（代码内有兜底逻辑）
- **游客数据会丢失吗？** 只存于当前浏览器；换设备 / 清缓存会丢失，建议注册账号云端记账
- **控制台警告？** 项目已按“无警告”标准编写，如遇浏览器插件等外部告警与本项目无关
