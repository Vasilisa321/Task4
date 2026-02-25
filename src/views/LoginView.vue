<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="handleSubmit">
      <h1>Вход в систему</h1>

      <div class="form-group">
        <label for="username">Имя пользователя или Email *</label>
        <input
            id="username"
            type="text"
            v-model="form.username"
            @blur="validateField('username')"
            @input="validateField('username')"
            :class="{ 'error': errors.username }"
            placeholder="Введите имя пользователя или email"
            :disabled="loading"
            required
        />
        <transition name="fade">
                    <span v-if="errors.username" class="error-text">
                        {{ errors.username }}
                    </span>
        </transition>
      </div>

      <div class="form-group">
        <label for="password">Пароль *</label>
        <div class="password-input-wrapper">
          <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="form.password"
              @blur="validateField('password')"
              @input="validateField('password')"
              :class="{ 'error': errors.password }"
              placeholder="Введите пароль"
              :disabled="loading"
              required
          />
          <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="loading"
          >
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        <transition name="fade">
                    <span v-if="errors.password" class="error-text">
                        {{ errors.password }}
                    </span>
        </transition>
      </div>

      <div class="form-options">
        <label class="checkbox-label">
          <input
              type="checkbox"
              v-model="form.rememberMe"
              :disabled="loading"
          />
          <span>Запомнить меня</span>
        </label>
      </div>

      <hr/>

      <div class="form-actions">
        <button
            type="button"
            @click="goBack"
            class="btn-secondary"
            :disabled="loading"
        >
          Назад
        </button>
        <button
            type="submit"
            class="btn-primary"
            :disabled="loading || !isFormValid"
        >
          <span v-if="loading" class="spinner-small"></span>
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </div>

      <p class="register-link">
        Нет аккаунта?
        <router-link to="/register">Зарегистрироваться</router-link>
      </p>
    </form>

    <transition name="slide">
      <div v-if="serverError" class="server-error">
        <span>{{ serverError }}</span>
        <button @click="serverError = ''" class="close-btn">×</button>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'LoginView',
  setup() {
    const store = useStore()
    const router = useRouter()

    const form = reactive({
      username: '',
      password: '',
      rememberMe: false
    })

    const errors = reactive({
      username: '',
      password: ''
    })

    const showPassword = ref(false)
    const loading = ref(false)
    const serverError = ref('')

    const touched = reactive({
      username: false,
      password: false
    })

    const validateField = (field) => {
      touched[field] = true

      switch(field) {
        case 'username':
          if (!form.username) {
            errors.username = 'Имя пользователя или email обязательны'
          } else if (form.username.length < 3) {
            errors.username = 'Минимальная длина 3 символа'
          } else if (form.username.length > 50) {
            errors.username = 'Максимальная длина 50 символов'
          } else {
            errors.username = ''
          }
          break

        case 'password':
          if (!form.password) {
            errors.password = 'Пароль обязателен'
          } else if (form.password.length < 6) {
            errors.password = 'Пароль должен содержать минимум 6 символов'
          } else if (form.password.length > 30) {
            errors.password = 'Пароль должен содержать максимум 30 символов'
          } else {
            errors.password = ''
          }
          break
      }
    }

    const isFormValid = computed(() => {
      return !errors.username &&
          !errors.password &&
          form.username &&
          form.password
    })

    const handleSubmit = async () => {
      validateField('username')
      validateField('password')

      if (!isFormValid.value) {
        const firstError = Object.keys(errors).find(key => errors[key])
        if (firstError) {
          document.getElementById(firstError)?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
        return
      }

      loading.value = true
      serverError.value = ''

      try {
        const credentials = {
          username: form.username,
          password: form.password
        }

        if (form.username.includes('@')) {
          credentials.email = form.username
          delete credentials.username
        }

        console.log('Отправка запроса на вход...')
        const response = await store.dispatch('login', credentials)
        console.log('Ответ получен:', response)

        if (form.rememberMe) {
          localStorage.setItem('rememberedUsername', form.username)
        } else {
          localStorage.removeItem('rememberedUsername')
        }

        console.log('Перенаправление на главную...')
        await router.push('/')

      } catch (error) {
        console.error('Login error:', error)

        if (error.message.includes('401')) {
          serverError.value = 'Неверное имя пользователя или пароль'
        } else if (error.message.includes('404')) {
          serverError.value = 'Пользователь не найден'
        } else if (error.message.includes('429')) {
          serverError.value = 'Слишком много попыток входа. Попробуйте позже'
        } else {
          serverError.value = error.message || 'Ошибка при входе в систему'
        }
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      router.push('/')
    }

    onMounted(() => {
      const savedUsername = localStorage.getItem('rememberedUsername')
      if (savedUsername) {
        form.username = savedUsername
        form.rememberMe = true
      }
    })

    watch(() => form.username, () => {
      if (touched.username) validateField('username')
    })

    watch(() => form.password, () => {
      if (touched.password) validateField('password')
    })

    return {
      form,
      errors,
      loading,
      serverError,
      showPassword,
      isFormValid,
      validateField,
      handleSubmit,
      goBack
    }
  }
}
</script>

<style scoped>
.login-container {
  max-width: 450px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  animation: fadeIn 0.5s ease;
  position: relative;
}

.login-form h1 {
  margin-bottom: 2rem;
  text-align: center;
  color: #2c3e50;
  font-size: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.form-group input:focus {
  outline: none;
  border-color: #2c3e50;
  background: white;
  box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
}

.form-group input.error {
  border-color: #ff4444;
  background: #fff8f8;
  animation: shake 0.3s ease;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f0f0f0;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  color: #666;
  transition: all 0.3s;
  border-radius: 4px;
}

.password-toggle:hover:not(:disabled) {
  color: #2c3e50;
  background: rgba(44, 62, 80, 0.1);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-text {
  display: block;
  margin-top: 0.3rem;
  color: #ff4444;
  font-size: 0.85rem;
  animation: slideDown 0.3s ease;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin-right: 0.3rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

hr {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #2c3e50;
  color: white;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover:not(:disabled) {
  background-color: #34495e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(44, 62, 80, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #7f8c8d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(127, 140, 141, 0.3);
}

.btn-secondary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.register-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
  font-size: 0.95rem;
}

.register-link a {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.register-link a:hover {
  color: #34495e;
  text-decoration: underline;
}

.server-error {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 1rem 2rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: slideInRight 0.3s ease;
  z-index: 1000;
  min-width: 300px;
  background: linear-gradient(135deg, #ff4444, #ff6b6b);
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 5px;
  opacity: 0.8;
  transition: all 0.3s;
  border-radius: 4px;
}

.close-btn:hover {
  opacity: 1;
  background: rgba(255,255,255,0.2);
}

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
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
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter, .slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@media (max-width: 500px) {
  .login-container {
    margin: 1rem;
    padding: 1.5rem;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary, .btn-secondary {
    width: 100%;
  }

  .server-error {
    left: 20px;
    right: 20px;
    min-width: auto;
  }
}
</style>