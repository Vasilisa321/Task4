import { createStore } from 'vuex';
import { loginRequest, registerRequest, getProducts, getCart, addToCart, removeFromCart, createOrder, getOrders } from '@/utils/api';

export default createStore({
    state: {
        token: localStorage.getItem('myAppToken') || '',
        user: null,
        products: [],
        cart: [],
        orders: [],
        loading: false,
        error: null
    },

    getters: {
        isAuthenticated: (state) => !!state.token,
        isGuest: (state) => !state.token,
        products: (state) => state.products,
        cart: (state) => state.cart,
        orders: (state) => state.orders,
        loading: (state) => state.loading,
        error: (state) => state.error
    },

    mutations: {
        SET_TOKEN: (state, token) => {
            state.token = token;
            localStorage.setItem('myAppToken', token);
        },
        CLEAR_TOKEN: (state) => {
            state.token = '';
            localStorage.removeItem('myAppToken');
        },
        SET_USER: (state, user) => {
            state.user = user;
        },
        SET_PRODUCTS: (state, products) => {
            state.products = products;
        },
        SET_CART: (state, cart) => {
            state.cart = cart;
        },
        SET_ORDERS: (state, orders) => {
            state.orders = orders;
        },
        SET_LOADING: (state, loading) => {
            state.loading = loading;
        },
        SET_ERROR: (state, error) => {
            state.error = error;
        }
    },
    actions: {
        async login({ commit }, credentials) {
            commit('SET_LOADING', true);
            try {
                const response = await loginRequest(credentials);
                commit('SET_TOKEN', response.data.token);
                commit('SET_USER', response.data.user);
                commit('SET_ERROR', null);
                return response;
            } catch (error) {
                commit('SET_ERROR', error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async register({ commit }, userData) {
            commit('SET_LOADING', true);
            try {
                const response = await registerRequest(userData);
                commit('SET_ERROR', null);
                return response;
            } catch (error) {
                commit('SET_ERROR', error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        logout({ commit }) {
            commit('CLEAR_TOKEN');
            commit('SET_USER', null);
            commit('SET_CART', []);
            commit('SET_ORDERS', []);
        },

        async fetchProducts({ commit }) {
            commit('SET_LOADING', true);
            try {
                const response = await getProducts();
                commit('SET_PRODUCTS', response.data);
                commit('SET_ERROR', null);
            } catch (error) {
                commit('SET_ERROR', error.message);
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async fetchCart({ commit, state }) {
            if (!state.token) return;

            commit('SET_LOADING', true);
            try {
                const response = await getCart();
                commit('SET_CART', response.data);
                commit('SET_ERROR', null);
            } catch (error) {
                commit('SET_ERROR', error.message);
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async addToCart({ commit, dispatch }, productId) {
            commit('SET_LOADING', true);
            try {
                await addToCart(productId);
                await dispatch('fetchCart');
                commit('SET_ERROR', null);
            } catch (error) {
                commit('SET_ERROR', error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async removeFromCart({ commit, dispatch }, productId) {
            commit('SET_LOADING', true);
            try {
                await removeFromCart(productId);
                await dispatch('fetchCart');
                commit('SET_ERROR', null);
            } catch (error) {
                commit('SET_ERROR', error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async checkout({ commit, dispatch }) {
            commit('SET_LOADING', true);
            try {
                const response = await createOrder();
                await dispatch('fetchCart');
                commit('SET_ERROR', null);
                return response;
            } catch (error) {
                commit('SET_ERROR', error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async fetchOrders({ commit, state }) {
            if (!state.token) return;

            commit('SET_LOADING', true);
            try {
                const response = await getOrders();
                commit('SET_ORDERS', response.data);
                commit('SET_ERROR', null);
            } catch (error) {
                commit('SET_ERROR', error.message);
            } finally {
                commit('SET_LOADING', false);
            }
        }
    }
});