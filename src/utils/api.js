const API = process.env.VUE_APP_API_URL || 'http://lifestealer86.ru/api-shop';

const handleResponse = async (response) => {
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (!response.ok) {
        const error = new Error(data.error?.message || 'Ошибка запроса');
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

export const loginRequest = (credentials) => {
    console.log('Login request to:', `${API}/login`);
    console.log('With credentials:', credentials);

    const requestBody = {
        email: credentials.email || credentials.username,
        password: credentials.password
    };

    return fetch(`${API}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(requestBody),
    })
        .then(handleResponse)
        .then((result) => {
            console.log('Login success:', result);

            if (result.data && result.data.user_token) {
                return result.data.user_token;
            } else {
                throw new Error('Токен не найден в ответе сервера');
            }
        });
};

export const registerRequest = (userData) => {
    console.log('Register request to:', `${API}/signup`);
    console.log('With data:', userData);

    const requestBody = {
        fio: userData.fio,
        email: userData.email,
        password: userData.password
    };

    return fetch(`${API}/signup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(requestBody),
    })
        .then(handleResponse)
        .then((result) => {
            console.log('Register success:', result);

            if (result.data && result.data.user_token) {
                return result.data.user_token;
            } else {
                throw new Error('Токен не найден в ответе сервера');
            }
        });
};

export const getProducts = () => {
    return fetch(`${API}/products`)
        .then(handleResponse)
        .then(result => {
            return result.data || [];
        });
};

export const getCart = () => {
    const token = localStorage.getItem('myAppToken');

    return fetch(`${API}/cart`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(handleResponse)
        .then(result => {
            return result.data || [];
        });
};

export const addToCart = (productId) => {
    const token = localStorage.getItem('myAppToken');

    return fetch(`${API}/cart/${productId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(handleResponse)
        .then(result => {
            return result.data || result;
        });
};

export const removeFromCart = (cartItemId) => {
    const token = localStorage.getItem('myAppToken');

    return fetch(`${API}/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(handleResponse)
        .then(result => {
            return result.data || result;
        });
};

export const createOrder = () => {
    const token = localStorage.getItem('myAppToken');

    return fetch(`${API}/order`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(handleResponse)
        .then(result => {
            return result.data || result;
        });
};

export const getOrders = () => {
    const token = localStorage.getItem('myAppToken');

    return fetch(`${API}/orders`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(handleResponse)
        .then(result => {
            return result.data || [];
        });
};

export const logoutRequest = () => {
    const token = localStorage.getItem('myAppToken');

    return fetch(`${API}/logout`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(handleResponse)
        .then(result => {
            return result.data || result;
        });
};