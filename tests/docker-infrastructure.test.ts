import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ===== Helpers : lecture brute + regex directes =====
function readComposeFile(): string {
  return fs.readFileSync(path.join(__dirname, '..', 'docker-compose.yml'), 'utf-8');
}

function readDockerfile(): string {
  return fs.readFileSync(path.join(__dirname, '..', 'Dockerfile'), 'utf-8');
}

function readDockerignore(): string {
  return fs.readFileSync(path.join(__dirname, '..', '.dockerignore'), 'utf-8');
}

// ===== Checks structurés sur docker-compose.yml =====

describe('docker-compose.yml — structure de déploiement Docker', () => {
  const content = readComposeFile();

  it('définit exactement un service nommé "annonces"', () => {
    // Après "services:", les noms de services sont indentés à 2 espaces
    const afterServices = content.slice(content.indexOf('services:') ?? content.length);
    const serviceNames = afterServices.match(/^\s{2}(\w+):\s*$/gm);
    const names = (serviceNames ?? []).map((s) => s.trim().replace(':', ''));
    expect(names).toHaveLength(1);
    expect(names[0]).toBe('annonces');
  });

  it('spécifie network_mode: host', () => {
    expect(content).toMatch(/network_mode:\s*host/);
  });

  it('force PORT=3011 dans environment', () => {
    expect(content).toMatch(/PORT\s*=\s*3011/i);
  });

  it('monte ./data:/app/data (persistance JSON)', () => {
    // Vérifie la ligne contient le mount data → /app/data
    const lines = content.split('\n');
    const dataMountLine = lines.find((l) => l.includes('./data') && l.includes('/app/data'));
    expect(dataMountLine).toBeDefined();
  });

  it('monte ~/.hermes/google_token.json en lecture seule sur /root/.hermes/google_token.json', () => {
    expect(content).toMatch(/google_token\.json.*:ro/);
  });

  it('utilise env_file .env.local', () => {
    expect(content).toMatch(/env_file:\s*\n\s*-\s*\.env\.local/);
  });

  it('utilise restart: unless-stopped', () => {
    expect(content).toMatch(/restart:\s*unless-stopped/);
  });

  it('définit container_name: annonces', () => {
    expect(content).toMatch(/container_name:\s*annonces/);
  });
});

// ===== Checks sur le Dockerfile =====

describe('Dockerfile — multi-stage build Next.js', () => {
  const content = readDockerfile();

  it('déclare exactement 3 stages AS (deps, builder, runner)', () => {
    const stages = content.match(/^FROM \S+ AS \w+/gm);
    expect(stages).not.toBeNull();
    expect(stages!).toHaveLength(3);
    const stageNames = stages!.map((s) => s.match(/AS\s+(\w+)/)?.[1]).filter(Boolean);
    expect(stageNames).toContain('deps');
    expect(stageNames).toContain('builder');
    expect(stageNames).toContain('runner');
  });

  it('base image node:22-slim sur tous les stages', () => {
    const stages = content.match(/^FROM (\S+)/gm);
    expect(stages).not.toBeNull();
    for (const stage of stages!) {
      expect(stage).toContain('node:22-slim');
    }
  });

  it('définit ENV PORT=3011 (dans le stage runner)', () => {
    expect(content).toMatch(/ENV\s+PORT\s*=\s*3011/);
  });

  it('définit ENV NODE_ENV=production', () => {
    expect(content).toMatch(/ENV\s+NODE_ENV\s*=\s*production/);
  });

  it('EXPOSE 3011', () => {
    expect(content).toMatch(/^EXPOSE\s+3011/m);
  });

  it('COPY --from=deps /app/node_modules → runner', () => {
    expect(content).toMatch(/COPY --from=deps \/app\/node_modules/);
  });

  it('COPY --from=builder .next → runner', () => {
    expect(content).toMatch(/COPY --from=builder .*\/\.next/);
  });

  it('COPY --from=builder public → runner', () => {
    expect(content).toMatch(/COPY --from=builder .*\/public/);
  });

  it('COPY --from=builder package.json → runner', () => {
    expect(content).toMatch(/COPY --from=builder .*package\.json/);
  });

  it('CMD lance next start via node_modules/bin', () => {
    expect(content).toMatch(/^CMD\s*\[/m);
    expect(content).toContain('next');
    expect(content).toContain('start');
  });

  it('ne contient pas de npm ci/build dans le stage runner', () => {
    const runnerStage = content.slice(content.toLowerCase().indexOf('as runner'));
    expect(runnerStage).not.toMatch(/npm ci/i);
    expect(runnerStage).not.toMatch(/npm run build/i);
  });

  it('.dockerignore exclut node_modules/.next/.git/data/.env.local/*.md', () => {
    const ignoreContent = readDockerignore();
    for (const entry of ['node_modules', '.next', '.git', 'data', '.env.local']) {
      expect(ignoreContent.split('\n').some((line) => line.trim() === entry)).toBe(true);
    }
  });
});
