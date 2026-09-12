import { describe, it, expect } from 'vitest';
import { TRIDENT_DISCOUNT, tridentesCompletos, descuentoTridente } from '@/utils/trident';

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


