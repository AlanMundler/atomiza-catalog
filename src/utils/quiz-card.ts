import { assetUrl, site } from '@/site.config';
import { buildWhatsAppLink, formatPrice } from '@/utils/formatters';
import { getStockLabel, getStockStatus } from '@/utils/stock';
import { findInspiracion } from '@/data/inspiraciones';
import { bindOnce } from '@/utils/view-transitions';
import type { Perfume } from '@/data/types';

/** Párrafo de estado vacío del resultado (error de red o sin matches). */
export function resultEmpty(message: string): HTMLElement {
  const empty = document.createElement('p');
  empty.className = 'quiz-result-empty';
  empty.textContent = message;
  return empty;
}

/**
 * Tarjeta de perfume recomendado. `reason` viene ya calculado por quien
 * llama (es el mismo para todos los resultados de una jugada).
 */
export function resultCard(perfume: Perfume, reason: string): HTMLElement {
  const size = perfume.sizes.find((s) => s.ml === 5) ?? perfume.sizes[0];
  if (!size) {
    return resultEmpty(`${perfume.brand} ${perfume.name} no tiene tallas configuradas por el momento.`);
  }
  const image = perfume.images[0];
  const stockStatus = getStockStatus(size);
  const stockLabel = getStockLabel(stockStatus);

  const card = document.createElement('article');
  card.className = 'quiz-result-card';
  card.dataset.price = String(size.price);
  card.dataset.gender = perfume.gender;
  card.dataset.perfumeId = perfume.id;

  const media = document.createElement('div');
  media.className = 'quiz-result-media';
  const img = document.createElement('img');
  img.src = assetUrl(image?.src);
  img.alt = image?.alt ?? perfume.name;
  img.loading = 'lazy';
  img.width = 400;
  img.height = 400;
  media.appendChild(img);

  const body = document.createElement('div');
  body.className = 'quiz-result-body';

  const eyebrow = document.createElement('div');
  eyebrow.className = 'quiz-result-eyebrow';
  const rule = document.createElement('span');
  rule.className = 'quiz-result-rule';
  rule.setAttribute('aria-hidden', 'true');
  eyebrow.appendChild(rule);
  const badge = document.createElement('span');
  badge.className = 'quiz-result-badge';
  badge.textContent = 'Tu match ideal';
  eyebrow.appendChild(badge);
  body.appendChild(eyebrow);

  const brand = document.createElement('span');
  brand.className = 'quiz-result-brand';
  brand.textContent = perfume.brand.toUpperCase();
  body.appendChild(brand);

  const name = document.createElement('h3');
  name.className = 'quiz-result-name';
  name.textContent = perfume.name;
  body.appendChild(name);

  const reasonEl = document.createElement('p');
  reasonEl.className = 'quiz-result-reason';
  reasonEl.textContent = reason;
  body.appendChild(reasonEl);

  const divider = document.createElement('div');
  divider.className = 'quiz-result-divider';
  divider.setAttribute('aria-hidden', 'true');
  body.appendChild(divider);

  const meta = document.createElement('div');
  meta.className = 'quiz-result-meta';
  const price = document.createElement('span');
  price.className = 'quiz-result-price';
  price.textContent = formatPrice(size.price);
  meta.appendChild(price);
  const stock = document.createElement('span');
  stock.className = `quiz-result-stock quiz-result-stock--${stockStatus}`;
  stock.textContent = stockLabel;
  meta.appendChild(stock);
  body.appendChild(meta);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn--primary btn--lg quiz-result-add';
  addBtn.textContent = 'Agregar al carrito';
  addBtn.dataset.addPerfumeId = perfume.id;
  bindOnce(addBtn, (el) => {
    el.addEventListener('click', () => {
      const event = new CustomEvent('cart:add', {
        detail: { perfumeId: perfume.id, sizeMl: size.ml, quantity: 1 },
      });
      window.dispatchEvent(event);
      window.dispatchEvent(new CustomEvent('cart:open'));
    });
  });
  body.appendChild(addBtn);

  const waMessage = buildWhatsAppLink(
    site.whatsappNumber,
    `Hola! Hice el quiz de ${site.name} y me recomendó ${perfume.brand} ${perfume.name} (5ml, ${formatPrice(size.price)}). ¿Me ayudás a confirmarlo?`
  );
  const waBtn = document.createElement('a');
  waBtn.className = 'btn btn--secondary btn--lg quiz-result-wa';
  waBtn.href = waMessage;
  waBtn.target = '_blank';
  waBtn.rel = 'noopener noreferrer';
  waBtn.textContent = 'Consultar por WhatsApp';
  body.appendChild(waBtn);

  // Link a la landing de decants por inspiración (si existe)
  const inspiracion = findInspiracion(perfume.id);
  if (inspiracion) {
    const inspiracionLink = document.createElement('a');
    inspiracionLink.className = 'quiz-result-inspiracion';
    inspiracionLink.href = `${site.basePath}decants/${inspiracion.slug}/`;
    inspiracionLink.textContent = `Ver inspiración: ${inspiracion.original}`;
    inspiracionLink.setAttribute('aria-label', `Decants inspirados en ${inspiracion.original} de ${inspiracion.casa}`);
    body.appendChild(inspiracionLink);
  }

  const detail = document.createElement('a');
  detail.className = 'quiz-result-detail';
  detail.href = `${site.basePath}producto/${perfume.slug}/`;
  detail.textContent = 'Ver detalle';
  body.appendChild(detail);

  card.appendChild(media);
  card.appendChild(body);
  return card;
}
