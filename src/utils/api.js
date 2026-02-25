const API_URL = process.env.VUE_APP_API_URL || 'http://lifestealer86.ru/api-shop';

export const loginRequest = (credentials) => {
    return fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    }).then(response => {
        if (!response.ok) {
            throw new Error('Ошибка авторизации');
        }
        return response.json();
    });
};

export const registerRequest = (userData) => {
    return fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    }).then(response => {
        if (!response.ok) {
            throw new Error('Ошибка регистрации');
        }
        return response.json();
    });
};

export const getProducts = () => {
    return fetch(`${API_URL}/products`)
        .then(response => response.json());
};


export const getCart = () => {
    const token = localStorage.getItem('myAppToken');
    return fetch(`${API_URL}/cart`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(response => response.json());
};


export const addToCart = (productId) => {
    const token = localStorage.getItem('myAppToken');
    return fetch(`${API_URL}/cart/${productId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(response => response.json());
};


export const removeFromCart = (productId) => {
    const token = localStorage.getItem('myAppToken');
    return fetch(`${API_URL}/cart/${productId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(response => response.json());
};


export const createOrder = () => {
    const token = localStorage.getItem('myAppToken');
    return fetch(`${API_URL}/order`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(response => response.json());
};


export const getOrders = () => {
    const token = localStorage.getItem('myAppToken');
    return fetch(`${API_URL}/orders`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(response => response.json());
};