// Cart utility functions — client-side using localStorage

const CART_KEY = 'gotomrt_cart';

export function getCart() {
    if (typeof window === 'undefined') return [];
    try {
        const cart = localStorage.getItem(CART_KEY);
        return cart ? JSON.parse(cart) : [];
    } catch {
        return [];
    }
}

export function saveCart(cart) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            mrp: product.mrp,
            image_url: product.image_url,
            unit: product.unit,
            quantity: 1,
        });
    }

    saveCart(cart);
    window.dispatchEvent(new Event('cart-updated'));
    return cart;
}

export function removeFromCart(productId) {
    let cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex >= 0) {
        if (cart[existingIndex].quantity > 1) {
            cart[existingIndex].quantity -= 1;
        } else {
            cart.splice(existingIndex, 1);
        }
    }

    saveCart(cart);
    window.dispatchEvent(new Event('cart-updated'));
    return cart;
}

export function clearCart() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event('cart-updated'));
    return [];
}

export function getCartTotal(cart) {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

export function getCartItemCount(cart) {
    return cart.reduce((count, item) => count + item.quantity, 0);
}

export function getItemQuantity(cart, productId) {
    const item = cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
}

// Format price in INR
export function formatPrice(amount) {
    return '₹' + Number(amount).toFixed(0);
}

// Generate order number
export function generateOrderNumber() {
    const now = Date.now().toString(36).toUpperCase();
    return `GTM-${now}`;
}
