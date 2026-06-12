// ─── Create / Import ──────────────────────────────────────────────────────

function createBlankChecklist() {
  const cl = {
    id:    uid(),
    title: 'Untitled checklist',
    data:  [{ id: uid(), title: 'Section 1', items: [{ id: uid(), label: 'First item', checked: false }] }],
  };
  checklists.unshift(cl);
  persistChecklist(cl);
  renderSidebar();
  loadChecklist(cl.id);
}

function importChecklist() {
  if (!parsedData || !parsedData.sections.length) return;
  const cl = { id: uid(), title: parsedData.title, data: parsedData.sections };
  checklists.unshift(cl);
  persistChecklist(cl);
  renderSidebar();
  closeModal('upload-modal');
  loadChecklist(cl.id);
  showToast('Checklist imported ✓', 'success');
}

// ─── Sidebar ──────────────────────────────────────────────────────────────

function renderSidebar() {
  const el = document.getElementById('sidebar-lists');
  el.innerHTML = '';

  if (!checklists.length) {
    el.innerHTML = '<p style="padding:12px 16px;font-size:12px;color:var(--text3);">No checklists yet.</p>';
    return;
  }

  for (const cl of checklists) {
    const total   = cl.data.reduce((n, s) => n + s.items.length, 0);
    const checked = cl.data.reduce((n, s) => n + s.items.filter(i => i.checked).length, 0);

    const item = document.createElement('div');
    item.className = 'list-item' + (cl.id === activeId ? ' active' : '');
    item.innerHTML = `
      <span class="list-item-icon">☑</span>
      <span class="list-item-name">${esc(cl.title)}</span>
      <span class="list-item-count">${checked}/${total}</span>
    `;
    item.onclick = () => loadChecklist(cl.id);
    el.appendChild(item);
  }
}

function loadChecklist(id) {
  activeId = id;
  const cl = checklists.find(c => c.id === id);
  if (!cl) { showEmptyState(); return; }
  renderChecklist(cl);
  renderSidebar();
  closeSidebar();
}

// ─── Render ───────────────────────────────────────────────────────────────

function renderChecklist(cl) {
  const checklist  = document.getElementById('checklist-view');
  const emptyState = document.getElementById('empty-state');

  const total   = cl.data.reduce((n, s) => n + s.items.length, 0);
  const checked = cl.data.reduce((n, s) => n + s.items.filter(i => i.checked).length, 0);
  const pct     = total ? Math.round(checked / total * 100) : 0;

  checklist.innerHTML = `
    <div class="checklist-meta">
      <div class="progress-bar"><div class="progress-bar-fill" style="width: ${pct}%"></div></div>
      <div class="meta-content">
        <h2 class="checklist-title">
          <span id="checklist-title-display" ondblclick="startEditTitle()">${esc(cl.title)}</span>
          <input class="checklist-title-input" id="checklist-title-input" value="${esc(cl.title)}"
                 onblur="saveTitle()"
                 onkeydown="if(event.key==='Enter') saveTitle()"
                 style="display:none" />
        </h2>
        <div class="meta-pill">${checked} / ${total} done</div>
      </div>
      <button class="btn-icon" title="Reset all" onclick="resetAll()">↻</button>
      <button class="btn-icon danger" title="Delete" onclick="confirmDelete('${cl.id}')">🗑</button>
    </div>
    <div class="sections-container" id="sections"></div>
  `;

  emptyState.style.display  = 'none';
  checklist.style.display   = 'block';

  renderSections(cl);
}

function renderSections(cl) {
  const container = document.getElementById('sections');
  if (!container) return;
  container.innerHTML = '';

  for (let si = 0; si < cl.data.length; si++) {
    const section = cl.data[si];
    const secDiv  = document.createElement('div');
    secDiv.className = 'section';
    secDiv.innerHTML = `
      <div class="section-header" data-si="${si}">
        <h3 class="section-title">
          <span id="sec-title-${si}" ondblclick="startEditSection(${si})">${esc(section.title)}</span>
          <input class="section-title-input" id="sec-input-${si}" value="${esc(section.title)}"
                 onblur="saveSection(${si})"
                 onkeydown="if(event.key==='Enter') saveSection(${si})"
                 style="display:none" />
        </h3>
        <div class="section-count">${section.items.filter(i => i.checked).length}/${section.items.length}</div>
        <button class="btn-icon" title="Add item" onclick="addItem(${si})">+</button>
        <button class="btn-icon" title="Add section below" onclick="addSection()">↓</button>
        <button class="btn-icon danger" title="Delete section" onclick="deleteSection(${si})">−</button>
      </div>
      <div class="items" id="items-${si}"></div>
    `;
    container.appendChild(secDiv);

    const itemsDiv = document.getElementById(`items-${si}`);
    for (let ii = 0; ii < section.items.length; ii++) {
      itemsDiv.appendChild(createItemRow(cl, si, ii));
    }
  }
}

function createItemRow(cl, si, ii) {
  const item = cl.data[si].items[ii];
  const row  = document.createElement('label');
  row.className = 'item' + (item.checked ? ' checked' : '');
  row.setAttribute('data-si', si);
  row.setAttribute('data-ii', ii);
  row.innerHTML = `
    <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${si}, ${ii}, this.checked)" />
    <span class="item-label" id="lbl-${si}-${ii}" ondblclick="startEditItem(${si},${ii})">${esc(item.label)}</span>
    <input class="item-label-input" id="inp-${si}-${ii}" value="${esc(item.label)}"
           onblur="saveItem(${si}, ${ii})"
           onkeydown="if(event.key==='Enter') saveItem(${si}, ${ii})"
           onclick="event.stopPropagation()"
           style="display:none" />
    <button class="item-del" title="Delete"
            onclick="event.stopPropagation(); deleteItem(${si}, ${ii})">✕</button>
  `;
  return row;
}

// ─── Checklist interactions ───────────────────────────────────────────────

function getActive() { return checklists.find(c => c.id === activeId); }

function toggleItem(si, ii, checked) {
  const cl = getActive(); if (!cl) return;
  cl.data[si].items[ii].checked = checked;
  persistChecklist(cl);
  updateHeader(cl);
  renderSidebar();

  const row = document.querySelector(`[data-si="${si}"][data-ii="${ii}"]`);
  if (row) row.classList.toggle('checked', checked);

  const sec      = cl.data[si];
  const countEl  = document.querySelector(`[data-si="${si}"] .section-count`);
  if (countEl) countEl.textContent = `${sec.items.filter(i => i.checked).length}/${sec.items.length}`;
}

function updateHeader(cl) {
  const total   = cl.data.reduce((n, s) => n + s.items.length, 0);
  const checked = cl.data.reduce((n, s) => n + s.items.filter(i => i.checked).length, 0);
  const pct     = total ? Math.round(checked / total * 100) : 0;
  const pill    = document.querySelector('.checklist-meta .meta-pill');
  const fill    = document.querySelector('.progress-bar-fill');
  if (pill) pill.textContent  = `${checked} / ${total} done`;
  if (fill) fill.style.width  = pct + '%';
}

// ─── Inline title editing ─────────────────────────────────────────────────

function startEditTitle() {
  document.getElementById('checklist-title-display').style.display = 'none';
  const inp = document.getElementById('checklist-title-input');
  inp.style.display = 'block'; inp.focus(); inp.select();
}

function saveTitle() {
  const cl  = getActive(); if (!cl) return;
  const val = document.getElementById('checklist-title-input').value.trim() || 'Untitled';
  cl.title  = val;
  document.getElementById('checklist-title-display').textContent   = val;
  document.getElementById('checklist-title-display').style.display = '';
  document.getElementById('checklist-title-input').style.display   = 'none';
  persistChecklist(cl);
  renderSidebar();
}

// ─── Inline section editing ───────────────────────────────────────────────

function startEditSection(si) {
  document.getElementById('sec-title-' + si).style.display = 'none';
  const inp = document.getElementById('sec-input-' + si);
  inp.style.display = 'block'; inp.focus(); inp.select();
}

function saveSection(si) {
  const cl  = getActive(); if (!cl) return;
  const val = document.getElementById('sec-input-' + si).value.trim() || 'Section';
  cl.data[si].title = val;
  document.getElementById('sec-title-' + si).textContent   = val;
  document.getElementById('sec-title-' + si).style.display = '';
  document.getElementById('sec-input-' + si).style.display = 'none';
  persistChecklist(cl);
}

// ─── Inline item editing ──────────────────────────────────────────────────

function startEditItem(si, ii) {
  document.getElementById(`lbl-${si}-${ii}`).style.display = 'none';
  const inp = document.getElementById(`inp-${si}-${ii}`);
  inp.style.display = 'block'; inp.focus(); inp.select();
}

function saveItem(si, ii) {
  const cl  = getActive(); if (!cl) return;
  const val = document.getElementById(`inp-${si}-${ii}`).value.trim();
  if (!val) { deleteItem(si, ii); return; }
  cl.data[si].items[ii].label = val;
  document.getElementById(`lbl-${si}-${ii}`).textContent   = val;
  document.getElementById(`lbl-${si}-${ii}`).style.display = '';
  document.getElementById(`inp-${si}-${ii}`).style.display = 'none';
  persistChecklist(cl);
}

// ─── Add / delete ─────────────────────────────────────────────────────────

function addItem(si) {
  const cl = getActive(); if (!cl) return;
  cl.data[si].items.push({ id: uid(), label: 'New item', checked: false });
  persistChecklist(cl);
  renderSections(cl); updateHeader(cl); renderSidebar();
  const ii = cl.data[si].items.length - 1;
  setTimeout(() => startEditItem(si, ii), 30);
}

function addSection() {
  const cl = getActive(); if (!cl) return;
  cl.data.push({ id: uid(), title: 'New section', items: [{ id: uid(), label: 'New item', checked: false }] });
  persistChecklist(cl);
  renderSections(cl); renderSidebar();
  const si = cl.data.length - 1;
  setTimeout(() => startEditSection(si), 30);
}

function deleteItem(si, ii) {
  const cl = getActive(); if (!cl) return;
  cl.data[si].items.splice(ii, 1);
  persistChecklist(cl);
  renderSections(cl); updateHeader(cl); renderSidebar();
}

function deleteSection(si) {
  const cl = getActive(); if (!cl) return;
  if (cl.data.length === 1) { showToast('At least one section required.'); return; }
  cl.data.splice(si, 1);
  persistChecklist(cl);
  renderSections(cl); updateHeader(cl); renderSidebar();
}

function resetAll() {
  const cl = getActive(); if (!cl) return;
  if (!confirm('Reset all checkboxes? This cannot be undone.')) return;
  cl.data.forEach(s => s.items.forEach(i => i.checked = false));
  persistChecklist(cl);
  renderChecklist(cl); renderSidebar();
  showToast('All checkboxes reset.');
}

function confirmDelete(id) {
  if (confirm('Delete this checklist?')) deleteChecklist(id);
}
