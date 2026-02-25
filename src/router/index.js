import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

const isAuthenticated = () => {
    return store.getters.isAuthenticated;
};

const isGuest = () => {
    return store.getters.isGuest;
};

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
        beforeEnter: (to, from, next) => {
            if (isAuthenticated()) {
                next('/');
            } else {
                next();
            }
        }
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('@/views/RegisterView.vue'),
        beforeEnter: (to, from, next) => {
            if (isAuthenticated()) {
                next('/');
            } else {
                next();
            }
        }
    },
    {
        path: '/cart',
        name: 'cart',
        component: () => import('@/views/CartView.vue'),
        beforeEnter: (to, from, next) => {
            if (isAuthenticated()) {
                next();
            } else {
                next('/login');
            }
        }
    },
    {
        path: '/orders',
        name: 'orders',
        component: () => import('@/views/OrdersView.vue'),
        beforeEnter: (to, from, next) => {
            if (isAuthenticated()) {
                next();
            } else {
                next('/login');
            }
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;