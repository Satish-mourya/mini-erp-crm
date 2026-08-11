import { Router } from 'express';
import { getChallans, getChallanById, createChallan, updateChallanStatus } from '../controllers/challanController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/', authorizeRole(['ADMIN', 'SALES']), createChallan);
router.put('/:id/status', authorizeRole(['ADMIN', 'SALES']), updateChallanStatus);

export default router;
