import { describe, it, expect } from 'vitest';
import { TRIDENT_DISCOUNT, computeTridentTotal, buildTridentOrderText, tridentesCompletos, descuentoTridente } from '@/utils/trident';
import { formatPrice } from '@/utils/formatters';

describe('descuento automático por cantidad', () => {
  it('no descuenta con menos de 3 decants', () => {
    expect(tridentesCompletos(0)).toBe(0);
    expect(tridentesCompletos(1)).toBe(0);
    expect(tridentesCompletos(2)).toBe(0);
    expect(descuentoTridente(2)).toBe(0);
  });

  it('descuenta $2.000 fijos con 3, 4 y 5 decants', () => {
    expect(tridentesCompletos(3)).toBe(1);
    expect(tridentesCompletos(5)).toBe(1);
    expect(descuentoTridente(3)).toBe(TRIDENT_DISCOUNT);
    expect(descuentoTridente(4)).toBe(TRIDENT_DISCOUNT);
    expect(descuentoTridente(5)).toBe(TRIDENT_DISCOUNT);
  });

  it('escala a $1.000 por decant desde 6: 6->$6.000, 9->$9.000', () => {
    expect(tridentesCompletos(6)).toBe(2);
    expect(tridentesCompletos(9)).toBe(3);
    expect(descuentoTridente(6)).toBe(6000);
    expect(descuentoTridente(7)).toBe(7000);
    expect(descuentoTridente(9)).toBe(9000);
  });

  it('ignora cantidades inválidas', () => {
    expect(tridentesCompletos(-3)).toBe(0);
    expect(tridentesCompletos(2.5)).toBe(0);
    expect(tridentesCompletos(NaN)).toBe(0);
    expect(descuentoTridente(-3)).toBe(0);
  });
});

describe('computeTridentTotal', () => {
  it('aplica el descuento a un tridente de 3 precios iguales', () => {
    expect(computeTridentTotal([6000, 6000, 6000])).toBe(16000);
  });

  it('aplica el descuento a un tridente con precios mixtos (incluye Rasasi de 10.000)', () => {
    expect(computeTridentTotal([6000, 6000, 10000])).toBe(20000);
  });

  it('aplica el descuento a un tridente de 3 Rasasi', () => {
    expect(computeTridentTotal([10000, 10000, 10000])).toBe(28000);
  });

  it('devuelve null con menos de 3 precios', () => {
    expect(computeTridentTotal([])).toBeNull();
    expect(computeTridentTotal([6000])).toBeNull();
    expect(computeTridentTotal([6000, 6000])).toBeNull();
  });

  it('devuelve null con más de 3 precios', () => {
    expect(computeTridentTotal([6000, 6000, 6000, 6000])).toBeNull();
  });

  it('devuelve null con precios inválidos', () => {
    expect(computeTridentTotal([6000, NaN, 6000])).toBeNull();
    expect(computeTridentTotal([6000, -1, 6000])).toBeNull();
  });
});

describe('buildTridentOrderText', () => {
  const lines = [
    { brand: 'Lattafa', name: 'Qaed Al Fursan', price: 6000 },
    { brand: 'Rasasi', name: 'Hawas Ice', price: 10000 },
    { brand: 'Armaf', name: 'Club de Nuit', price: 6000 },
  ];

  it('incluye las 3 fragancias con su precio', () => {
    const text = buildTridentOrderText(lines, 20000);
    expect(text).toContain('Lattafa - Qaed Al Fursan');
    expect(text).toContain('Rasasi - Hawas Ice');
    expect(text).toContain('Armaf - Club de Nuit');
    expect(text).toContain('$6.000');
    expect(text).toContain('$10.000');
  });

  it('incluye el total con descuento y el ahorro', () => {
    const text = buildTridentOrderText(lines, 20000);
    expect(text).toContain('$20.000');
    expect(text).toContain(`ahorrás ${formatPrice(TRIDENT_DISCOUNT)}`);
  });

  it('no permite meterse en el carrito: el total nunca es menor a la suma menos el descuento', () => {
    const total = computeTridentTotal(lines.map((l) => l.price))!;
    expect(total).toBe(lines.reduce((acc, l) => acc + l.price, 0) - TRIDENT_DISCOUNT);
  });
});
