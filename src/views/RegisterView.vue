<template>
  <div class="register-container">
    <form class="register-form" @submit.prevent="handleSubmit">
      <h1>Регистрация</h1>

      <div class="form-group">
        <label for="username">Имя пользователя *</label>
        <input
            id="username"
            type="text"
            v-model="form.username"
            @blur="validateField('username')"
            @input="validateField('username')"
            :class="{ 'error': errors.username }"
            placeholder="Введите имя пользователя"
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
        <label for="email">Email *</label>
        <input
            id="email"
            type="email"
            v-model="form.email"
            @blur="validateField('email')"
            @input="validateField('email')"
            :class="{ 'error': errors.email }"
            placeholder="Введите email"
            :disabled="loading"
            required
        />
        <transition name="fade">
                    <span v-if="errors.email" class="error-text">
                        {{ errors.email }}
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

      <div class="form-group">
        <label for="confirmPassword">Подтверждение пароля *</label>
        <div class="password-input-wrapper">
          <input
              id="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="form.confirmPassword"
              @blur="validateField('confirmPassword')"
              @input="validateField('confirmPassword')"
              :class="{ 'error': errors.confirmPassword }"
              placeholder="Подтвердите пароль"
              :disabled="loading"
              required
          />
          <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
              :disabled="loading"
          >
            {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
        <transition name="fade">
                    <span v-if="errors.confirmPassword" class="error-text">
                        {{ errors.confirmPassword }}
                    </span>
        </transition>
      </div>

      <div v-if="form.password" class="password-strength">
        <div class="strength-bars">
          <div
              class="strength-bar"
              :class="getStrengthClass(1)"
          ></div>
          <div
              class="strength-bar"
              :class="getStrengthClass(2)"
          ></div>
          <div
              class="strength-bar"
              :class="getStrengthClass(3)"
          ></div>
        </div>
        <span class="strength-text">{{ passwordStrengthText }}</span>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input
              type="checkbox"
              v-model="form.agreeTerms"
              @change="validateField('agreeTerms')"
              :disabled="loading"
          />
          <span>Я принимаю условия использования и политику конфиденциальности *</span>
        </label>
        <transition name="fade">
                    <span v-if="errors.agreeTerms" class="error-text">
                        {{ errors.agreeTerms }}
                    </span>
        </transition>
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
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </div>

      <p class="login-link">
        Уже есть аккаунт?
        <router-link to="/login">Войдите</router-link>
      </p>
    </form>

    <transition name="slide">
      <div v-if="serverError" class="server-error">
        <span>{{ serverError }}</span>
        <button @click="serverError = ''" class="close-btn">×</button>
      </div>
    </transition>

    <transition name="slide">
      <div v-if="successMessage" class="success-message">
        <span>{{ successMessage }}</span>
        <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'RegisterView',
  setup() {
    const store = useStore()
    const router = useRouter()

    const form = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    })

    const errors = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: ''
    })

    const showPassword = ref(false)
    const showConfirmPassword = ref(false)
    const loading = ref(false)
    const serverError = ref('')
    const successMessage = ref('')
    const progressWidth = ref(0)

    const touched = reactive({
      username: false,
      email: false,
      password: false,
      confirmPassword: false,
      agreeTerms: false
    })

    let progressInterval = null
    let successTimeout = null

    const validateField = (field) => {
      touched[field] = true

      switch(field) {
        case 'username':
          if (!form.username) {
            errors.username = 'Имя пользователя обязательно'
          } else if (form.username.length < 3) {
            errors.username = 'Имя пользователя должно содержать минимум 3 символа'
          } else if (form.username.length > 20) {
            errors.username = 'Имя пользователя должно содержать максимум 20 символов'
          } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
            errors.username = 'Имя пользователя может содержать только буквы, цифры и _'
          } else {
            errors.username = ''
          }
          break

        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!form.email) {
            errors.email = 'Email обязателен'
          } else if (!emailRegex.test(form.email)) {
            errors.email = 'Введите корректный email'
          } else {
            errors.email = ''
          }
          break

        case 'password':
          if (!form.password) {
            errors.password = 'Пароль обязателен'
          } else if (form.password.length < 6) {
            errors.password = 'Пароль должен содержать минимум 6 символов'
          } else if (form.password.length > 30) {
            errors.password = 'Пароль должен содержать максимум 30 символов'
          } else if (!/[A-Z]/.test(form.password)) {
            errors.password = 'Пароль должен содержать хотя бы одну заглавную букву'
          } else if (!/[a-z]/.test(form.password)) {
            errors.password = 'Пароль должен содержать хотя бы одну строчную букву'
          } else if (!/[0-9]/.test(form.password)) {
            errors.password = 'Пароль должен содержать хотя бы одну цифру'
          } else {
            errors.password = ''
          }
          if (touched.confirmPassword) {
            validateField('confirmPassword')
          }
          break

        case 'confirmPassword':
          if (!form.confirmPassword) {
            errors.confirmPassword = 'Подтверждение пароля обязательно'
          } else if (form.confirmPassword !== form.password) {
            errors.confirmPassword = 'Пароли не совпадают'
          } else {
            errors.confirmPassword = ''
          }
          break

        case 'agreeTerms':
          if (!form.agreeTerms) {
            errors.agreeTerms = 'Необходимо принять условия использования'
          } else {
            errors.agreeTerms = ''
          }
          break
      }
    }

    const passwordStrength = computed(() => {
      if (!form.password) return 0

      let strength = 0
      if (form.password.length >= 8) strength++
      if (/[A-Z]/.test(form.password)) strength++
      if (/[a-z]/.test(form.password)) strength++
      if (/[0-9]/.test(form.password)) strength++
      if (/[^A-Za-z0-9]/.test(form.password)) strength++

      return Math.min(strength, 3)
    })

    const getStrengthClass = (level) => {
      if (passwordStrength.value >= level) {
        if (passwordStrength.value === 1) return 'weak'
        if (passwordStrength.value === 2) return 'medium'
        if (passwordStrength.value >= 3) return 'strong'
      }
      return ''
    }

    const passwordStrengthText = computed(() => {
      if (!form.password) return ''
      if (passwordStrength.value === 1) return 'Слабый'
      if (passwordStrength.value === 2) return 'Средний'
      if (passwordStrength.value >= 3) return 'Сильный'
      return ''
    })

    const isFormValid = computed(() => {
      return !errors.username &&
          !errors.email &&
          !errors.password &&
          !errors.confirmPassword &&
          !errors.agreeTerms &&
          form.username &&
          form.email &&
          form.password &&
          form.confirmPassword &&
          form.agreeTerms
    })

    const handleSubmit = async () => {

      Object.keys(form).forEach(field => validateField(field))

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
        const userData = {
          username: form.username,
          email: form.email,
          password: form.password
        }

        const response = await store.dispatch('register', userData)

        successMessage.value = 'Регистрация прошла успешно! Перенаправление на вход...'

        progressWidth.value = 0
        progressInterval = setInterval(() => {
          progressWidth.value += 2
          if (progressWidth.value >= 100) {
            clearInterval(progressInterval)
          }
        }, 30)

        successTimeout = setTimeout(() => {
          router.push('/login')
        }, 2000)

      } catch (error) {
        console.error('Register error:', error)

        if (error.message.includes('409')) {
          serverError.value = 'Пользователь с таким именем или email уже существует'
        } else if (error.message.includes('400')) {
          serverError.value = 'Некорректные данные для регистрации'
        } else {
          serverError.value = error.message || 'Ошибка при регистрации'
        }

        setTimeout(() => {
          serverError.value = ''
        }, 5000)
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      router.push('/')
    }

    onUnmounted(() => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      if (successTimeout) {
        clearTimeout(successTimeout)
      }
    })

    watch(() => form.username, () => {
      if (touched.username) validateField('username')
    })

    watch(() => form.email, () => {
      if (touched.email) validateField('email')
    })

    watch(() => form.password, () => {
      if (touched.password) validateField('password')
    })

    watch(() => form.confirmPassword, () => {
      if (touched.confirmPassword) validateField('confirmPassword')
    })

    return {
      form,
      errors,
      loading,
      serverError,
      successMessage,
      progressWidth,
      showPassword,
      showConfirmPassword,
      passwordStrength,
      passwordStrengthText,
      isFormValid,
      validateField,
      handleSubmit,
      goBack,
      getStrengthClass
    }
  }
}
</script>

<style scoped>
.register-container {
  max-width: 450px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  animation: fadeIn 0.5s ease;
  position: relative;
}

.register-form h1 {
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

.password-strength {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.strength-bars {
  display: flex;
  gap: 5px;
  margin-bottom: 0.3rem;
}

.strength-bar {
  height: 4px;
  flex: 1;
  background-color: #e0e0e0;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.strength-bar.weak {
  background-color: #ff4444;
}

.strength-bar.medium {
  background-color: #ffbb33;
}

.strength-bar.strong {
  background-color: #00C851;
}

.strength-text {
  font-size: 0.85rem;
  color: #666;
}

.checkbox-group {
  margin-top: 1rem;
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
  margin-right: 0.5rem;
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

.login-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
  font-size: 0.95rem;
}

.login-link a {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.login-link a:hover {
  color: #34495e;
  text-decoration: underline;
}

.server-error, .success-message {
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
}

.server-error {
  background: linear-gradient(135deg, #ff4444, #ff6b6b);
}

.success-message {
  background: linear-gradient(135deg, #00C851, #00e676);
  position: relative;
  overflow: hidden;
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

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255,255,255,0.5);
  transition: width 0.1s linear;
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
  .register-container {
    margin: 1rem;
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary, .btn-secondary {
    width: 100%;
  }

  .server-error, .success-message {
    left: 20px;
    right: 20px;
    min-width: auto;
  }
}
</style>