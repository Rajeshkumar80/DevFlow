import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'anthropic/claude-3-sonnet': { input: 3.00, output: 15.00 },
  'google/gemini-2.0-flash': { input: 0.10, output: 0.40 },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 1.0, output: 3.0 };
  return Math.round((inputTokens / 1_000_000) * pricing.input * 100 + (outputTokens / 1_000_000) * pricing.output * 100);
}

router.get('/', authMiddleware(null), async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    const days = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await prisma.costEvent.findMany({ where: { created_at: { gte: startDate } }, orderBy: { created_at: 'desc' } });

    const totalCost = events.reduce((sum: number, e: any) => sum + e.cost_cents, 0);
    const totalTokens = events.reduce((sum: number, e: any) => sum + e.input_tokens + e.output_tokens, 0);

    const byModel: Record<string, { cost: number; tokens: number; count: number }> = {};
    for (const e of events) {
      if (!byModel[e.model]) byModel[e.model] = { cost: 0, tokens: 0, count: 0 };
      byModel[e.model].cost += e.cost_cents;
      byModel[e.model].tokens += e.input_tokens + e.output_tokens;
      byModel[e.model].count++;
    }

    const daily: Record<string, number> = {};
    for (const e of events) {
      const day = e.created_at.toISOString().slice(0, 10);
      daily[day] = (daily[day] || 0) + e.cost_cents;
    }

    res.json({ totalCost, totalTokens, totalEvents: events.length, byModel, daily, recentEvents: events.slice(0, 50) });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
