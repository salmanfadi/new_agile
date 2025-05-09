
import { useState, useEffect } from 'react';
import { CartItem, Product } from '@/types/database';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Load cart from localStorage on initial load
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Failed to parse cart from localStorage', error);
          localStorage.removeItem('cart');
        }
      }
    };
    
    // Load cart when the component mounts
    loadCart();
    
    // Set up event listener for storage events
    const handleStorageChange = () => {
      loadCart();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  // Add a product to the cart
  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      // Check if the item is already in the cart
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // If item exists, increase its quantity
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + 1
        };
        return newItems;
      } else {
        // If item doesn't exist, add it with quantity 1
        return [...prevItems, {
          productId: product.id,
          product,
          quantity: 1
        }];
      }
    });
  };
  
  // Remove a product from the cart
  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.productId !== productId)
    );
  };
  
  // Update the quantity of a product in the cart
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };
  
  // Clear the cart
  const clearCart = () => {
    setCartItems([]);
  };
  
  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };
}
