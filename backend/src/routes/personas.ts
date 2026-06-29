import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();

const DEFAULT_PERSONAS = [
  { name: 'strict', display_name: 'Strict Reviewer', description: 'Extremely critical. Finds every possible issue.', system_prompt: 'You are an extremely strict code reviewer. Be critical of every decision. Find edge cases, potential bugs, and style issues. Do not approve code that has any issues.', tone: 'demanding', icon: '🔍' },
  { name: 'security', display_name: 'Security Auditor', description: 'Focuses exclusively on security vulnerabilities.', system_prompt: 'You are a security-focused code reviewer. Your ONLY concern is security: injection attacks, auth bypass, data exposure, XSS, CSRF, insecure dependencies, hardcoded secrets.', tone: 'cautious', icon: '🛡️' },
  { name: 'performance', display_name: 'Performance Expert', description: 'Optimizes for speed and efficiency.', system_prompt: 'You are a performance-focused reviewer. Focus on: N+1 queries, unnecessary re-renders, memory leaks, bundle size, algorithmic complexity, caching opportunities.', tone: 'optimizing', icon: '⚡' },
  { name: 'friendly', display_name: 'Friendly Mentor', description: 'Encouraging. Points out issues gently.', system_prompt: 'You are a friendly, encouraging code reviewer. Praise good patterns first. Point out issues gently with "consider..." or "you might want to...". Be supportive.', tone: 'supportive', icon: '😊' },
  { name: 'junior', display_name: 'Teaching Reviewer', description: 'Explains everything for learning.', system_prompt: 'You are a teaching-focused code reviewer. Explain every issue in detail. Include learning resources. Help the developer understand WHY something is an issue.', tone: 'educational', icon: '📚' },
];

router.get('/', async (req: Request, res: Response) => {
  try {
    const custom = await prisma.reviewPersona.findMany({ where: { is_custom: true } });
    res.json({ personas: [...DEFAULT_PERSONAS, ...custom] });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post('/', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const { name, display_name, description, system_prompt, tone, icon } = req.body;
    const persona = await prisma.reviewPersona.create({
      data: { name, display_name, description, system_prompt, tone, icon, is_custom: true, user_id: req.userId! }
    });
    res.status(201).json(persona);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    await prisma.reviewPersona.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
