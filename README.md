# 💱 实时汇率监控

基于 **Vue 3** + **Element Plus** 的实时汇率监控面板，RuoYi 风格管理后台布局。

> 重点关注：美元 (USD)、澳元 (AUD)、英镑 (GBP)、日元 (JPY) 兑人民币 (CNY) 汇率

## 特性

- 🎨 RuoYi Admin 风格侧边栏布局
- 📊 四大货币实时汇率卡片
- 🔄 每 5 分钟自动刷新
- 📈 涨跌幅百分比显示
- 💰 快捷换算参考
- 🌐 免费 API，无需注册

## 技术栈

- **框架**: Vue 3 (Composition API) + Vite
- **UI**: Element Plus
- **路由**: Vue Router 4
- **数据**: ExchangeRate.fun 免费 API（每小时更新）
- **部署**: Vercel / 宝塔 / GitHub Pages

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 部署到 Vercel

1. Push 到 GitHub 仓库
2. 在 Vercel 中导入该仓库
3. Framework 选 Vite，自动识别
4. 部署即可
