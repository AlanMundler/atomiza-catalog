import { describe, it, expect } from 'vitest';
import { TRIO_DISCOUNT, computeTrioTotal, buildTrioOrderText } from '@/utils/trio';
import { formatPrice } from '@/utils/formatters';

describe('computeTrioTotal', () => {
  it('aplica el descuento a un trío de 3 precios iguales', () => {
    expect(computeTrioTotal([6000, 6000, 6000])).toBe(16000);
  });

  it('aplica el descuento a un trío con precios mixtos (incluye Rasasi de 10.000)', () => {
    expect(computeTrioTotal([6000, 6000, 10000])).toBe(20000);
  });

  it('aplica el descuento a un trío de 3 Rasasi', () => {
    expect(computeTrioTotal([10000, 10000, 10000])).toBe(28000);
  });

  it('devuelve null con menos de 3 precios', () => {
    expect(computeTrioTotal([])).toBeNull();
    expect(computeTrioTotal([6000])).toBeNull();
    expect(computeTrioTotal([6000, 6000])).toBeNull();
  });

  it('devuelve null con más de 3 precios', () => {
    expect(computeTrioTotal([6000, 6000, 6000, 6000])).toBeNull();
  });

  it('devuelve null con precios inválidos', () => {
    expect(computeTrioTotal([6000, NaN, 6000])).toBeNull();
    expect(computeTrioTotal([6000, -1, 6000])).toBeNull();
  });
});

describe('buildTrioOrderText', () => {
  const lines = [
    { brand: 'Lattafa', name: 'Qaed Al Fursan', price: 6000 },
    { brand: 'Rasasi', name: 'Hawas Ice', price: 10000 },
    { brand: 'Armaf', name: 'Club de Nuit', price: 6000 },
  ];

  it('incluye las 3 fragancias con su precio', () => {
    const text = buildTrioOrderText(lines, 20000);
    expect(text).toContain('Lattafa - Qaed Al Fursan');
    expect(text).toContain('Rasasi - Hawas Ice');
    expect(text).toContain('Armaf - Club de Nuit');
    expect(text).toContain('$6.000');
    expect(text).toContain('$10.000');
  });

  it('incluye el total con descuento y el ahorro', () => {
    const text = buildTrioOrderText(lines, 20000);
    expect(text).toContain('$20.000');
    expect(text).toContain(`ahorrás ${formatPrice(TRIO_DISCOUNT)}`);
  });

  it('no permite meterse en el carrito: el total nunca es menor a la suma menos el descuento', () => {
    const total = computeTrioTotal(lines.map((l) => l.price))!;
    expect(total).toBe(lines.reduce((acc, l) => acc + l.price, 0) - TRIO_DISCOUNT);
  });
});
