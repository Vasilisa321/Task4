import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'

const ifNotAuthenticated = (to, from, next) => {
    if (!store.getters.isAuthenticated) {
        next();
        return;
    }
    next('/');
};

const ifAuthenticated = (to, from, next) => {
    if (store.getters.isAuthenticated) {
        next();
        return;
    }
    next('/login');
};

const routes = [
    {
        path: '/',
        name: 'catalog',
        component: () => import('@/views/CatalogView.vue'),
        beforeEnter: ifAuthenticated,
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),  // Изменено с components на views
        beforeEnter: ifNotAuthenticated,
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/views/RegisterView.vue'),  // Изменено с components на views
        beforeEnter: ifNotAuthenticated,
    },
    {
        path: '/cart',
        name: 'cart',
        component: () => import('@/views/CartView.vue'),
        beforeEnter: ifAuthenticated,
    },
    {
        path: '/orders',
        name: 'orders',
        component: () => import('@/views/OrdersView.vue'),
        beforeEnter: ifAuthenticated,
    }
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
});

export default router;