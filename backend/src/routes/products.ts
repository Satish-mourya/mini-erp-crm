import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticateJWT, authorizeRole } from '../middleware/auth';

const router = Router();

// Protect all product routes with JWT
router.use(authenticateJWT);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorizeRole(['ADMIN', 'WAREHOUSE']), createProduct);
router.put('/:id', authorizeRole(['ADMIN', 'WAREHOUSE']), updateProduct);
router.delete('/:id', authorizeRole(['ADMIN', 'WAREHOUSE']), deleteProduct);

export default router;
