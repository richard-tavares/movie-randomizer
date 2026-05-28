const CustomSelect = (() => {
  function init(selectEl) {
    if (!selectEl || selectEl._cselInit) return;
    selectEl._cselInit = true;

    const isPill = selectEl.classList.contains('explore-sort');
    const isSidebar = selectEl.classList.contains('sidebar-select');
    const isMultiple = selectEl.multiple;

    const wrap = document.createElement('div');
    wrap.className = 'csel-wrap' +
      (isPill ? ' csel-pill' : '') +
      (isSidebar ? ' csel-sidebar' : '') +
      (isMultiple ? ' csel-multiple' : '');
    if (selectEl.id) wrap.dataset.cselId = selectEl.id;

    selectEl.parentNode.insertBefore(wrap, selectEl);
    wrap.appendChild(selectEl);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'csel-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const label = document.createElement('span');
    label.className = 'csel-label';

    const caret = document.createElement('i');
    caret.className = 'ph ph-caret-down csel-caret';

    trigger.append(label, caret);
    wrap.appendChild(trigger);

    const dropdown = document.createElement('div');
    dropdown.className = 'csel-dropdown';
    dropdown.setAttribute('role', 'listbox');
    if (isMultiple) dropdown.setAttribute('aria-multiselectable', 'true');
    wrap.appendChild(dropdown);

    function _handleOptionClick(opt) {
      if (isMultiple) {
        if (opt.value === '') {
          Array.from(selectEl.options).forEach(o => { o.selected = false; });
        } else {
          const allOpt = selectEl.options[0];
          if (allOpt?.value === '') allOpt.selected = false;
          opt.selected = !opt.selected;
        }
        buildOptions();
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        updateLabel();
      } else {
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        close();
      }
    }

    function _buildOptionEl(opt, noneSelected) {
      const isSelected = (opt.value === '' && isMultiple) ? noneSelected : opt.selected;
      const item = document.createElement('div');
      item.className = 'csel-option' + (isSelected ? ' selected' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(opt.selected));
      item.dataset.value = opt.value;
      const text = document.createElement('span');
      text.textContent = opt.textContent;
      item.appendChild(text);
      if (isMultiple) {
        const chk = document.createElement('span');
        chk.className = 'csel-checkbox';
        chk.setAttribute('aria-hidden', 'true');
        item.appendChild(chk);
      }
      item.addEventListener('mousedown', e => { e.preventDefault(); _handleOptionClick(opt); });
      return item;
    }

    function buildOptions() {
      const noneSelected = isMultiple && !Array.from(selectEl.options).some(o => o.selected && o.value !== '');
      dropdown.innerHTML = '';
      Array.from(selectEl.options).forEach(opt => dropdown.appendChild(_buildOptionEl(opt, noneSelected)));
    }

    function updateLabel() {
      if (isMultiple) {
        const selected = Array.from(selectEl.options).filter(o => o.selected);
        if (selected.length === 0) {
          label.textContent = selectEl.options[0]?.textContent || '';
        } else if (selected.length === 1) {
          label.textContent = selected[0].textContent;
        } else {
          label.textContent = `${selected.length} selecionados`;
        }
      } else {
        const opt = selectEl.options[selectEl.selectedIndex];
        label.textContent = opt ? opt.textContent : '';
      }
    }

    function open() {
      document.querySelectorAll('.csel-wrap.open').forEach(w => {
        if (w !== wrap) w._cselClose?.();
      });
      buildOptions();
      wrap.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      caret.className = 'ph ph-caret-up csel-caret';
    }

    function close() {
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      caret.className = 'ph ph-caret-down csel-caret';
    }

    wrap._cselClose = close;

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      wrap.classList.contains('open') ? close() : open();
    });

    trigger.addEventListener('blur', () => setTimeout(close, 120));

    document.addEventListener('click', e => {
      if (!wrap.contains(e.target)) close();
    });

    selectEl.addEventListener('change', updateLabel);
    updateLabel();
  }

  function initAll(selector = '.sidebar-select, .explore-sort, .filter-select') {
    document.querySelectorAll(selector).forEach(init);
  }

  return { init, initAll };
})();
