import { Router } from 'express';
import {
  processLeadSource,
  registerLeadConversion,
  getLeadAnalytics,
  getLeadsByStatus,
  getLeadByCPF,
  updateLeadStatus
} from '../controllers/leadController';

const router = Router();

// Rotas de leads
router.post('/process', processLeadSource);
router.post('/convert', registerLeadConversion);
router.get('/analytics', getLeadAnalytics);
router.get('/', getLeadsByStatus);
router.get('/:cpf', getLeadByCPF);
router.put('/:cpf/status', updateLeadStatus);

export default router;