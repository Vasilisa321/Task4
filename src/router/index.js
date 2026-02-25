import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

// Функции для проверки авторизации
const isAuthenticated = () => {
    return store.getters.isAuthenticated
}

const isGuest = () => {
    return store.getters.isGuest
}

const routes = [
    {
        path: '/',
        name: 'catalog',
        component: () => import('@/views/CatalogView.vue')
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        beforeEnter: (to, from) => {
            if (isAuthenticated()) {
                return '/'
            }
            return true
        }
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/views/RegisterView.vue'),
        beforeEnter: (to, from) => {
            if (isAuthenticated()) {
                return '/'
            }
            return true
        }
    },
    {
        path: '/cart',
        name: 'cart',
        component: () => import('@/views/CartView.vue'),
        beforeEnter: (to, from) => {
            if (!isAuthenticated()) {
                return '/login'
            }
            return true
        }
    },
    {
        path: '/orders',
        name: 'orders',
        component: () => import('@/views/OrdersView.vue'),
        beforeEnter: (to, from) => {
            if (!isAuthenticated()) {
                return '/login'
            }
            return true
        }
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router