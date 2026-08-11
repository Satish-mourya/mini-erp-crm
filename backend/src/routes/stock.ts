import { Router } from 'express';
import { addStock, removeStock, getStockLogs } from '../controllers/stockController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.post('/add', authorizeRole(['ADMIN', 'WAREHOUSE']), addStock);
router.post('/remove', authorizeRole(['ADMIN', 'WAREHOUSE']), removeStock);
router.get('/logs', getStockLogs);

export default router;
