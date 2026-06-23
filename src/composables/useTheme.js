import { onMounted, ref, watch } from 'vue'

export function useTheme() {
  const saved = localStorage.getItem('sendfile.dark')
  const darkMode = ref(saved !== null ? saved === '1' : window.matchMedia('(prefers-color-scheme: dark)').matches)

  function applyTheme(value) {
    document.documentElement.setAttribute('data-theme', value ? 'dark' : 'light')
    localStorage.setItem('sendfile.dark', value ? '1' : '0')
  }

  function toggleDark() {
    darkMode.value = !darkMode.value
  }

  watch(darkMode, applyTheme)

  onMounted(() => {
    applyTheme(darkMode.value)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
      if (localStorage.getItem('sendfile.dark') === null) darkMode.value = event.matches
    })
  })

  return { darkMode, toggleDark }
}

