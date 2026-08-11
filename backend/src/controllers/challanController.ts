import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { MovementType, ChallanStatus } from '@prisma/client';

export const getChallans = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as ChallanStatus } : {};

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          customer: true
        }
      }),
      prisma.challan.count({ where })
    ]);

    res.json({
      data: challans,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching challans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChallanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      }
    });

    if (!challan) {
      res.status(404).json({ error: 'Challan not found' });
      return;
    }

    res.json(challan);
  } catch (error) {
    console.error('Error fetching challan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createChallan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { challan_number, customer_id, items, status = ChallanStatus.DRAFT } = req.body;
    const created_by = (req as any).user?.id || 1;

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Challan must contain at least one item' });
      return;
    }

    const existing = await prisma.challan.findUnique({ where: { challan_number } });
    if (existing) {
      res.status(400).json({ error: 'Challan number already exists' });
      return;
    }

    const productIds = items.map((item: any) => item.product_id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // If we are confirming immediately, check stock first
    if (status === ChallanStatus.CONFIRMED) {
      for (const item of items) {
        const product = productMap.get(item.product_id);
        if (!product) {
          res.status(404).json({ error: `Product ID ${item.product_id} not found` });
          return;
        }
        if (product.current_stock < item.quantity) {
          res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
          return;
        }
      }
    }

    // Use transaction to create challan
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Challan
      const newChallan = await tx.challan.create({
        data: {
          challan_number,
          customer_id,
          created_by,
          status: status as ChallanStatus,
          items: {
            create: items.map((item: any) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              product_snapshot_data: productMap.get(item.product_id) as any
            }))
          }
        },
        include: {
          items: true
        }
      });

      // 2. If CONFIRMED, decrement stock and add logs
      if (status === ChallanStatus.CONFIRMED) {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.product_id },
            data: { current_stock: { decrement: item.quantity } }
          });

          await tx.stockMovementLog.create({
            data: {
              product_id: item.product_id,
              qty_changed: item.quantity,
              type: MovementType.OUT,
              reason: `Challan #${challan_number}`,
              created_by
            }
          });
        }
      }

      return newChallan;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating challan:', error);
    res.status(500).json({ error: 'Failed to create challan' });
  }
};

export const updateChallanStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;
    const created_by = (req as any).user?.id || 1;

    const existingChallan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingChallan) {
      res.status(404).json({ error: 'Challan not found' });
      return;
    }

    // If moving from DRAFT to CONFIRMED, we must check stock and deduct it
    if (existingChallan.status === ChallanStatus.DRAFT && status === ChallanStatus.CONFIRMED) {
      const productIds = existingChallan.items.map(item => item.product_id);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      for (const item of existingChallan.items) {
        const product = productMap.get(item.product_id);
        if (!product) {
          res.status(404).json({ error: `Product ID ${item.product_id} not found` });
          return;
        }
        if (product.current_stock < item.quantity) {
          res.status(400).json({ error: `Insufficient stock for product ${product.name} (Need ${item.quantity}, have ${product.current_stock})` });
          return;
        }
      }

      // Execute stock deduction transaction
      const updatedChallan = await prisma.$transaction(async (tx) => {
        const challan = await tx.challan.update({
          where: { id },
          data: { status }
        });

        for (const item of existingChallan.items) {
          await tx.product.update({
            where: { id: item.product_id },
            data: { current_stock: { decrement: item.quantity } }
          });

          await tx.stockMovementLog.create({
            data: {
              product_id: item.product_id,
              qty_changed: item.quantity,
              type: MovementType.OUT,
              reason: `Challan #${existingChallan.challan_number} Confirmed`,
              created_by
            }
          });
        }
        return challan;
      });

      res.json(updatedChallan);
      return;
    }

    // Otherwise just update status (e.g. DRAFT to CANCELLED)
    const challan = await prisma.challan.update({
      where: { id },
      data: { status: status as ChallanStatus }
    });

    res.json(challan);
  } catch (error) {
    console.error('Error updating challan:', error);
    res.status(500).json({ error: 'Failed to update challan status' });
  }
};
