import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalCustomers, products, pendingChallans] = await Promise.all([
      prisma.customer.count(),
      prisma.product.findMany({ select: { current_stock: true, min_stock_alert: true } }),
      prisma.challan.count({ where: { status: 'DRAFT' } })
    ]);

    const lowStockItems = products.filter(p => p.current_stock <= p.min_stock_alert).length;

    res.json({
      totalCustomers,
      lowStockItems,
      pendingChallans
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
