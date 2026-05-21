import { useState, useEffect } from 'react'
import { Preferences } from '@capacitor/preferences'
import './App.css'

const STORAGE_KEY = 'todos'

export default function App() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')

  useEffect(() => {
    Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
      if (value) setTodos(JSON.parse(value))
    })
  }, [])

  const save = (updated) => {
    setTodos(updated)
    Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(updated) })
  }

  const addTodo = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    save([...todos, { id: Date.now(), text, done: false }])
    setInput('')
  }

  const toggle = (id) =>
    save(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const remove = (id) => save(todos.filter((t) => t.id !== id))

  return (
    <div className="app">
      <h1>Todo List</h1>
      <form onSubmit={addTodo} className="add-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a task..."
        />
        <button type="submit">Add</button>
      </form>
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.done ? 'done' : ''}>
            <span onClick={() => toggle(todo.id)}>{todo.text}</span>
            <button onClick={() => remove(todo.id)}>✕</button>
          </li>
        ))}
      </ul>
      {todos.length === 0 && <p className="empty">No tasks yet.</p>}
    </div>
  )
}
