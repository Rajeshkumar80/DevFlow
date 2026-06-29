import { prisma } from '../db/prisma';

export class DependencyService {
  parseImports(content: string, language: string): string[] {
    const imports: string[] = [];
    if (language === 'typescript' || language === 'javascript') {
      const regex = /(?:import\s+.*?from\s+['"](.+?)['"]|require\s*\(\s*['"](.+?)['"]\s*\))/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const path = match[1] || match[2];
        if (path && !path.startsWith('@') && !path.includes('node_modules')) imports.push(path);
      }
    }
    return imports;
  }

  async buildGraph(repoId: string, files: { path: string; content: string }[]) {
    for (const file of files) {
      const ext = file.path.split('.').pop();
      const language = ext === 'ts' || ext === 'tsx' ? 'typescript' : ext === 'py' ? 'python' : 'unknown';
      const imports = this.parseImports(file.content, language);
      const importedBy = files.filter(f => f.path !== file.path && imports.some(imp => f.content.includes(imp))).map(f => f.path);

      await prisma.fileDependency.upsert({
        where: { repo_id_file_path: { repo_id: repoId, file_path: file.path } },
        create: { repo_id: repoId, file_path: file.path, imports: JSON.stringify(imports), imported_by: JSON.stringify(importedBy), language },
        update: { imports: JSON.stringify(imports), imported_by: JSON.stringify(importedBy), language }
      });
    }
  }

  async getImpact(filePath: string, repoId: string) {
    const deps = await prisma.fileDependency.findFirst({ where: { repo_id: repoId, file_path: filePath } });
    if (!deps) return { imports: [], importedBy: [], riskLevel: 'low' };
    const imports = JSON.parse(deps.imports);
    const importedBy = JSON.parse(deps.imported_by);
    const riskLevel = importedBy.length > 5 ? 'high' : importedBy.length > 2 ? 'medium' : 'low';
    return { imports, importedBy, riskLevel };
  }
}
