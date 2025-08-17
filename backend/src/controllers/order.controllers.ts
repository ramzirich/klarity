import { Request, Response } from 'express';
import {  OrderService } from '../services/order.services';
import { JwtPayload } from 'jsonwebtoken';
import { console } from 'inspector';

interface JwtRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'client';
  };
}

// export const postOrder = async (req: Request, res: Response) => {
//   try {
//     const order = await createOrder(req.body);
//     res.status(201).json(order);
//   } catch (error: any) {
//     console.error('Error creating order:', error);
//     res.status(500).json({ error: 'Failed to create order' });
//   }
// };

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerInfo, addressInfo, paymentInfo, items } = req.body;

    if (!customerInfo || !addressInfo || !paymentInfo || !items || items.length === 0) {
      res.status(400).json({ error: 'Missing required order fields' });
    }

    const orderResult = await OrderService.createOrder(
      customerInfo,
      addressInfo,
      paymentInfo,
      items
    );

    res.status(201).json({ message: 'Order created', ...orderResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// export async function postOrder(req: Request, res: Response) {
//   try {
//     const result = await createOrder(req.body);
//     res.status(201).json(result);
//   } catch (err: any) {
//     if (err.message === 'One or more products not found') {
//       res.status(404).json({ error: err.message });
//     }
//     console.error(err);
//     res.status(500).json({ error: 'Transaction failed, rolled back.' });
//   }
// }

export const getAllOrders = async (_req: JwtRequest, res: Response) => {
  try {
    const orders = await OrderService.getAllOrders();
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get user’s own orders
export const getUserOrders = async (req: JwtRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const orders = await OrderService.getOrdersByUser(userId || 0);
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get order by ID (admin or user)
export const getOrderById = async (  req: Request & { user?: JwtPayload }, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const user = req.user!;

    if (!user || !user.email) {
      res.status(401).json({ error: "Unauthorized" });
    }
    const order = await OrderService.getOrderByUser(orderId, user.email);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ User deletes own order
export const deleteOrder = async (req: JwtRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params.id);
    const userEmail = req.user?.email;

    if (!userEmail) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await OrderService.getOrderByUser(orderId, userEmail || '');

    if (!order) {
      res.status(403).json({ error: 'You can only delete your own orders' });
    }

    await OrderService.deleteOrder(orderId);
    res.status(200).json({ message: 'Order deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// export const fetchOrders = async (_req: Request, res: Response) => {
//   try {
//     const orders = await getAllOrders();
//     res.json(orders);
//   } catch (error: any) {
//     console.error('Error fetching orders:', error);
//     res.status(500).json({ error: 'Failed to fetch orders' });
//   }
// };

// export const fetchOrderById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const order = await getOrderById(id);

//     if (!order) {
//       res.status(404).json({ error: 'Order not found' });
//     }

//     res.json(order);
//   } catch (error: any) {
//     console.error('Error fetching order by ID:', error);
//     res.status(500).json({ error: 'Failed to fetch order' });
//   }
// };
