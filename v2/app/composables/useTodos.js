import { Preferences } from '@capacitor/preferences'

const STORAGE_KEY = 'todos'

export function useTodos() {
  const todos = ref([])
  const input = ref('')

  onMounted(async () => {
    const { value } = await Preferences.get({ key: STORAGE_KEY })
    if (value) todos.value = JSON.parse(value)
  })

  const save = (updated) => {
    todos.value = updated
    Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(updated) })
  }

  const addTodo = () => {
    const text = input.value.trim()
    if (!text) return
    save([...todos.value, { id: Date.now(), text, done: false }])
    input.value = ''
  }

  const toggle = (id) =>
    save(todos.value.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const remove = (id) => save(todos.value.filter((t) => t.id !== id))

  return { todos, input, addTodo, toggle, remove }
}
