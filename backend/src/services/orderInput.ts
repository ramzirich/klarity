// services/orderService.ts
import { db } from '../db';
import { OrderInput } from '../models/orderInput';


export async function createOrder(data: OrderInput) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    /* 1️⃣ Load product prices */
    const [rows] = await conn.query(
      'SELECT id, name, price FROM product WHERE id IN (?)',
      [data.items.map(i => i.productId)]
    ) as any[];
    if (rows.length !== data.items.length) {
      throw new Error('One or more products not found');
    }

    const itemsWithP = data.items.map(it => {
      const p = rows.find((r:any) => r.id === it.productId);
      return { ...it, name: p.name, price: p.price, lineTotal: p.price * it.quantity };
    });
    const subtotal = itemsWithP.reduce((s,i) => s + i.lineTotal, 0);

    /* 2️⃣ Insert order */
    const [orderRes] = await conn.query(
      `INSERT INTO \`order\`
       (customer_email, first_name, last_name, phone_number, subtotal, grand_total)
       VALUES (?,?,?,?,?,?)`,
      [data.customer.email, data.customer.firstName, data.customer.lastName,
       data.customer.phone, subtotal, subtotal]
    ) as any;
    const orderId = orderRes.insertId;

    /* 3️⃣ Addresses */
    const addrVals = data.addresses.map(a => [
      orderId, a.type, a.fullName, a.address, a.city, a.region, a.phone
    ]);
    await conn.query(
      `INSERT INTO order_address
       (order_id, address_type, full_name, address, city, region, phone_number)
       VALUES ?`,
      [addrVals]
    );

    /* 4️⃣ Items */
    const itemVals = itemsWithP.map(i => [
      orderId, i.productId, i.name, i.quantity, i.price, i.lineTotal
    ]);
    await conn.query(
      `INSERT INTO order_item
       (order_id, product_id, product_name, quantity, unit_price, line_total)
       VALUES ?`,
      [itemVals]
    );

    /* 5️⃣ Payment */
    await conn.query(
      `INSERT INTO order_payment
       (order_id, payment_provider, payment_id, status, amount)
       VALUES (?,?,?,?,?)`,
      [orderId, data.payment.provider, data.payment.paymentId, 'authorized', data.payment.amount]
    );

    await conn.commit();
    return { orderId, subtotal };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
