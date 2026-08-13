import { describe, it, expect } from 'vitest';
import { DeveloperPlatform } from '../DeveloperPlatform';

describe('DeveloperPlatform scaffolding', () => {
  it('creates a project scaffold result with README and package.json artifacts', async () => {
    const platform = new DeveloperPlatform();
    const result = await platform.scaffoldProject({
      projectName: 'test-app',
      description: 'Test application scaffold',
      author: 'Test',
      language: 'typescript',
      destination: 'generated',
    });

    expect(result.success).toBe(true);
    expect(result.artifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'generated/test-app/README.md' }),
        expect.objectContaining({ path: 'generated/test-app/package.json' }),
      ]),
    );
  });

  it('creates a plugin scaffold with manifest metadata', async () => {
    const platform = new DeveloperPlatform();
    const result = await platform.scaffoldPlugin({
      pluginId: 'plugin-test',
      name: 'Plugin Test',
      description: 'Plugin scaffold',
      capabilities: [],
    });

    expect(result.success).toBe(true);
    expect(result.artifacts[0].path).toBe('plugins/plugin-test/manifest.json');
    expect(result.artifacts[0].content).toContain('plugin-test');
  });
});
