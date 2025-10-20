import { useState } from 'react';
import { OrderItem } from '@/app/lib/types/order';

export const useCart = () => {
  const [items, setItems] = useState<OrderItem[]>([]);

  const addItem = (item: OrderItem) => {
    setItems(prev => [...prev, item]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.productId !== id));
  };

  const clearCart = () => setItems([]);

  return { items, addItem, removeItem, clearCart };
};
