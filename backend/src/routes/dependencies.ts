import { Router, Request, Response } from 'express';
import { DependencyService } from '../services/DependencyService';

const router = Router();

router.get('/repos/:repoId/impact/:filePath', async (req: Request, res: Response) => {
  try {
    const depService = new DependencyService();
    const impact = await depService.getImpact(req.params.filePath, req.params.repoId);
    res.json(impact);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.post('/repos/:repoId/build-graph', async (req: Request, res: Response) => {
  try {
    const { files } = req.body;
    const depService = new DependencyService();
    await depService.buildGraph(req.params.repoId, files);
    res.json({ built: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
