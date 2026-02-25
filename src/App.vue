<template>
  <div id="app">
    <nav>
      <div class="nav-container">
        <router-link to="/" class="logo">My Shop</router-link>
        <div class="nav-links">
          <router-link to="/">Каталог</router-link>
          <router-link to="/cart" v-if="isAuthenticated">Корзина ({{ cartCount }})</router-link>
          <router-link to="/orders" v-if="isAuthenticated">Мои заказы</router-link>
          <router-link to="/login" v-if="!isAuthenticated">Вход</router-link>
          <router-link to="/register" v-if="!isAuthenticated">Регистрация</router-link>
          <a href="#" @click.prevent="logout" v-if="isAuthenticated">Выйти</a>
        </div>
      </div>
    </nav>

    <main>
      <router-view />
    </main>

    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="clearError">×</button>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const store = useStore()
    const router = useRouter()

    const isAuthenticated = computed(() => store.getters.isAuthenticated)
    const cartCount = computed(() => store.state.cart.length)
    const loading = computed(() => store.getters.loading)
    const error = computed(() => store.getters.error)

    const logout = () => {
      store.dispatch('logout')
      router.push('/')
    }

    const clearError = () => {
      store.commit('SET_ERROR', null)
    }

    return {
      isAuthenticated,
      cartCount,
      loading,
      error,
      logout,
      clearError
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

nav {
  background-color: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.nav-links a {
  color: white;
  text-decoration: none;
  margin-left: 1.5rem;
  transition: opacity 0.3s;
}

.nav-links a:hover {
  opacity: 0.8;
}

main {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #ff4444;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

.error-message button {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  margin-left: 1rem;
  cursor: pointer;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255,255,255,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2c3e50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>