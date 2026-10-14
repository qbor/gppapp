# 快计 · 个人财务记账与数据统计 Web 应用

基于 **Vue3 + Vite + Tailwind CSS + ECharts + Supabase** 的个人财务记账系统，适配毕业设计标准：功能完整、UI 精致、数据隔离安全、可直接部署演示。**完整响应式：电脑端左侧导航布局，手机端自动切换为顶部栏 + 底部标签栏。**

## 功能特性

- **用户系统**：邮箱注册 / 登录 / 退出、登录态持久化、**忘记密码（邮箱链接重置）**、注册后邮箱验证引导；Supabase RLS 按用户隔离数据
- **游客模式**：未登录也能使用全部功能，数据保存在**当前设备本地**（localStorage）；注册登录后支持将游客本地账单合并到云端
- **记账功能**：收入 / 支出切换、金额 / 分类 / 账户 / 标签 / 时间 / 备注 / 凭证图片，表单合法性校验；**快捷记账**（常用模板一键填充 + 一句话解析）
- **分类管理**：11 个预设分类 + 自定义新增 / 重命名 / 删除（预设与带账单的分类受保护不可删，同名分类自动拦截）
- **账户管理**：现金 / 微信 / 支付宝 / 银行卡等钱包账户，记账选择支出账户、**余额自动联动**，资产总览
- **标签体系**：一笔账单最多 5 个标签（如 #外卖 #通勤），支持按标签筛选
- **账单管理**：多维筛选（月份 / 起止日期 / 收支类型 / 分类 / 标签 / 关键词搜索）、时间倒序、按日分组、编辑删除（软删除，可恢复）、清空当月
- **时间维度切换**：按日 / 周 / 月 / 季 / 年查看收支、跨月份对比、自定义起止时间查询
- **数据可视化**：收支趋势折线图、分类占比饼图、消费排行榜、年度汇总看板、预算进度条（80% 预警、超支标红）
- **预算管理**：月度总预算 + 分类预算（设置入口在设置页，实时进度监控）
- **导入导出**：账单导出 CSV / Excel、导入 CSV / Excel（中文表头自动匹配）；JSON 备份 / 恢复（游客可用）
- **重复账单**：房租、话费等周期账单按日 / 周 / 月自动生成
- **债务模块**：应收 / 应付记录，状态跟踪（进行中 / 已结清）
- **体验优化**：暗色 / 亮色主题切换、货币符号切换、昵称头像、移动端响应式、错误提示友好化（不暴露系统内部错误）

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3（Composition API + `<script setup>`）、Vue Router 4、Tailwind CSS 3、ECharts 5、SheetJS（xlsx） |
| 后端 | Supabase（PostgreSQL 数据库、用户认证、自动 REST API、RLS 行级安全） |
| 构建 | Vite 5 |
| 部署 | 适配 GitHub 版本管理 + Vercel 一键部署（含安全响应头配置） |

## 目录结构

```
finance-app/
├── index.html
├── vite.config.js          # Vite 配置（@ 别名、构建）
├── tailwind.config.js      # Tailwind 主题（品牌色、阴影、动画）
├── vercel.json             # SPA 路由回退 + 安全响应头（CSP / X-Frame-Options 等）
├── .env.example            # 环境变量模板（复制为 .env）
├── supabase/
│   └── schema.sql          # 建表 + RLS 策略 + 注册触发器（一键执行）
└── src/
    ├── main.js             # 应用入口（启动时恢复登录态）
    ├── App.vue             # 布局壳（独立页 / 响应式布局：桌面侧栏 + 移动顶栏底栏）
    ├── router/index.js     # 路由配置
    ├── lib/
    │   ├── supabase.js     # Supabase 客户端（读取 .env，未配置自动降级游客模式）
    │   ├── storage.js      # 游客模式 localStorage 数据层
    │   ├── csv.js          # CSV 导出 / 解析 / 文件读写
    │   ├── excel.js        # Excel（.xlsx/.xls）导出 / 解析（SheetJS）
    │   └── utils.js        # 常量与工具函数（金额校验、格式化等）
    ├── composables/
    │   ├── useAuth.js      # 认证状态（登录 / 注册 / 登出 / 忘记密码 / 会话监听）
    │   ├── useFinance.js   # 数据层（双模式：Supabase / localStorage）
    │   ├── useStats.js     # 统计数据（总览 / 趋势 / 排行 / 年度）
    │   ├── useSettings.js  # 设置（主题 / 货币 / 昵称头像）
    │   ├── useMerge.js     # 游客 → 登录数据合并
    │   └── useToast.js     # 全局轻提示 + 错误信息友好化
    ├── components/
    │   ├── AppSidebar.vue  # 桌面左侧固定导航（<lg 隐藏）
    │   ├── AppHeader.vue   # 移动端顶部栏（<lg 显示）
    │   ├── AppTabbar.vue   # 移动端底部标签栏（<lg 显示）
    │   ├── StatCard.vue    # 统计卡片
    │   ├── EChart.vue      # ECharts 封装（按需引入 + 自适应）
    │   ├── AppModal.vue    # 通用弹窗
    │   ├── EmptyState.vue  # 空数据占位
    │   └── ToastContainer.vue
    └── views/
        ├── LoginView.vue       # 登录 / 注册 / 忘记密码（独立页）
        ├── HomeView.vue        # 首页数据总览（卡片 + 图表 + 排行 + 年度看板）
        ├── RecordView.vue      # 记账页（含快捷记账）
        ├── TransactionsView.vue# 账单明细（筛选 + 编辑删除 + CSV/Excel 导入导出 + 回收站）
        └── SettingsView.vue    # 设置（资料 / 账户 / 分类与预算 / 周期记账 / 备份恢复 / 重置）
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
3. 执行后会自动完成：建表（categories / bills / budgets / category_budgets / accounts / recurring_bills / debts / profiles）、开启 RLS、写入访问策略、注册用户自动写入预设分类与默认账户的触发器

### 3. 配置环境变量

1. 将 `.env.example` 复制为 `.env`
2. 在 Supabase 控制台 **Project Settings → API** 中复制：
   - `Project URL` → 填入 `VITE_SUPABASE_URL`
   - `anon public key` → 填入 `VITE_SUPABASE_ANON_KEY`
3. 重启 `npm run dev`，注册一个新账号即可云端记账（数据按 RLS 隔离，他人不可见）

> 忘记密码功能依赖 Supabase 邮件服务（Authentication → Email Templates，SMTP 默认可用）。

### 4. 部署到 Vercel（一键自动部署）

1. 在 GitHub 新建仓库，推送本项目（`.env` 已被 .gitignore 忽略，不会泄露密钥）
2. 打开 [vercel.com](https://vercel.com) → New Project → Import 你的 GitHub 仓库
3. 框架自动识别为 Vite；在 **Environment Variables** 中同样填入 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
4. Deploy 完成即获得线上地址；SPA 路由回退与安全响应头已由 `vercel.json` 配置

## 权限与数据安全说明（论文可引用）

- 各表均开启 **RLS**，每条数据绑定 `user_id`，策略限定 `auth.uid() = user_id`，前端使用 anon key 也无法越权读取他人数据
- 金额在数据库层二次校验：`check (amount > 0)`
- 前端仅用 anon key（公开安全模式），密钥不硬编码、经 `.env` 注入
- **安全响应头**（`vercel.json`）：Content-Security-Policy（含 `frame-ancestors 'none'` 防点击劫持）、X-Frame-Options、X-Content-Type-Options、Referrer-Policy、CORS 白名单限定站点自身域名，通过渗透扫描（ZAP）验证
- **错误信息友好化**：系统内部错误不向用户展示，统一替换为通用中文提示

## 移动端适配说明

- 断点：`lg`（1024px）。≥1024px 显示左侧导航栏；<1024px 自动切换为顶部栏（Logo + 登录入口）+ 底部标签栏（总览 / 记一笔 / 账单明细 / 设置）
- 账单与分类的操作按钮在手机端**常显**（触屏没有 hover），桌面端保持 hover 显示
- 布局断点变化时 ECharts 图表通过 `ResizeObserver` 自动重绘，不会出现拉伸或空白

## 常见问题

- **注册后没有预设分类？** 注册触发器一般已自动写入；若异常，登录后首次进入任意页面会自动补齐（代码内有兜底逻辑）
- **游客数据会丢失吗？** 只存于当前浏览器；换设备 / 清缓存会丢失，建议注册账号云端记账
- **重置全部数据报 400？** 已修复：登录用户重置会带 `user_id` 过滤条件删除云端数据，RLS 保证只清本人数据
- **导入 CSV / Excel 格式？** 表头需包含：日期 / 类型（含"收"即收入）/ 分类 / 金额 / 账户 / 标签 / 备注；可直接用「导出」的文件改完再导入
- **控制台警告？** 项目已按“无警告”标准编写，如遇浏览器插件等外部告警与本项目无关

## 版本记录

- **v1.1**：基础记账闭环（双模式数据层、5 视图、11 预设分类、移动端适配）
- **v2.0**：全功能扩展（时间维度、账户、标签、导入导出、预算告警、可视化、快捷记账、重复账单、债务、主题、设置页增强）+ 多轮 Bug 修复与安全加固（详见《扩展功能改造指南.md》第二十一章）
