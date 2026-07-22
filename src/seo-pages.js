export const SITE_URL = 'https://rate.bailuioai.com'

export const SEO_PAGES = {
  '/exchange-rate': {
    title: '实时汇率查询与人民币换算 - 白鹿io',
    description: '白鹿io 提供美元、欧元、英镑、澳元、日元等全球货币兑人民币实时参考汇率，支持在线换算、币种搜索与热门汇率查询。',
    keywords: '实时汇率,人民币汇率,美元兑人民币,日元汇率,欧元汇率,今日汇率,汇率查询',
    heading: '实时汇率查询与人民币换算',
    intro: '查询美元、欧元、英镑、澳元、日元等全球货币兑人民币参考汇率，快速完成常用币种换算。',
  },
  '/calculator': {
    title: '汇率换算器_全球货币在线转换 - 白鹿io',
    description: '免费的在线汇率换算器，支持人民币、美元、欧元、英镑、澳元、日元等全球货币互相转换，清楚显示币种名称与参考汇率。',
    keywords: '汇率换算器,货币转换器,人民币换美元,美元换人民币,外币换算,在线汇率计算',
    heading: '全球货币在线汇率换算器',
    intro: '输入金额即可换算人民币、美元、欧元、英镑、澳元、日元等全球货币，结果自动更新。',
  },
  '/trends': {
    title: '汇率走势图_美元日元澳元历史汇率 - 白鹿io',
    description: '查看美元、日元、澳元、欧元、英镑等主要货币兑人民币的7天、30天、90天及一年历史汇率走势与区间变化。',
    keywords: '汇率走势,美元汇率走势,日元汇率走势,澳元汇率走势,历史汇率,人民币汇率趋势',
    heading: '主要货币历史汇率走势图',
    intro: '查看美元、日元、澳元、欧元和英镑兑人民币的历史走势、区间高低点与变化幅度。',
  },
  '/alerts': {
    title: '免费汇率提醒_达到目标自动邮件通知 - 白鹿io',
    description: '设置美元、澳元、日元等货币的目标汇率，白鹿io 云端定时检查，达到条件后自动发送邮件提醒，关闭网页也能收到。',
    keywords: '汇率提醒,美元汇率提醒,澳元汇率提醒,日元汇率提醒,邮件提醒,目标汇率通知',
    heading: '免费汇率邮件提醒',
    intro: '设置目标汇率后由云端定时检查，达到条件时自动发送邮件，关闭网页也不会错过提醒。',
  },
}

export function getSeoPage(pathname) {
  const normalized = pathname === '/' ? '/exchange-rate' : pathname.replace(/\/$/, '')
  return SEO_PAGES[normalized] || SEO_PAGES['/exchange-rate']
}
