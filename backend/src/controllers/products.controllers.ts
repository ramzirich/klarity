import { Request, Response } from 'express';
import { ProductService } from '../services/products.services';

interface JwtRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'admin' | 'client';
  };
}


export const fetchProducts = async (_req: Request, res: Response) => {
  try {
    const products = await ProductService.getProducts();
    res.json(products);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const fetchProductById = async (_req: Request, res: Response) => {
  try {
    const { id } = _req.params;
    const product = await ProductService.getProductById(id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error: any) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const addProduct = async (req: JwtRequest, res: Response) => {
  try {
    const { name, description, price, stock, category, imageUrl } = req.body;

    if (!name || !price) {
      res.status(400).json({ error: 'Name and price are required' });
    }

    const product = await ProductService.createProduct({
      name,
      description,
      price,
      stock,
      category,
      imageUrl,
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

export const updateProduct = async (req: JwtRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await ProductService.updateProduct(Number(id), updateData);

    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully', updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

export const deleteProduct = async (req: JwtRequest, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await ProductService.deleteProduct(Number(id));

    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
};
