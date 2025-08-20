/**
 * Workspace Context Collector
 * Gathers project context for enhanced code explanations
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { WorkspaceContext, RepoContext, ProjectContext, CollectContextOptions } from './types';

const contextCache = new Map<string, { expires: number; value: WorkspaceContext }>();

export async function collectWorkspaceContext(opts: CollectContextOptions): Promise<WorkspaceContext | undefined> {
  if (opts.level === "off") return undefined;
  if (!vscode.workspace.isTrusted) return undefined;

  const cacheKey = `${opts.cwd}:${opts.level}`;
  const now = Date.now();
  const hit = contextCache.get(cacheKey);
  if (hit && hit.expires > now) return hit.value;

  const repo: RepoContext = { rootName: path.basename(opts.cwd) };

  // Get Git branch via VS Code Git extension API
  try {
    const gitExt = vscode.extensions.getExtension<any>('vscode.git')?.exports;
    const api = gitExt?.getAPI?.(1);
    const repoApi = api?.repositories?.[0];
    repo.gitBranch = repoApi?.state?.HEAD?.name;
  } catch {
    // Silently continue if Git extension not available
  }

  // Detect monorepo structure
  const monorepoMatches = await vscode.workspace.findFiles(
    '{pnpm-workspace.yaml,lerna.json,packages/**/package.json,apps/**/package.json,workspace.json,nx.json}',
    '**/{node_modules,.git,dist,out,build}/**'
  );
  repo.isMonorepo = monorepoMatches.length > 0;

  const project: ProjectContext = await detectProjectContext(opts);
  const deps = await collectDependencies(project, opts);

  const result: WorkspaceContext = { 
    repo, 
    project, 
    deps: deps.slice(0, opts.maxDeps) 
  };
  
  contextCache.set(cacheKey, { 
    expires: now + (opts.cacheTtlMs ?? 60_000), 
    value: result 
  });
  
  return result;
}

async function detectProjectContext(opts: CollectContextOptions): Promise<ProjectContext> {
  const files = await vscode.workspace.findFiles(
    '{package.json,pyproject.toml,requirements.txt,go.mod,Cargo.toml,pom.xml,build.gradle,gradle.build}',
    '**/{node_modules,.git,dist,out,build}/**'
  );
  
  const p: ProjectContext = { type: "unknown" };

  for (const f of files) {
    const fn = path.basename(f.fsPath);
    if (fn === 'package.json') {
      p.type = 'node';
      p.manifestPath = maybeAnonymize(f.fsPath, opts.anonymizePaths, opts.cwd);
      const frameworks = await guessNodeFrameworks(f);
      const testFramework = await guessNodeTestFramework(f);
      if (frameworks.length > 0) p.frameworkHints = frameworks;
      if (testFramework) p.testFramework = testFramework;
      break;
    }
    if (fn === 'pyproject.toml' || fn === 'requirements.txt') {
      p.type = 'python'; 
      p.manifestPath = maybeAnonymize(f.fsPath, opts.anonymizePaths, opts.cwd);
      // TODO: Add Python framework detection
      break;
    }
    if (fn === 'go.mod') {
      p.type = 'go'; 
      p.manifestPath = maybeAnonymize(f.fsPath, opts.anonymizePaths, opts.cwd); 
      break;
    }
    if (fn === 'Cargo.toml') {
      p.type = 'rust'; 
      p.manifestPath = maybeAnonymize(f.fsPath, opts.anonymizePaths, opts.cwd); 
      break;
    }
    if (fn === 'pom.xml' || fn === 'build.gradle' || fn === 'gradle.build') {
      p.type = 'java'; 
      p.manifestPath = maybeAnonymize(f.fsPath, opts.anonymizePaths, opts.cwd); 
      break;
    }
  }
  return p;
}

async function collectDependencies(project: ProjectContext, opts: CollectContextOptions): Promise<string[]> {
  // Start with Node.js for MVP; expand later
  try {
    if (project.type === 'node' && project.manifestPath) {
      const uri = vscode.Uri.file(project.manifestPath.replace('<workspace>', opts.cwd));
      const doc = await vscode.workspace.fs.readFile(uri);
      const pkg = JSON.parse(Buffer.from(doc).toString('utf8'));
      
      const deps = Object.keys({ 
        ...(pkg.dependencies ?? {}), 
        ...(pkg.devDependencies ?? {}) 
      });
      
      return deps;
    }
  } catch (error) {
    // Silently continue if package.json can't be read
  }
  return [];
}

async function guessNodeFrameworks(packageJsonUri: vscode.Uri): Promise<string[]> {
  try {
    const doc = await vscode.workspace.fs.readFile(packageJsonUri);
    const pkg = JSON.parse(Buffer.from(doc).toString('utf8'));
    
    const allDeps = { 
      ...(pkg.dependencies ?? {}), 
      ...(pkg.devDependencies ?? {}) 
    };
    
    const frameworks: string[] = [];
    
    // React detection
    if (allDeps.react) frameworks.push('react');
    if (allDeps.next) frameworks.push('nextjs');
    if (allDeps.gatsby) frameworks.push('gatsby');
    
    // Vue detection  
    if (allDeps.vue) frameworks.push('vue');
    if (allDeps.nuxt) frameworks.push('nuxtjs');
    
    // Angular detection
    if (allDeps['@angular/core']) frameworks.push('angular');
    
    // Backend frameworks
    if (allDeps.express) frameworks.push('express');
    if (allDeps.fastify) frameworks.push('fastify');
    if (allDeps.koa) frameworks.push('koa');
    if (allDeps.nestjs) frameworks.push('nestjs');
    
    // Build tools
    if (allDeps.vite) frameworks.push('vite');
    if (allDeps.webpack) frameworks.push('webpack');
    if (allDeps.rollup) frameworks.push('rollup');
    
    return frameworks;
  } catch (error) {
    return [];
  }
}

async function guessNodeTestFramework(packageJsonUri: vscode.Uri): Promise<string | undefined> {
  try {
    const doc = await vscode.workspace.fs.readFile(packageJsonUri);
    const pkg = JSON.parse(Buffer.from(doc).toString('utf8'));
    
    const allDeps = { 
      ...(pkg.dependencies ?? {}), 
      ...(pkg.devDependencies ?? {}) 
    };
    
    // Test framework priority order
    if (allDeps.vitest) return 'vitest';
    if (allDeps.jest) return 'jest';
    if (allDeps.mocha) return 'mocha';
    if (allDeps.ava) return 'ava';
    if (allDeps.jasmine) return 'jasmine';
    if (allDeps.tap) return 'tap';
    
    return undefined;
  } catch (error) {
    return undefined;
  }
}

function maybeAnonymize(p: string, on: boolean, cwd: string): string {
  if (!on) return p;
  return p.replace(cwd, "<workspace>");
}

export function clearContextCache(): void {
  contextCache.clear();
}

export function getContextCacheSize(): number {
  return contextCache.size;
}