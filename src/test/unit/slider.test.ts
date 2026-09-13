import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initSliders } from '@/utils/slider';

function mount(slides = 3): HTMLElement {
  document.body.innerHTML = `
    <div data-slider>
      <div data-slider-track>
        ${Array.from({ length: slides }, (_, i) => `<article>Card ${i}</article>`).join('')}
      </div>
      <div>
        <button type="button" data-slider-prev>‹</button>
        <div data-slider-dots></div>
        <button type="button" data-slider-next>›</button>
      </div>
    </div>
  `;
  return document.querySelector('[data-slider]') as HTMLElement;
}

describe('initSliders', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.HTMLElement.prototype.scrollTo = vi.fn() as unknown as typeof window.HTMLElement.prototype.scrollTo;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
  });

  it('crea un dot por slide y avanza con siguiente', () => {
    const root = mount(3);
    initSliders();

    const dots = root.querySelectorAll('.slider-dot');
    expect(dots).toHaveLength(3);
    expect(dots[0].classList.contains('active')).toBe(true);

    (root.querySelector('[data-slider-next]') as HTMLElement).click();
    expect(dots[0].classList.contains('active')).toBe(false);
    expect(dots[1].classList.contains('active')).toBe(true);
    expect(window.HTMLElement.prototype.scrollTo).toHaveBeenCalled();
  });

  it('vuelve al principio al avanzar desde la última', () => {
    const root = mount(2);
    initSliders();
    const next = root.querySelector('[data-slider-next]') as HTMLElement;
    const dots = root.querySelectorAll('.slider-dot');

    next.click(); // -> 1
    next.click(); // -> 0 (wrap)
    expect(dots[0].classList.contains('active')).toBe(true);
    expect(dots[1].classList.contains('active')).toBe(false);
  });

  it('los dots saltan directo a su tarjeta', () => {
    const root = mount(3);
    initSliders();
    const dots = root.querySelectorAll('.slider-dot');

    (dots[2] as HTMLElement).click();
    expect(dots[2].classList.contains('active')).toBe(true);
  });

  it('no duplica inits ni toca sliders de 1 slide', () => {
    mount(1);
    initSliders();
    initSliders();
    expect(document.querySelectorAll('.slider-dot')).toHaveLength(0);
  });

  it('reutiliza los dots del markup sin duplicar (tienen scope de Astro)', () => {
    document.body.innerHTML = `
      <div data-slider>
        <div data-slider-track>
          <article>A</article>
          <article>B</article>
        </div>
        <div>
          <button type="button" data-slider-prev>‹</button>
          <div data-slider-dots>
            <button type="button" class="slider-dot" aria-label="Ir a A"></button>
            <button type="button" class="slider-dot" aria-label="Ir a B"></button>
          </div>
          <button type="button" data-slider-next>›</button>
        </div>
      </div>
    `;
    initSliders();
    const dots = document.querySelectorAll('.slider-dot');
    expect(dots).toHaveLength(2);
    expect(dots[0].classList.contains('active')).toBe(true);

    (dots[1] as HTMLElement).click();
    expect(dots[1].classList.contains('active')).toBe(true);
    expect(dots[0].classList.contains('active')).toBe(false);
  });
});
