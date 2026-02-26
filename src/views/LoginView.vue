<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="handleSubmit">
      <h1>Sign in</h1>

      <div class="form-group">
        <label>Email</label>
        <input
            type="email"
            v-model="form.email"
            placeholder="admin@admin.ru"
            required
        />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input
            type="password"
            v-model="form.password"
            placeholder="admin"
            required
        />
      </div>

      <hr />

      <div class="form-actions">
        <button type="button" @click="goBack">Back</button>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Loading...' : 'Login' }}
        </button>
      </div>

      <p class="register-link">
        No account? <router-link to="/register">Register</router-link>
      </p>
    </form>

    <div v-if="serverError" class="error-message">
      <p>{{ serverError }}</p>
      <button @click="serverError = ''">×</button>
    </div>

    <!-- Сообщение об успехе -->
    <div v-if="successMessage" class="success-message">
      <p>{{ successMessage }}</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'LoginView',
  setup() {
    const store = useStore()
    const router = useRouter()

    const form = reactive({
      email: 'admin@admin.ru',
      password: 'admin'
    })

    const loading = ref(false)
    const serverError = ref('')
    const successMessage = ref('')

    const handleSubmit = async () => {
      if (!form.email || !form.password) {
        serverError.value = 'Please fill in all fields'
        return
      }

      loading.value = true
      serverError.value = ''
      successMessage.value = ''

      try {
        const credentials = {
          email: form.email,
          password: form.password
        }

        console.log('Attempting login with:', credentials)

        await store.dispatch('AUTH_REQUEST', credentials)

        successMessage.value = 'Login successful! Redirecting...'

        setTimeout(() => {
          router.push('/')
        }, 1000)

      } catch (error) {
        console.error('Login error:', error)

        if (error.status === 401) {
          serverError.value = 'Invalid email or password'
        } else {
          serverError.value = error.message || 'Login failed'
        }
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      router.push('/')
    }

    return {
      form,
      loading,
      serverError,
      successMessage,
      handleSubmit,
      goBack
    }
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.login-form h1 {
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.form-actions button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button[type="submit"] {
  background-color: #2c3e50;
  color: white;
}

.form-actions button[type="submit"]:hover:not(:disabled) {
  background-color: #34495e;
}

.form-actions button[type="button"] {
  background-color: #95a5a6;
  color: white;
}

.form-actions button[type="button"]:hover:not(:disabled) {
  background-color: #7f8c8d;
}

.form-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
}

.register-link a {
  color: #2c3e50;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #ff4444;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #00C851;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.error-message button {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
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
</style>