import { simpleGit, SimpleGit } from 'simple-git';

export class DiffService {
  async computeDiff(
    repoPath: string,
    baseBranch: string,
    targetBranch: string
  ): Promise<string> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const diffOutput = await git.diff([baseBranch, targetBranch]);
      return diffOutput;
    } catch (error: any) {
      console.error('Diff computation error:', error.message);
      return '';
    }
  }

  async getFileDiff(
    repoPath: string,
    filePath: string,
    baseBranch: string,
    targetBranch: string
  ): Promise<string> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const diff = await git.diff([baseBranch, targetBranch, '--', filePath]);
      return diff;
    } catch (error: any) {
      console.error('File diff error:', error.message);
      return '';
    }
  }

  parseDiffToHtml(diffOutput: string): any[] {
    const files: any[] = [];
    const filePattern = /diff --git a\/(.*) b\/(.*)/g;
    let match;

    while ((match = filePattern.exec(diffOutput)) !== null) {
      const oldPath = match[1];
      const newPath = match[2];
      files.push({
        oldPath,
        newPath,
        hunks: []
      });
    }

    return files;
  }
}