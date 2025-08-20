"use strict";
/**
 * Workspace Context Collector
 * Gathers project context for enhanced code explanations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectWorkspaceContext = collectWorkspaceContext;
exports.clearContextCache = clearContextCache;
exports.getContextCacheSize = getContextCacheSize;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const contextCache = new Map();
async function collectWorkspaceContext(opts) {
    if (opts.level === "off")
        return undefined;
    if (!vscode.workspace.isTrusted)
        return undefined;
    const cacheKey = `${opts.cwd}:${opts.level}`;
    const now = Date.now();
    const hit = contextCache.get(cacheKey);
    if (hit && hit.expires > now)
        return hit.value;
    const repo = { rootName: path.basename(opts.cwd) };
    // Get Git branch via VS Code Git extension API
    try {
        const gitExt = vscode.extensions.getExtension('vscode.git')?.exports;
        const api = gitExt?.getAPI?.(1);
        const repoApi = api?.repositories?.[0];
        repo.gitBranch = repoApi?.state?.HEAD?.name;
    }
    catch {
        // Silently continue if Git extension not available
    }
    // Detect monorepo structure
    const monorepoMatches = await vscode.workspace.findFiles('{pnpm-workspace.yaml,lerna.json,packages/**/package.json,apps/**/package.json,workspace.json,nx.json}', '**/{node_modules,.git,dist,out,build}/**');
    repo.isMonorepo = monorepoMatches.length > 0;
    const project = await detectProjectContext(opts);
    const deps = await collectDependencies(project, opts);
    const result = {
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
async function detectProjectContext(opts) {
    const files = await vscode.workspace.findFiles('{package.json,pyproject.toml,requirements.txt,go.mod,Cargo.toml,pom.xml,build.gradle,gradle.build}', '**/{node_modules,.git,dist,out,build}/**');
    const p = { type: "unknown" };
    for (const f of files) {
        const fn = path.basename(f.fsPath);
        if (fn === 'package.json') {
            p.type = 'node';
            p.manifestPath = maybeAnonymize(f.fsPath, opts.anonymizePaths, opts.cwd);
            const frameworks = await guessNodeFrameworks(f);
            const testFramework = await guessNodeTestFramework(f);
            if (frameworks.length > 0)
                p.frameworkHints = frameworks;
            if (testFramework)
                p.testFramework = testFramework;
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
async function collectDependencies(project, opts) {
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
    }
    catch (error) {
        // Silently continue if package.json can't be read
    }
    return [];
}
async function guessNodeFrameworks(packageJsonUri) {
    try {
        const doc = await vscode.workspace.fs.readFile(packageJsonUri);
        const pkg = JSON.parse(Buffer.from(doc).toString('utf8'));
        const allDeps = {
            ...(pkg.dependencies ?? {}),
            ...(pkg.devDependencies ?? {})
        };
        const frameworks = [];
        // React detection
        if (allDeps.react)
            frameworks.push('react');
        if (allDeps.next)
            frameworks.push('nextjs');
        if (allDeps.gatsby)
            frameworks.push('gatsby');
        // Vue detection  
        if (allDeps.vue)
            frameworks.push('vue');
        if (allDeps.nuxt)
            frameworks.push('nuxtjs');
        // Angular detection
        if (allDeps['@angular/core'])
            frameworks.push('angular');
        // Backend frameworks
        if (allDeps.express)
            frameworks.push('express');
        if (allDeps.fastify)
            frameworks.push('fastify');
        if (allDeps.koa)
            frameworks.push('koa');
        if (allDeps.nestjs)
            frameworks.push('nestjs');
        // Build tools
        if (allDeps.vite)
            frameworks.push('vite');
        if (allDeps.webpack)
            frameworks.push('webpack');
        if (allDeps.rollup)
            frameworks.push('rollup');
        return frameworks;
    }
    catch (error) {
        return [];
    }
}
async function guessNodeTestFramework(packageJsonUri) {
    try {
        const doc = await vscode.workspace.fs.readFile(packageJsonUri);
        const pkg = JSON.parse(Buffer.from(doc).toString('utf8'));
        const allDeps = {
            ...(pkg.dependencies ?? {}),
            ...(pkg.devDependencies ?? {})
        };
        // Test framework priority order
        if (allDeps.vitest)
            return 'vitest';
        if (allDeps.jest)
            return 'jest';
        if (allDeps.mocha)
            return 'mocha';
        if (allDeps.ava)
            return 'ava';
        if (allDeps.jasmine)
            return 'jasmine';
        if (allDeps.tap)
            return 'tap';
        return undefined;
    }
    catch (error) {
        return undefined;
    }
}
function maybeAnonymize(p, on, cwd) {
    if (!on)
        return p;
    return p.replace(cwd, "<workspace>");
}
function clearContextCache() {
    contextCache.clear();
}
function getContextCacheSize() {
    return contextCache.size;
}
//# sourceMappingURL=context.js.map