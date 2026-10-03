/* Design prototype JS — same order flow as the main build, card-grid rendering.
 * Products via ONE fetch (products.json). Prototype data: 12 sample items.
 */
var DATA_URL = 'products.json';
var WHATSAPP = '919600219655';

var state = { products: [], qty: {}, category: 'All', query: '', sel: {} };

/* Variant-family pilot: SPARKLERS grouped by colour/effect. One card per
 * colour, dropdown picks the size (7/10/12/15/30/50 Cm). Variant ids stay
 * the order/Sheets unit, so totals, bar, modal and checkout are untouched. */
var FAMILIES = [
  { id: 'fam-spark-electric', category: 'SPARKLERS', name: 'Sparklers Electric', variantIds: ['1', '3', '7', '11', '15', '19'] },
  { id: 'fam-spark-colour', category: 'SPARKLERS', name: 'Sparklers Colour', variantIds: ['2', '4', '8', '12', '16'] },
  { id: 'fam-spark-green', category: 'SPARKLERS', name: 'Sparklers Green', variantIds: ['5', '9', '13', '17'] },
  { id: 'fam-spark-red', category: 'SPARKLERS', name: 'Sparklers Red', variantIds: ['6', '10', '14', '18'] }
];

var GROUPED_IDS = {};
FAMILIES.forEach(function (f) {
  f.variantIds.forEach(function (id) { GROUPED_IDS[id] = f.id; });
});

function productById(id) {
  for (var i = 0; i < state.products.length; i++) {
    if (state.products[i].id === id) return state.products[i];
  }
  return null;
}

function familyById(fid) {
  for (var i = 0; i < FAMILIES.length; i++) {
    if (FAMILIES[i].id === fid) return FAMILIES[i];
  }
  return null;
}

function selectedVariant(fam) {
  var id = state.sel[fam.id];
  if (id && fam.variantIds.indexOf(id) !== -1) return productById(id);
  return productById(fam.variantIds[0]);
}

function sizeLabel(p) {
  var m = String(p.name).match(/^\s*(\d+\s*CM)/i);
  return m ? easyText(m[1]) : easyText(p.name);
}

function rupees(n) {
  n = Math.round((Number(n) || 0) * 100) / 100;
  return '₹' + n.toLocaleString('en-IN');
}

function easyText(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}

function offPct(p) {
  if (!p.mrp || p.mrp <= p.price) return 0;
  return Math.round((1 - p.price / p.mrp) * 100);
}

function selectedItems() {
  var out = [];
  state.products.forEach(function (p) {
    var q = Number(state.qty[p.id] || 0);
    if (q > 0) {
      out.push({
        id: p.id, name: p.name, qty: q, mrp: p.mrp, price: p.price,
        pack: p.pack || '',
        net: Math.round(p.price * q * 100) / 100,
        mrpTotal: Math.round(p.mrp * q * 100) / 100
      });
    }
  });
  return out;
}

function totals() {
  var items = selectedItems(), mrp = 0, net = 0, count = 0;
  items.forEach(function (i) { mrp += i.mrpTotal; net += i.net; count += i.qty; });
  return { items: items, mrp: mrp, net: net, count: count, savings: mrp - net };
}

function refreshCard(id) {
  var n = Number(state.qty[id] || 0);
  var cards = document.querySelectorAll('.card'), i, card = null;
  for (i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute('data-id') === id) { card = cards[i]; break; }
  }
  if (!card) return;
  card.setAttribute('data-qty', String(n));
  var p = null;
  state.products.forEach(function (x) { if (x.id === id) p = x; });
  var buy = card.querySelector('.buy');
  buy.innerHTML = '';
  buy.appendChild(n === 0 ? addBtn(p) : stepper(p, n));
  renderSummary();
}

function setQty(id, value) {
  var n = Math.floor(Number(value) || 0);
  if (n < 0) n = 0;
  if (n > 500) n = 500;
  if (n === 0) delete state.qty[id];
  else state.qty[id] = n;
  if (GROUPED_IDS[id]) refreshFamily(GROUPED_IDS[id]);
  else refreshCard(id);
}

function addBtn(p) {
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'add-btn';
  b.textContent = 'Add +';
  b.addEventListener('click', function () { setQty(p.id, 1); });
  return b;
}

function stepper(p, n) {
  var wrap = document.createElement('div');
  wrap.className = 'qty';
  var minus = document.createElement('button');
  minus.type = 'button';
  minus.setAttribute('aria-label', 'Decrease');
  minus.textContent = '−';
  minus.addEventListener('click', function () { setQty(p.id, n - 1); });
  var input = document.createElement('input');
  input.value = String(n);
  input.inputMode = 'numeric';
  input.setAttribute('aria-label', 'Quantity');
  input.addEventListener('change', function () { setQty(p.id, input.value); });
  var plus = document.createElement('button');
  plus.type = 'button';
  plus.setAttribute('aria-label', 'Increase');
  plus.textContent = '+';
  plus.addEventListener('click', function () { setQty(p.id, n + 1); });
  wrap.appendChild(minus);
  wrap.appendChild(input);
  wrap.appendChild(plus);
  return wrap;
}

function matches(p) {
  if (state.category !== 'All' && p.category !== state.category) return false;
  var q = state.query.trim().toLowerCase();
  if (!q) return true;
  return (p.name + ' ' + p.id + ' ' + p.category + ' ' + (p.pack || '')).toLowerCase().indexOf(q) !== -1;
}

function matchesFamily(fam) {
  if (state.category !== 'All' && fam.category !== state.category) return false;
  var q = state.query.trim().toLowerCase();
  if (!q) return true;
  if ((fam.name + ' ' + fam.category).toLowerCase().indexOf(q) !== -1) return true;
  return fam.variantIds.some(function (id) {
    var p = productById(id);
    return p && (p.name + ' ' + p.id + ' ' + (p.pack || '')).toLowerCase().indexOf(q) !== -1;
  });
}

function familyMatchVariant(fam) {
  var q = state.query.trim().toLowerCase();
  if (!q) return null;
  for (var i = 0; i < fam.variantIds.length; i++) {
    var p = productById(fam.variantIds[i]);
    if (p && (p.name + ' ' + p.id + ' ' + (p.pack || '')).toLowerCase().indexOf(q) !== -1) return p;
  }
  return null;
}

function renderChips() {
  var cats = ['All'];
  state.products.forEach(function (p) {
    if (cats.indexOf(p.category) === -1) cats.push(p.category);
  });
  var root = document.getElementById('chips');
  root.innerHTML = '';
  cats.forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (state.category === c ? ' active' : '');
    b.textContent = c === 'All' ? 'All' : easyText(c);
    b.addEventListener('click', function () {
      state.category = c;
      renderChips();
      renderCatalog();
      var target = document.querySelector('.cat-title') || document.getElementById('catalog');
      var toolbar = document.querySelector('.toolbar');
      var off = (toolbar ? toolbar.offsetHeight : 120) + 2;
      if (target) {
        var y = target.getBoundingClientRect().top + window.scrollY - off;
        window.scrollTo({ top: y < 0 ? 0 : y, behavior: 'smooth' });
      }
    });
    root.appendChild(b);
  });
}

function renderCard(p) {
  var q = Number(state.qty[p.id] || 0);
  var card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('data-id', p.id);
  card.setAttribute('data-qty', String(q));

  var photo = document.createElement('div');
  photo.className = 'photo';
  var img = document.createElement('img');
  img.src = p.img;
  img.alt = easyText(p.name);
  img.loading = 'lazy';
  photo.appendChild(img);
  var off = offPct(p);
  if (off > 0) {
    var badge = document.createElement('span');
    badge.className = 'off';
    badge.textContent = '−' + off + '%';
    photo.appendChild(badge);
  }
  card.appendChild(photo);

  var body = document.createElement('div');
  body.className = 'card-body';
  var name = document.createElement('div');
  name.className = 'name';
  name.textContent = easyText(p.name);
  body.appendChild(name);
  if (p.pack) {
    var pack = document.createElement('div');
    pack.className = 'pack';
    pack.textContent = p.pack;
    body.appendChild(pack);
  }
  var prices = document.createElement('div');
  prices.className = 'prices';
  var mrp = document.createElement('s');
  mrp.textContent = rupees(p.mrp);
  var now = document.createElement('span');
  now.className = 'now';
  now.textContent = rupees(p.price);
  prices.appendChild(mrp);
  prices.appendChild(now);
  body.appendChild(prices);

  var buy = document.createElement('div');
  buy.className = 'buy';
  buy.appendChild(q === 0 ? addBtn(p) : stepper(p, q));
  body.appendChild(buy);

  card.appendChild(body);
  return card;
}

function selectVariant(fid, vid) {
  var fam = familyById(fid);
  if (!fam || fam.variantIds.indexOf(vid) === -1) return;
  state.sel[fid] = vid;
  refreshFamily(fid);
}

function refreshFamily(fid) {
  var fam = familyById(fid);
  if (!fam) return;
  var cards = document.querySelectorAll('.card'), i, card = null;
  for (i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute('data-family') === fid) { card = cards[i]; break; }
  }
  if (!card) return;
  var p = selectedVariant(fam);
  var q = Number(state.qty[p.id] || 0);
  card.setAttribute('data-qty', String(q));
  var sel = card.querySelector('.vsel');
  if (sel) {
    sel.value = p.id;
    for (i = 0; i < sel.options.length; i++) {
      (function (opt) {
        var vp = productById(opt.value);
        if (!vp) return;
        var vq = Number(state.qty[opt.value] || 0);
        opt.textContent = sizeLabel(vp) + (vq > 0 ? ' ·' + vq : '');
      })(sel.options[i]);
    }
  }
  var mrp = card.querySelector('.prices s');
  var now = card.querySelector('.prices .now');
  if (mrp) mrp.textContent = rupees(p.mrp);
  if (now) now.textContent = rupees(p.price);
  var badge = card.querySelector('.photo .off');
  if (badge) badge.textContent = '−' + offPct(p) + '%';
  var buy = card.querySelector('.buy');
  buy.innerHTML = '';
  buy.appendChild(q === 0 ? addBtn(p) : stepper(p, q));
  renderSummary();
}

function renderFamilyCard(fam) {
  var hit = familyMatchVariant(fam);
  if (hit) state.sel[fam.id] = hit.id;
  var p = selectedVariant(fam);
  var q = Number(state.qty[p.id] || 0);
  var card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('data-family', fam.id);
  card.setAttribute('data-qty', String(q));

  var photo = document.createElement('div');
  photo.className = 'photo';
  var img = document.createElement('img');
  img.src = (productById(fam.variantIds[0]) || {}).img || '';
  img.alt = fam.name;
  img.loading = 'lazy';
  photo.appendChild(img);
  var off = offPct(p);
  if (off > 0) {
    var badge = document.createElement('span');
    badge.className = 'off';
    badge.textContent = '−' + off + '%';
    photo.appendChild(badge);
  }
  card.appendChild(photo);

  var body = document.createElement('div');
  body.className = 'card-body';
  var head = document.createElement('div');
  head.className = 'fam-head';
  var name = document.createElement('div');
  name.className = 'name';
  name.textContent = fam.name;
  head.appendChild(name);
  var sel = document.createElement('select');
  sel.className = 'vsel';
  sel.setAttribute('aria-label', 'Choose variant');
  fam.variantIds.forEach(function (vid) {
    var vp = productById(vid);
    if (!vp) return;
    var opt = document.createElement('option');
    opt.value = vid;
    var vq = Number(state.qty[vid] || 0);
    opt.textContent = sizeLabel(vp) + (vq > 0 ? ' ·' + vq : '');
    sel.appendChild(opt);
  });
  sel.value = p.id;
  sel.addEventListener('change', function () { selectVariant(fam.id, sel.value); });
  head.appendChild(sel);
  body.appendChild(head);
  if (p.pack) {
    var pack = document.createElement('div');
    pack.className = 'pack';
    pack.textContent = p.pack;
    body.appendChild(pack);
  }
  var prices = document.createElement('div');
  prices.className = 'prices';
  var mrp = document.createElement('s');
  mrp.textContent = rupees(p.mrp);
  var now = document.createElement('span');
  now.className = 'now';
  now.textContent = rupees(p.price);
  prices.appendChild(mrp);
  prices.appendChild(now);
  body.appendChild(prices);

  var buy = document.createElement('div');
  buy.className = 'buy';
  buy.appendChild(q === 0 ? addBtn(p) : stepper(p, q));
  body.appendChild(buy);

  card.appendChild(body);
  return card;
}

function renderCatalog() {
  var root = document.getElementById('catalog');
  root.innerHTML = '';
  var groups = [], map = {};
  function push(cat, entry) {
    if (!map[cat]) { map[cat] = []; groups.push(cat); }
    map[cat].push(entry);
  }
  FAMILIES.filter(matchesFamily).forEach(function (fam) {
    push(fam.category, { kind: 'family', fam: fam });
  });
  state.products.filter(function (p) { return !GROUPED_IDS[p.id] && matches(p); }).forEach(function (p) {
    push(p.category, { kind: 'product', product: p });
  });
  if (!groups.length) {
    var empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No crackers match your search.';
    root.appendChild(empty);
    return;
  }
  groups.forEach(function (cat) {
    var h = document.createElement('div');
    h.className = 'cat-title';
    h.textContent = easyText(cat);
    root.appendChild(h);
    var grid = document.createElement('div');
    grid.className = 'grid';
    map[cat].forEach(function (e) { grid.appendChild(e.kind === 'family' ? renderFamilyCard(e.fam) : renderCard(e.product)); });
    root.appendChild(grid);
  });
}

function renderSummary() {
  var t = totals();
  var box = document.getElementById('orderSummary');
  box.innerHTML = '';
  function line(k, v, cls) {
    var d = document.createElement('div');
    d.className = 'sum-line' + (cls ? ' ' + cls : '');
    var a = document.createElement('span'); a.textContent = k;
    var b = document.createElement('span'); b.textContent = v;
    d.appendChild(a); d.appendChild(b);
    box.appendChild(d);
  }
  line('Items', String(t.count));
  line('MRP total', rupees(t.mrp));
  line('You save', rupees(t.savings));
  line('Net total', rupees(t.net), 'grand');
  document.getElementById('barCount').textContent = t.count + (t.count === 1 ? ' item' : ' items');
  document.getElementById('barTotal').textContent = rupees(t.net);
  var link = document.getElementById('detailsLink');
  link.style.display = t.count ? '' : 'none';
  link.textContent = 'View order details (' + t.count + (t.count === 1 ? ' item' : ' items') + ')';
  renderBarItems();
  renderBarVisibility();
}

function changeModalQty(id, value) {
  setQty(id, value);
  if (!totals().count) document.getElementById('orderModal').classList.remove('open');
  else renderModal();
}

function renderModal() {
  var t = totals();
  var box = document.getElementById('orderModalBox');
  box.innerHTML = '';
  var h = document.createElement('h3');
  h.textContent = 'Your order (' + t.count + (t.count === 1 ? ' item' : ' items') + ')';
  box.appendChild(h);
  var list = document.createElement('div');
  list.className = 'modal-list';
  box.appendChild(list);
  t.items.forEach(function (i) {
    var row = document.createElement('div');
    row.className = 'modal-item';
    var name = document.createElement('div');
    name.className = 'modal-name';
    name.textContent = easyText(i.name) + (i.pack ? ' (' + i.pack + ')' : '');
    var unit = document.createElement('span');
    unit.className = 'modal-unit';
    unit.textContent = ' · ' + rupees(i.price) + ' each';
    name.appendChild(unit);
    row.appendChild(name);
    var ctl = document.createElement('div');
    ctl.className = 'modal-ctl';
    var minus = document.createElement('button');
    minus.type = 'button';
    minus.className = 'step';
    minus.setAttribute('aria-label', 'Decrease');
    minus.textContent = '−';
    minus.addEventListener('click', function () { changeModalQty(i.id, i.qty - 1); });
    var q = document.createElement('span');
    q.className = 'modal-q';
    q.textContent = String(i.qty);
    var plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'step';
    plus.setAttribute('aria-label', 'Increase');
    plus.textContent = '+';
    plus.addEventListener('click', function () { changeModalQty(i.id, i.qty + 1); });
    var net = document.createElement('span');
    net.className = 'modal-net';
    net.textContent = rupees(i.net);
    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'modal-del';
    del.setAttribute('aria-label', 'Remove item');
    del.textContent = '✕';
    del.addEventListener('click', function () { changeModalQty(i.id, 0); });
    ctl.appendChild(minus);
    ctl.appendChild(q);
    ctl.appendChild(plus);
    ctl.appendChild(net);
    ctl.appendChild(del);
    row.appendChild(ctl);
    list.appendChild(row);
  });
  var foot = document.createElement('div');
  foot.className = 'modal-foot';
  box.appendChild(foot);
  var total = document.createElement('div');
  total.className = 'modal-total';
  var a = document.createElement('span'); a.textContent = 'Net total';
  var b = document.createElement('span'); b.textContent = rupees(t.net);
  total.appendChild(a); total.appendChild(b);
  foot.appendChild(total);
  var close = document.createElement('button');
  close.type = 'button';
  close.className = 'modal-close';
  close.textContent = 'Close';
  close.addEventListener('click', function () {
    document.getElementById('orderModal').classList.remove('open');
  });
  foot.appendChild(close);
}

function summaryMostlyVisible() {
  var s = document.getElementById('orderSummary');
  if (!s) return false;
  var r = s.getBoundingClientRect();
  if (r.height <= 0) return false;
  var vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  return vis >= r.height * 0.5;
}

function renderBarVisibility() {
  var t = totals();
  var show = (t.count && !summaryMostlyVisible());
  var bar = document.getElementById('bar');
  bar.classList.toggle('show', !!show);
  if (!t.count) bar.classList.remove('open');
}

function renderBarItems() {
  var t = totals();
  var box = document.querySelector('#barItems .bar-items-in');
  box.innerHTML = '';
  t.items.forEach(function (i) {
    var row = document.createElement('div');
    row.className = 'bar-item';
    var left = document.createElement('span');
    left.textContent = i.qty + ' × ' + easyText(i.name) + (i.pack ? ' (' + i.pack + ')' : '');
    var right = document.createElement('span');
    right.className = 'qr';
    right.textContent = rupees(i.net);
    row.appendChild(left);
    row.appendChild(right);
    box.appendChild(row);
  });
}

window.addEventListener('scroll', renderBarVisibility, { passive: true });

var lastBarY = window.scrollY || 0;
window.addEventListener('scroll', function () {
  var y = window.scrollY || 0;
  if (Math.abs(y - lastBarY) > 5) document.getElementById('bar').classList.remove('open');
  lastBarY = y;
}, { passive: true });

function validate() {
  var name = document.getElementById('custName').value.trim();
  var phone = document.getElementById('custPhone').value.replace(/\D/g, '');
  var address = document.getElementById('custAddress').value.trim();
  var t = totals();
  if (!t.count) return 'Add quantity for at least one cracker.';
  if (name.length < 2) return 'Please enter your name.';
  if (!/^[6-9]\d{9}$/.test(phone)) return 'Enter a valid 10-digit mobile number.';
  if (address.length < 8) return 'Please enter your full address.';
  return '';
}

function showSuccess(result) {
  document.getElementById('shopView').style.display = 'none';
  document.getElementById('bar').classList.remove('show');
  document.getElementById('successView').style.display = 'block';
  document.getElementById('successId').textContent = result.orderId;
  var body = document.getElementById('successBody');
  body.innerHTML = '';
  var t = document.createElement('p');
  t.textContent = 'Net total ' + rupees(result.netTotal);
  body.appendChild(t);
  var ul = document.createElement('p');
  ul.textContent = (result.items || []).map(function (i) {
    return i.qty + ' × ' + easyText(i.name) + (i.pack ? ' (' + i.pack + ')' : '');
  }).join(', ');
  body.appendChild(ul);
  var wa = document.getElementById('waLink');
  var text = 'Order ' + result.orderId +
    '\nName: ' + result.customer.name +
    '\nMobile: ' + result.customer.phone +
    '\nAddress: ' + result.customer.address +
    '\nTotal: ' + rupees(result.netTotal);
  wa.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text);
  wa.hidden = false;
  window.scrollTo(0, 0);
}

function submitOrder() {
  var err = validate();
  var box = document.getElementById('formError');
  box.textContent = err;
  if (err) {
    document.getElementById('checkout').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  var btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  var t = totals();
  var result = {
    orderId: 'ST-' + Date.now().toString().slice(-6),
    netTotal: t.net, mrpTotal: t.mrp, savings: t.savings,
    items: t.items,
    customer: {
      name: document.getElementById('custName').value.trim(),
      phone: document.getElementById('custPhone').value.replace(/\D/g, ''),
      address: document.getElementById('custAddress').value.trim(),
      notes: document.getElementById('custNotes').value.trim()
    }
  };
  btn.disabled = false;
  btn.textContent = 'Place order 🪔';
  showSuccess(result);
}

function syncSearchIcons() {
  var has = !!document.getElementById('search').value;
  document.getElementById('searchMag').style.display = has ? 'none' : '';
  document.getElementById('searchClear').style.display = has ? '' : 'none';
}

document.getElementById('search').addEventListener('input', function (e) {
  state.query = e.target.value;
  syncSearchIcons();
  renderCatalog();
});
document.getElementById('searchClear').addEventListener('click', function () {
  var input = document.getElementById('search');
  input.value = '';
  state.query = '';
  syncSearchIcons();
  renderCatalog();
  input.focus();
});
document.getElementById('submitBtn').addEventListener('click', submitOrder);
document.getElementById('detailsLink').addEventListener('click', function () {
  renderModal();
  document.getElementById('orderModal').classList.add('open');
});
document.getElementById('orderModal').addEventListener('click', function (e) {
  if (e.target === this) this.classList.remove('open');
});
document.getElementById('bar').addEventListener('click', function (e) {
  if (e.target.closest && e.target.closest('#barCta')) return;
  document.getElementById('bar').classList.toggle('open');
});
document.getElementById('barCta').addEventListener('click', function () {
  document.getElementById('bar').classList.remove('open');
  document.getElementById('checkout').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.addEventListener('click', function (e) {
  var bar = document.getElementById('bar');
  if (bar.classList.contains('open') && !(e.target.closest && e.target.closest('#bar'))) {
    bar.classList.remove('open');
  }
});
document.getElementById('homeBtn').addEventListener('click', function () {
  state.qty = {};
  document.getElementById('successView').style.display = 'none';
  document.getElementById('shopView').style.display = '';
  document.getElementById('formError').textContent = '';
  renderChips();
  renderCatalog();
  renderSummary();
  window.scrollTo(0, 0);
});
document.getElementById('printOrder').addEventListener('click', function () {
  document.body.classList.add('receipt');
  window.print();
  document.body.classList.remove('receipt');
});

fetch(DATA_URL).then(function (res) {
  if (!res.ok) throw new Error('products load failed');
  return res.json();
}).then(function (products) {
  state.products = products;
  renderChips();
  renderCatalog();
  renderSummary();
}).catch(function () {
  document.getElementById('catalog').innerHTML =
    '<div class="empty">Could not load products. Please refresh.</div>';
});
