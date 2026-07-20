import { ref, watchEffect } from 'vue'

const isDark = ref(false)

// 从 localStorage 加载
try {
  const saved = localStorage.getItem('theme')
  isDark.value = saved === 'dark'
} catch {}

// 应用到 body
watchEffect(() => {
  document.querySelector('.app-root')?.classList.toggle('dark', isDark.value)
  try { localStorage.setItem('theme', isDark.value ? 'dark' : 'light') } catch {}
})

export function useTheme() {
  function toggle() { isDark.value = !isDark.value }
  return { isDark, toggle }
}
