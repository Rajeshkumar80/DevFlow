import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();

router.get('/repos/:repoId/rules', async (req: Request, res: Response) => {
  try {
    const rules = await prisma.reviewRule.findMany({ where: { repo_id: req.params.repoId } });
    res.json({ rules });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post('/repos/:repoId/rules', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const { name, type, pattern, max_value, forbidden, require: reqRequire, severity, message } = req.body;
    const rule = await prisma.reviewRule.create({
      data: { repo_id: req.params.repoId, name, type, pattern, max_value, forbidden, require: reqRequire, severity: severity || 'warning', message }
    });
    res.status(201).json(rule);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.patch('/rules/:ruleId', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const rule = await prisma.reviewRule.update({ where: { id: req.params.ruleId }, data: req.body });
    res.json(rule);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete('/rules/:ruleId', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    await prisma.reviewRule.delete({ where: { id: req.params.ruleId } });
    res.status(204).send();
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
