import { db } from '../db';
import { Product } from '../models/product';

export const ProductService = {
  createProduct: async (productData: Partial<Product>) => {
    const [result]:any = await db.query(
      `INSERT INTO product (name, description, price, stock, category, imageUrl)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        productData.name,
        productData.description,
        productData.price,
        productData.stock,
        productData.category,
        productData.imageUrl,
      ]
    );

    return {
      id: result.insertId,
      ...productData,
    };
  },
  getProducts : async () => {
    const [rows] = await db.query('SELECT * FROM product');
    return rows;

  },
  getProductById : async (id: string) => {
    const [rows]: any = await db.query('SELECT * FROM product WHERE id = ?', [id]);
    return rows[0]; 
  },
  updateProduct: async (id: number, data: Partial<Product>) => {
    const [result]:any = await db.query(
      `UPDATE product SET name = ?, description = ?, price = ?, stock = ?, category = ?, imageUrl = ?
       WHERE id = ?`,
      [
        data.name,
        data.description,
        data.price,
        data.stock,
        data.category,
        data.imageUrl ? JSON.stringify(data.imageUrl) : null,
        id,
      ]
    );

    return result.affectedRows > 0;
  },

  deleteProduct: async (id: number) => {
    const [result]:any = await db.query(`DELETE FROM product WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },
};