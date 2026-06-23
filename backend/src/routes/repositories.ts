import { Router, Request, Response } from 'express';
import { RepositoryService } from '../services/RepositoryService';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth';

export function createRepositoryRouter(db: Pool) {
  const router = Router();
  const repositoryService = new RepositoryService(db);

  router.post('/', authMiddleware(db), async (req: Request, res: Response) => {
    try {
      const { orgId, name, githubRepoId, githubUrl, language, description } = req.body;

      if (!orgId || !name) {
        return res.status(400).json({ error: 'orgId and name are required' });
      }

      const repo = await repositoryService.createRepository(
        orgId,
        name,
        githubRepoId,
        githubUrl,
        language,
        description
      );
      res.status(201).json(repo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/:orgId', async (req: Request, res: Response) => {
    try {
      const repos = await repositoryService.listRepositories(req.params.orgId);
      res.json(repos);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.get('/single/:repoId', async (req: Request, res: Response) => {
    try {
      const repo = await repositoryService.getRepository(req.params.repoId);
      if (!repo) {
        return res.status(404).json({ error: 'Repository not found' });
      }
      res.json(repo);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}