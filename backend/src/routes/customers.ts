import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT); // All customer routes require authentication

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', authorizeRole(['ADMIN', 'SALES']), createCustomer);
router.put('/:id', authorizeRole(['ADMIN', 'SALES']), updateCustomer);
router.delete('/:id', authorizeRole(['ADMIN', 'SALES']), deleteCustomer);

export default router;
