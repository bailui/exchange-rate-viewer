# 白鹿io · 汇率转换

面向日常使用的汇率查询与换算工具，使用 Vue 3 + Vite 构建，重点呈现美元、澳元、英镑、日元等主要币种兑人民币参考价。

## 功能

- 实时汇率：约 170 种币种、搜索、排序、收藏、快速换算
- 汇率换算：全币种互换、快捷币种、复制与本地历史
- 走势分析：7 / 30 / 90 / 180 / 360 天真实历史数据、悬停读数、全屏图表
- 汇率提醒：邮箱验证、云端定时检查、启停、退订与防重复发送
- 响应式布局：桌面侧边栏、移动抽屉、移动端卡片化列表
- 稳定数据：同源 Vercel API 代理、请求去重、浏览器缓存与失败保底

## 技术栈

- Vue 3 Composition API
- Vue Router 4
- Vite 8
- Tailwind CSS 4
- Axios
- Vercel Functions
- Cloudflare Workers + Cron + D1
- Resend Email API

## 本地开发

```bash
npm install
npm run dev
```

开发服务器会将 `/api/rates` 代理到公开汇率数据源，避免浏览器 CORS 限制。

## 构建

```bash
npm run build
npm run preview
```

## 数据说明

- 实时参考价：`@fawazahmed0/currency-api` 的 jsDelivr CDN 为主数据源，ExchangeRate.fun 为回退源，以 CNY 为基准；页面每 30 秒检查一次更新。
- 历史走势：`@fawazahmed0/currency-api` 的日期版本；长周期采用均匀采样，避免一次请求数百个文件。
- 公开数据仅供参考，实际成交价以银行或支付渠道为准。

## 部署

项目已包含：

- `api/rates.js`：Vercel 同源汇率代理
- `vercel.json`：SPA 路由回退
- `alerts-worker/`：邮件验证、提醒管理和每 5 分钟检查一次的 Cloudflare Worker

推送到 GitHub 后由 Vercel 自动部署，生产域名为 `rate.bailuioai.com`。

### 邮件提醒配置

邮件提醒需要先在 Resend 验证 `bailuioai.com`，然后将 API Key 通过 Wrangler 的隐藏输入保存到 Cloudflare：

```bash
npx wrangler secret put RESEND_API_KEY --config alerts-worker/wrangler.jsonc
npx wrangler deploy --config alerts-worker/wrangler.jsonc
```

`HMAC_SECRET`、`RESEND_API_KEY` 和本地 `.dev.vars` 不得提交到 Git。域名验证完成后还需将 Worker 的 `EMAIL_SERVICE_READY` 切换为 `true`；此前前端会显示“邮件通道待开通”并禁用创建按钮。
