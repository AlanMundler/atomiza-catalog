import { describe, it, expect, beforeEach } from 'vitest';
import { syncSelectedSizeClass } from '@/utils/size-selector';

function renderTwoSizes(): HTMLInputElement[] {
  document.body.innerHTML = `
    <label class="size-option size-option--selected"><input type="radio" name="size" value="5" checked></label>
    <label class="size-option"><input type="radio" name="size" value="100"></label>
  `;
  return Array.from(document.querySelectorAll('input[name="size"]')) as HTMLInputElement[];
}

describe('syncSelectedSizeClass', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('mueve la marca al talle recién marcado', () => {
    const inputs = renderTwoSizes();
    inputs[0].checked = false;
    inputs[1].checked = true;
    syncSelectedSizeClass(inputs);
    const labels = Array.from(document.querySelectorAll('label'));
    expect(labels[0].classList.contains('size-option--selected')).toBe(false);
    expect(labels[1].classList.contains('size-option--selected')).toBe(true);
  });

  it('no rompe si un input está fuera de un label', () => {
    const inputs = renderTwoSizes();
    const orphan = document.createElement('input');
    orphan.type = 'radio';
    orphan.checked = true;
    document.body.appendChild(orphan);
    expect(() => syncSelectedSizeClass([...inputs, orphan])).not.toThrow();
  });
});
