import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { createReportSchema, reportIdParamSchema, downloadReportSchema } from '../validators/report.validator';

const router = Router();

// Apply authentication to all report routes
router.use(authenticate);

router.post('/', validate(createReportSchema), ReportController.createReport);
router.get('/', ReportController.getReports);
router.get('/:id', validate(reportIdParamSchema), ReportController.getReportById);
router.get('/:id/download', validate(downloadReportSchema), ReportController.downloadReport);
router.delete('/:id', validate(reportIdParamSchema), ReportController.deleteReport);

export default router;
