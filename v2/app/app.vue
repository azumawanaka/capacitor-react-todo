<template>
  <div class="app">
    <h1>Todo List</h1>

    <form class="add-form" @submit.prevent="addTodo">
      <input v-model="input" placeholder="Add a task..." />
      <button type="submit">Add</button>
    </form>

    <ul class="todo-list">
      <li v-for="todo in todos" :key="todo.id" :class="{ done: todo.done }">
        <span @click="toggle(todo.id)">{{ todo.text }}</span>
        <button @click="remove(todo.id)">✕</button>
      </li>
    </ul>

    <p v-if="todos.length === 0" class="empty">No tasks yet.</p>
  </div>
</template>

<script setup>
import { useTodos } from './composables/useTodos';

const { todos, input, addTodo, toggle, remove } = useTodos();
</script>
