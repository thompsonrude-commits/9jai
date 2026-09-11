import { describe, it, expect } from 'vitest';
import { generateChartSVG } from '../../../functions/src/chartGenerator';

describe('chart generator', () => {
  it('generates a bar svg for simple data', () => {
    const labels = ['A','B','C'];
    const values = [10,20,5];
    const { svg, contentType } = generateChartSVG({ type: 'bar', labels, values, width: 400, height: 200, title: 'Test' });
    expect(typeof svg).toBe('string');
    expect(svg.length).toBeGreaterThan(10);
    expect(contentType).toBe('image/svg+xml');
    expect(svg).toContain('<svg');
  });
});
