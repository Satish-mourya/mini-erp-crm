import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const filter = req.query.filter as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } }
      ];
    }
    if (category) {
      where.category = category;
    }

    let products, total;

    if (filter === 'low_stock') {
      // In-memory filter for low stock since Prisma doesn't support col-to-col comparison easily
      const allProducts = await prisma.product.findMany({ where, orderBy: { created_at: 'desc' } });
      const lowStockProducts = allProducts.filter(p => p.current_stock <= p.min_stock_alert);
      total = lowStockProducts.length;
      products = lowStockProducts.slice(skip, skip + limit);
    } else {
      [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' }
        }),
        prisma.product.count({ where })
      ]);
    }

    res.json({
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    
    // Check if SKU already exists
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) {
      res.status(400).json({ error: 'SKU already exists' });
      return;
    }

    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const data = req.body;

    if (data.sku) {
      const existing = await prisma.product.findFirst({
        where: { sku: data.sku, id: { not: id } }
      });
      if (existing) {
        res.status(400).json({ error: 'SKU already in use by another product' });
        return;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data
    });
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    
    // Optional: Check if product is used in stock logs or challans before deleting
    
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product. It might be in use.' });
  }
};
