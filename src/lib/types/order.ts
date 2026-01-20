export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  aditions?: { nome: string; preco: number }[];
  canceled?: boolean;
}

export interface Order {
  id: string;
  number: number;
  status: 'novo' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';
  customerName?: string;
  phone?: string;
  total: number;
  items: OrderItem[];
  createdAt: string;
}