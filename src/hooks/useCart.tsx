
import { useState, useEffect, useCallback } from 'react';
import { Product, CartItem } from '@/types/database';
import { useToast } from './use-toast';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product: Product, quantity: number = 1, requirements?: string) => {
    setCartItems((currentItems) => {
      // Check if product is already in cart
      const existingItemIndex = currentItems.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex > -1) {
        // Update existing item
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          requirements: requirements || updatedItems[existingItemIndex].requirements
        };
        
        toast({
          title: "Cart updated",
          description: `Updated quantity of ${product.name} in your cart`,
        });
        
        return updatedItems;
      } else {
        // Add new item
        toast({
          title: "Added to cart",
          description: `${product.name} has been added to your cart`,
        });
        
        return [...currentItems, {
          productId: product.id,
          product,
          quantity,
          requirements
        }];
      }
    });
  }, [toast]);

  const updateCartItem = useCallback((productId: string, quantity: number, requirements?: string) => {
    setCartItems((currentItems) => {
      return currentItems.map(item => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity: quantity,
            requirements: requirements !== undefined ? requirements : item.requirements
          };
        }
        return item;
      });
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((currentItems) => {
      const filteredItems = currentItems.filter(item => item.productId !== productId);
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
      
      return filteredItems;
    });
  }, [toast]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('cart');
    
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  }, [toast]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  return {
    cartItems,
    cartCount,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
  };
};
