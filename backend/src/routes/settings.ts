import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });

    res.json({
      apiKey: map['openrouter_api_key'] ? '••••••••' + map['openrouter_api_key'].slice(-6) : '',
      model: map['openrouter_model'] || 'google/gemini-2.0-flash-001',
      hasApiKey: !!map['openrouter_api_key'],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { apiKey, model } = req.body;

    if (apiKey !== undefined) {
      if (apiKey && !apiKey.startsWith('sk-or-')) {
        return res.status(400).json({ error: 'Invalid OpenRouter API key format' });
      }
      if (apiKey) {
        const { OpenRouterService } = await import('../services/OpenRouterService');
        await OpenRouterService.setApiKey(apiKey);
      }
    }

    if (model) {
      const { OpenRouterService } = await import('../services/OpenRouterService');
      await OpenRouterService.setModel(model);
    }

    res.json({ message: 'Settings saved' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/models', async (req: Request, res: Response) => {
  res.json([
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', tag: 'New' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', tag: 'Fast' },
    { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', tag: 'Smart' },
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta', tag: 'Open' },
  ]);
});

export default router;
