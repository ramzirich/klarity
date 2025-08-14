export interface OrderInput {
    customer:  { email: string; firstName: string; lastName: string; phone: string };
    addresses: { type: 'billing'|'shipping'; fullName: string; address: string;
                 city: string; region: string; phone: string }[];
    items:     { productId: number; quantity: number }[];
    payment:   { provider: 'delivery'|'bank'|'wishmoney'; paymentId: string; amount: number };
  }

  export interface Order {
    id: number;
    customer_email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    created_at: string; // or Date if using Date objects
    subtotal: number;
    grand_total: number;
  }

  export interface OrderAddress {
    id: number;
    order_id: number;
    city?: string;
    state?: string;
    address_description?: string;
  }

  export interface OrderPayment {
    id: number;
    order_id: number;
    payment_provider: 'delivery' | 'bank' | 'wishmoney';
    payment_id?: string;
    status?: 'authorized' | 'paid' | 'failed' | 'refunded';
    amount?: number;
    created_at: string; // or Date
  }

  export interface OrderItem {
    id: number;
    order_id: number;
    product_id?: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }
  