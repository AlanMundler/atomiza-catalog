/**
 * Slider por click para mobile (una tarjeta centrada por vez, con flechas
 * y dots). Usa scroll nativo + scroll-snap del CSS: el swipe con el dedo
 * sigue funcionando, los botones son la vía principal.
 *
 * Estructura esperada:
 * <div data-slider>
 *   <div data-slider-track>...slides...</div>
 *   <button data-slider-prev> / <div data-slider-dots> / <button data-slider-next>
 * </div>
 */

interface AutoplayControl {
  root: HTMLElement;
  stop: () => void;
  start: () => void;
}

// Un solo listener de `visibilitychange` para todos los sliders: antes cada
// instancia sumaba el suyo a `document` y sobrevivía a las navegaciones SPA.
// Las entradas de sliders ya desmontados se podan en cada disparo.
const autoplayControls = new Set<AutoplayControl>();
let visibilityHookInstalled = false;

function installVisibilityHook(): void {
  if (visibilityHookInstalled) return;
  visibilityHookInstalled = true;
  document.addEventListener('visibilitychange', () => {
    for (const control of Array.from(autoplayControls)) {
      if (!control.root.isConnected) {
        autoplayControls.delete(control);
        continue;
      }
      if (document.visibilityState === 'hidden') control.stop();
      else control.start();
    }
  });
}
export function initSliders(scope: ParentNode = document): void {
  if (typeof window === 'undefined') return;
  const roots = scope.querySelectorAll('[data-slider]:not([data-slider-ready])');
  roots.forEach((root) => {
    if (!(root instanceof HTMLElement)) return;
    const track = root.querySelector('[data-slider-track]');
    if (!(track instanceof HTMLElement)) return;
    const slides = Array.from(track.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement
    );
    if (slides.length < 2) return;
    root.dataset.sliderReady = '1';

    const prev = root.querySelector('[data-slider-prev]');
    const next = root.querySelector('[data-slider-next]');
    const dotsBox = root.querySelector('[data-slider-dots]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dots: HTMLButtonElement[] = [];
    let index = 0;

    const paint = () => {
      dots.forEach((d, k) => d.classList.toggle('active', k === index));
    };

    const step = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      return slides[0].getBoundingClientRect().width + gap;
    };

    const go = (k: number) => {
      index = (k + slides.length) % slides.length;
      track.scrollTo({ left: Math.round(index * step()), behavior: reduceMotion ? 'auto' : 'smooth' });
      paint();
    };

    if (dotsBox) {
      // Los dots viven en el markup (con el scope de Astro); solo se crean
      // acá como fallback si el HTML no los trae (los creados por JS no
      // matchean CSS scopeado).
      const existing = Array.from(dotsBox.querySelectorAll('.slider-dot')).filter(
        (el): el is HTMLButtonElement => el instanceof HTMLButtonElement
      );
      if (existing.length > 0) {
        dots.push(...existing.slice(0, slides.length));
      } else {
        slides.forEach((_, k) => {
          const d = document.createElement('button');
          d.type = 'button';
          d.className = 'slider-dot';
          d.setAttribute('aria-label', `Ir a la tarjeta ${k + 1} de ${slides.length}`);
          dotsBox.appendChild(d);
          dots.push(d);
        });
      }
      dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
      paint();
      // Si el usuario desliza con el dedo, los dots lo siguen.
      let raf = 0;
      track.addEventListener(
        'scroll',
        () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            const w = step() || 1;
            const k = Math.round(track.scrollLeft / w);
            if (k !== index && k >= 0 && k < slides.length) {
              index = k;
              paint();
            }
          });
        },
        { passive: true }
      );
    }

    prev?.addEventListener('click', () => go(index - 1));
    next?.addEventListener('click', () => go(index + 1));

    // Autoplay cada 3s, fluido (scroll suave). Se pausa mientras el usuario
    // interactúa o la pestaña está oculta; no corre con movimiento reducido.
    // Si el slider sale del DOM (navegación SPA), el intervalo se limpia solo.
    if (!reduceMotion) {
      const AUTOPLAY_MS = 3000;
      const RESUME_MS = 6000;
      let timer = 0;
      let resumeTimer = 0;
      const stop = () => {
        if (timer) {
          window.clearInterval(timer);
          timer = 0;
        }
      };
      const start = () => {
        if (timer) return;
        timer = window.setInterval(() => {
          if (!root.isConnected) {
            stop();
            return;
          }
          if (document.visibilityState === 'hidden') return;
          go(index + 1);
        }, AUTOPLAY_MS);
      };
      const pauseAndResume = () => {
        stop();
        window.clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(start, RESUME_MS);
      };
      root.addEventListener('pointerenter', stop);
      root.addEventListener('pointerleave', pauseAndResume);
      root.addEventListener('focusin', stop);
      root.addEventListener('focusout', pauseAndResume);
      installVisibilityHook();
      autoplayControls.add({ root, stop, start });
      start();
    }
  });
}
