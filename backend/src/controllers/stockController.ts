import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { MovementType } from '@prisma/client';

export const addStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id, qty, reason } = req.body;
    // Assuming auth middleware sets req.user (e.g. req.user.id)
    const created_by = (req as any).user?.id || 1; 

    if (qty <= 0) {
      res.status(400).json({ error: 'Quantity must be greater than zero' });
      return;
    }

    // Run within a transaction to ensure both stock log and product stock update together
    const [log, product] = await prisma.$transaction([
      prisma.stockMovementLog.create({
        data: {
          product_id,
          qty_changed: qty,
          type: MovementType.IN,
          reason,
          created_by
        }
      }),
      prisma.product.update({
        where: { id: product_id },
        data: { current_stock: { increment: qty } }
      })
    ]);

    res.status(201).json({ log, product });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({ error: 'Failed to add stock' });
  }
};

export const removeStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id, qty, reason } = req.body;
    const created_by = (req as any).user?.id || 1; 

    if (qty <= 0) {
      res.status(400).json({ error: 'Quantity must be greater than zero' });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id: product_id } });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    if (product.current_stock < qty) {
      res.status(400).json({ error: 'Insufficient stock' });
      return;
    }

    const [log, updatedProduct] = await prisma.$transaction([
      prisma.stockMovementLog.create({
        data: {
          product_id,
          qty_changed: qty,
          type: MovementType.OUT,
          reason,
          created_by
        }
      }),
      prisma.product.update({
        where: { id: product_id },
        data: { current_stock: { decrement: qty } }
      })
    ]);

    res.status(201).json({ log, product: updatedProduct });
  } catch (error) {
    console.error('Error removing stock:', error);
    res.status(500).json({ error: 'Failed to remove stock' });
  }
};

export const getStockLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const product_id = parseInt(req.query.product_id as string);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where = product_id ? { product_id } : {};

    const [logs, total] = await Promise.all([
      prisma.stockMovementLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: { product: true }
      }),
      prisma.stockMovementLog.count({ where })
    ]);

    res.json({
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching stock logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
