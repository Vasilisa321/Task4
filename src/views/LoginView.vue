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

