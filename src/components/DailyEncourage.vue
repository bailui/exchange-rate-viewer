<template>
  <div class="encourage glass anim-pop" @click="next">
    <span class="encourage-emoji">{{ msg.emoji }}</span>
    <div class="encourage-text">
      <p class="encourage-main">{{ msg.text }}</p>
      <p class="encourage-sub">— {{ msg.author }}</p>
    </div>
    <span class="encourage-date">{{ today }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const today = computed(() => {
  const d = new Date()
  return `${d.getMonth()+1}月${d.getDate()}日`
})

const messages = [
  { emoji:'🌸', text:'每一天都是新的开始，今天的你比昨天更棒', author:'鹿乐汇' },
  { emoji:'🌷', text:'你笑起来真好看，像春天里最温柔的风', author:'鹿乐汇' },
  { emoji:'💖', text:'记得按时吃饭、好好休息，有人在偷偷关心你', author:'鹿乐汇' },
  { emoji:'✨', text:'不管前方有多少困难，你都能一一化解', author:'鹿乐汇' },
  { emoji:'🦋', text:'做自己喜欢的事，成为自己想成为的人', author:'鹿乐汇' },
  { emoji:'🌻', text:'你值得所有美好，因为你就是美好本身', author:'鹿乐汇' },
  { emoji:'🍀', text:'好运总是偏爱努力又善良的人，比如你', author:'鹿乐汇' },
  { emoji:'🎀', text:'今天也要元气满满哦，乐乐小仙女', author:'鹿乐汇' },
  { emoji:'💫', text:'生活就像汇率，起起落落，但最终会越来越好', author:'鹿乐汇' },
  { emoji:'🌈', text:'雨过天晴后，总会有彩虹在等你', author:'鹿乐汇' },
  { emoji:'🦌', text:'小鹿乱撞的不只是心跳，还有对你的喜欢', author:'鹿乐汇' },
  { emoji:'🌟', text:'做颗星星，有棱有角，还会发光', author:'鹿乐汇' },
  { emoji:'💗', text:'温柔是宝藏，你也是', author:'鹿乐汇' },
  { emoji:'🌺', text:'只要心中有光，走到哪里都是晴天', author:'鹿乐汇' },
  { emoji:'🐣', text:'慢慢来，谁不是翻山越岭去爱', author:'鹿乐汇' },
  { emoji:'🧸', text:'今天也要做一只快乐的小熊软糖', author:'鹿乐汇' },
  { emoji:'🎵', text:'生活给你柠檬，就榨成柠檬汁，加点糖', author:'鹿乐汇' },
  { emoji:'💐', text:'送你一束花，愿你今天好心情', author:'鹿乐汇' },
  { emoji:'🍰', text:'辛苦啦，奖励自己一块小蛋糕吧', author:'鹿乐汇' },
  { emoji:'🫧', text:'把烦恼都吹进泡泡里，看它们飘走', author:'鹿乐汇' },
  { emoji:'🐰', text:'蹦蹦跳跳，快快乐乐，像小兔子一样', author:'鹿乐汇' },
  { emoji:'🌸', text:'别着急，最好的总在不经意间出现', author:'鹿乐汇' },
  { emoji:'💎', text:'压力是暂时的，但你是钻石，闪闪发光', author:'鹿乐汇' },
  { emoji:'🕊️', text:'让风带走烦恼，留下安宁和平静', author:'鹿乐汇' },
  { emoji:'🌙', text:'晚安前记得微笑，今天你做得很好', author:'鹿乐汇' },
  { emoji:'☀️', text:'早安，新的一天，新的汇率，新的好运气', author:'鹿乐汇' },
  { emoji:'🍬', text:'生活有点苦，来颗糖甜甜嘴', author:'鹿乐汇' },
  { emoji:'🎀', text:'你是最可爱的人，不接受反驳', author:'鹿乐汇' },
  { emoji:'💕', text:'双向奔赴才有意义，但你先爱自己', author:'鹿乐汇' },
  { emoji:'🌿', text:'深呼吸，一切都会好起来的', author:'鹿乐汇' },
  { emoji:'🦢', text:'做一只优雅的白天鹅，从容面对每一天', author:'鹿乐汇' },
]

// 按日期选语录
const dayIndex = new Date().getDate() % messages.length
const msg = ref(messages[dayIndex])

// 点击换一条
function next() {
  const others = messages.filter(m => m.text !== msg.value.text)
  msg.value = others[Math.floor(Math.random() * others.length)]
}
</script>

<style lang="scss" scoped>
.encourage {
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all .25s var(--spring);
  position: relative; z-index: 1;
  box-shadow: var(--shadow-sm);
  user-select: none;

  &:hover { transform: scale(1.02); box-shadow: var(--shadow-md) }
  &:active { transform: scale(.98) }

  .encourage-emoji { font-size: 32px; flex-shrink: 0; animation: heartBeat 3s ease-in-out infinite }
  .encourage-text { flex:1; min-width:0 }
  .encourage-main { font-size: 14px; font-weight: 600; color: var(--text-primary); line-height: 1.6 }
  .encourage-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px }
  .encourage-date { font-size: 11px; color: var(--text-muted); flex-shrink: 0 }
}

@keyframes heartBeat {
  0%,100% { transform: scale(1) }
  30% { transform: scale(1.15) }
}
</style>
