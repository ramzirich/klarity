import { db } from '../db';
import { FieldPacket, RowDataPacket } from 'mysql2';
import { Resend } from 'resend';

type CreateOrderParams = {
  customerInfo: {
    customer_email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
  addressInfo: {
    city: string;
    state: string;
    address_description: string;
  };
  paymentInfo: {
    payment_provider: 'delivery' | 'bank' | 'wishmoney';
    payment_id?: string;
    status?: 'authorized' | 'paid' | 'failed' | 'refunded';
  };
  items: {
    product_id: number;
    quantity: number;
  }[];
};

export const OrderService = {
  createOrder : async (
    customerInfo: {
      customer_email: string;
      first_name: string;
      last_name: string;
      phone_number: string;
    },
    addressInfo: {
      city: string;
      state: string;
      address_description: string;
    },
    paymentInfo: {
      payment_provider: 'delivery' | 'bank' | 'wishmoney';
      payment_id?: string;
      status?: 'authorized' | 'paid' | 'failed' | 'refunded';
    },
    items: {
      product_id: number;
      quantity: number;
      name: string;
    }[]
  ) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
  
      // Step 1: Insert order with default totals
      const [orderResult]: any = await conn.execute(
        `INSERT INTO orders (customer_email, first_name, last_name, phone_number) VALUES (?, ?, ?, ?)`,
        [
          customerInfo.customer_email,
          customerInfo.first_name,
          customerInfo.last_name,
          customerInfo.phone_number,
        ]
      );
  
      const orderId = orderResult.insertId;
      let subtotal = 0;
      let totalQuantity = 0;
  
      // Step 2: Insert order items and calculate subtotal
      const productsNameQuantity: Record<number, { name: string; quantity: number }> = {};
      for (const item of items) {
        const [productRows] = await conn.execute<RowDataPacket[]>(
          `SELECT price, stock, name FROM product WHERE id = ?`,
          [item.product_id]
        );
  
        if (productRows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found.`);
        }

        const product = productRows[0];
        if (product.stock < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        }
  
        const unitPrice = parseFloat(productRows[0].price);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        totalQuantity += item.quantity; 
        productsNameQuantity[item.product_id] = {
          name: product.name,
          quantity: item.quantity,
        };
  
        await conn.execute(
          `INSERT INTO order_item (order_id, product_id, quantity, unit_price)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, unitPrice]
        );
      }
  
      let grandTotal = subtotal;
      if (customerInfo.customer_email && customerInfo.customer_email.trim() !== "") {
        grandTotal = subtotal * 0.9;
      }
        
      // Step 3: Insert address
      await conn.execute(
        `INSERT INTO order_address (order_id, city, state, address_description)
         VALUES (?, ?, ?, ?)`,
        [orderId, addressInfo.city, addressInfo.state, addressInfo.address_description]
      );
  
      // Step 4: Insert payment
      await conn.execute(
        `INSERT INTO order_payment (order_id, payment_provider, payment_id, status, amount)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          paymentInfo.payment_provider,
          paymentInfo.payment_id || null,
          paymentInfo.status || 'authorized',
          grandTotal,
        ]
      );
  
      // Step 5: Update order totals
      await conn.execute(
        `UPDATE orders SET subtotal = ?, grand_total = ? WHERE id = ?`,
        [grandTotal, grandTotal, orderId]
      );
  
      await conn.commit();
    
  const resend = new Resend(process.env.SENDGRID_API_KEY);
  const itemsHtml = Object.values(productsNameQuantity)
  .map(i => `<li>${i.name} - Quantity: ${i.quantity}</li>`)
  .join("");
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'ramziriche96@gmail.com',
    subject: `New Order #${orderId}`,
    html: `
      <h2>New Order Received</h2>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Customer:</strong> ${customerInfo.first_name} ${customerInfo.last_name}</p>
      <p><strong>Email:</strong> ${customerInfo.customer_email || "N/A"}</p>
      <p><strong>Phone Number:</strong> ${customerInfo.phone_number}</p>
         <p><strong>Items:</strong></p>
    <ul>
      ${itemsHtml}
    </ul>
      <p><strong>Total Quantity:</strong> ${totalQuantity}</p>
      <p><strong>Total:</strong> $${grandTotal.toFixed(2)}</p>
    `
  }).catch((err) => console.error("Failed to send email:", err));
  return { orderId, totalQuantity , grandTotal }
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },
  getAllOrders: async () => {
    const [rows] = await db.query(`
      SELECT 
        o.id AS order_id,
        o.customer_email,
        o.first_name,
        o.last_name,
        o.phone_number,
        o.status,
        o.created_at,
        o.subtotal,
        o.grand_total,
  
        a.city,
        a.state,
        a.address_description,
  
        p.payment_provider,
        p.payment_id,
        p.status AS payment_status,
        p.amount AS payment_amount,
        p.created_at AS payment_created_at
  
      FROM orders o
      LEFT JOIN order_address a ON o.id = a.order_id
      LEFT JOIN order_payment p ON o.id = p.order_id
      ORDER BY o.created_at DESC
    `);
    return rows;
  },
  

  getOrdersByUser: async (userId: number) => {
    const [rows] = await db.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
    return rows;
  },

  getOrderById: async (orderId: number) => {
    const [rows]: any = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    return rows[0];
  },

  getOrderByUser : async (orderId: number, email: string) => {
    const [orders, _]: [RowDataPacket[], FieldPacket[]] = await db.query(
      `SELECT * FROM orders WHERE id = ? AND customer_email = ?`,
      [orderId, email]
    );
    if (!Array.isArray(orders) || orders.length === 0) {
      throw new Error("Order not found or access denied");
    }
  
    const [address, _a]: [RowDataPacket[], FieldPacket[]]  = await db.query(
      `SELECT * FROM order_address WHERE order_id = ?`,
      [orderId]
    );
  
    const [payment, _p]: [RowDataPacket[], FieldPacket[]] = await db.query(
      `SELECT * FROM order_payment WHERE order_id = ?`,
      [orderId]
    );
  
    const [items, _i]: [RowDataPacket[], FieldPacket[]] = await db.query(
      `SELECT * FROM order_item WHERE order_id = ?`,
      [orderId]
    );
  
    return {
      order: orders[0],
      address: address[0],
      payment: payment[0],
      items,
    };
  },

  deleteOrder: async (orderId: number) => {
    await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
  },
};

export const getAllOrders = async () => {
  const [rows]: any = await db.query('SELECT * FROM orderInfo');
  return rows;
};

export const getOrderById = async (id: string) => {
  const [rows]: any = await db.query('SELECT * FROM orderInfo WHERE id = ?', [id]);
  return rows[0];
};