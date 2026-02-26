<template>
  <div class="register-container">
    <form class="register-form" @submit.prevent="handleSubmit">
      <h1>Sign up</h1>

      <div class="form-group">
        <label>Full name</label>
        <input
            type="text"
            v-model="form.fio"
            placeholder="Иванов Иван Иванович"
            required
        />
      </div>

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
          {{ loading ? 'Loading...' : 'Register' }}
        </button>
      </div>

      <p class="login-link">
        Already have an account? <router-link to="/login">Sign in</router-link>
      </p>
    </form>

    <div v-if="serverError" class="error-message">
      <p>{{ serverError }}</p>
      <button @click="serverError = ''">×</button>
    </div>

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
  name: 'RegisterView',
  setup() {
    const store = useStore()
    const router = useRouter()

    const form = reactive({
      fio: '',
      email: '',
      password: ''
    })

    const loading = ref(false)
    const serverError = ref('')
    const successMessage = ref('')

    const handleSubmit = async () => {
      if (!form.fio || !form.email || !form.password) {
        serverError.value = 'Please fill in all fields'
        return
      }

      loading.value = true
      serverError.value = ''
      successMessage.value = ''

      try {
        const userData = {
          fio: form.fio,
          email: form.email,
          password: form.password
        }

        console.log('Attempting registration with:', userData)

        await store.dispatch('REGISTER_REQUEST', userData)

        successMessage.value = 'Registration successful! Redirecting to login...'

        setTimeout(() => {
          router.push('/login')
        }, 2000)

      } catch (error) {
        console.error('Registration error:', error)

        if (error.status === 422) {
          serverError.value = 'Validation error - please check your data'
        } else {
          serverError.value = error.message || 'Registration failed'
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

