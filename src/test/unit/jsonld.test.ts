import { describe, it, expect } from 'vitest';
import { jsonLd } from '@/utils/jsonld';

describe('jsonLd', () => {
  it('serializa un objeto simple como JSON', () => {
    expect(jsonLd({ '@type': 'Thing', n: 1 })).toBe('{"@type":"Thing","n":1}');
  });

  it('escapa < para que un </script> en los datos no cierre el bloque', () => {
    const out = jsonLd({ text: '</script>' });
    expect(out).toContain('\\u003c/script>');
    expect(out).not.toContain('</script>');
    expect(out).not.toContain('<');
  });

  it('JSON.parse del output (revirtiendo el escape) devuelve el objeto original', () => {
    const data = { a: '<b>', nested: { list: ['</script>', 'ok'] } };
    const out = jsonLd(data);
    expect(JSON.parse(out)).toEqual(data);
    expect(JSON.parse(out.replace(/\\u003c/g, '<'))).toEqual(data);
  });
});
