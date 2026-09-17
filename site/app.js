/* Sundar Traders order app (mock-first).
 * Products load through ONE fetch call (DATA_URL) so the Google Sheet
 * backend can replace products.json later without touching this file.
 * Orders are kept client-side for now: WhatsApp send + printable receipt
 * + localStorage copy. A placeOrder endpoint can hook into submitOrder later.
 */
var DATA_URL = 'products.json';
var WHATSAPP = '919600219655';

var state = { products: [], qty: {}, category: 'All', query: '' };

function rupees(n) {
  n = Math.round((Number(n) || 0) * 100) / 100;
  return '₹' + n.toLocaleString('en-IN');
}

function easyText(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
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

function setQty(id, value) {
  var n = Math.floor(Number(value) || 0);
  if (n < 0) n = 0;
  if (n > 500) n = 500;
  if (n === 0) delete state.qty[id];
  else state.qty[id] = n;
  var cards = document.querySelectorAll('.item'), card = null, i;
  for (i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute('data-id') === id) { card = cards[i]; break; }
  }
  var p = null;
  state.products.forEach(function (x) { if (x.id === id) p = x; });
  if (card && p) {
    card.querySelector('.qty input').value = String(n);
    card.querySelector('.net strong').textContent = rupees(p.price * n);
    card.setAttribute('data-qty', String(n));
  }
  renderSummary();
}

function matches(p) {
  if (state.category !== 'All' && p.category !== state.category) return false;
  var q = state.query.trim().toLowerCase();
  if (!q) return true;
  return (p.name + ' ' + p.id + ' ' + p.category + ' ' + (p.pack || '')).toLowerCase().indexOf(q) !== -1;
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

function renderItem(p) {
  var q = Number(state.qty[p.id] || 0);
  var card = document.createElement('article');
  card.className = 'item';
  card.setAttribute('data-id', p.id);
  card.setAttribute('data-qty', String(q));

  var photo = document.createElement('img');
  photo.src = p.img;
  photo.alt = easyText(p.category);
  photo.loading = 'lazy';
  card.appendChild(photo);

  var info = document.createElement('div');
  info.className = 'info';
  var name = document.createElement('div');
  name.className = 'name';
  var id = document.createElement('span');
  id.className = 'id';
  id.textContent = '#' + p.id;
  name.appendChild(id);
  var nameText = document.createElement('span');
  nameText.textContent = easyText(p.name);
  name.appendChild(nameText);
  if (p.pack) {
    var pack = document.createElement('span');
    pack.className = 'pack';
    pack.textContent = p.pack;
    name.appendChild(pack);
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
  info.appendChild(name);
  info.appendChild(prices);
  card.appendChild(info);

  var side = document.createElement('div');
  side.className = 'side';
  var qty = document.createElement('div');
  qty.className = 'qty';
  var minus = document.createElement('button');
  minus.type = 'button';
  minus.setAttribute('aria-label', 'Decrease');
  minus.textContent = '−';
  minus.addEventListener('click', function () { setQty(p.id, (state.qty[p.id] || 0) - 1); });
  var input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.max = '500';
  input.value = String(q);
  input.setAttribute('aria-label', 'Quantity');
  input.addEventListener('change', function () { setQty(p.id, input.value); });
  var plus = document.createElement('button');
  plus.type = 'button';
  plus.setAttribute('aria-label', 'Increase');
  plus.textContent = '+';
  plus.addEventListener('click', function () { setQty(p.id, (state.qty[p.id] || 0) + 1); });
  qty.appendChild(minus);
  qty.appendChild(input);
  qty.appendChild(plus);
  side.appendChild(qty);

  var net = document.createElement('div');
  net.className = 'net';
  net.appendChild(document.createTextNode('Net '));
  var right = document.createElement('strong');
  right.textContent = rupees(p.price * q);
  net.appendChild(right);
  side.appendChild(net);
  card.appendChild(side);

  return card;
}

function renderCatalog() {
  var root = document.getElementById('catalog');
  root.innerHTML = '';
  var groups = [], map = {};
  state.products.filter(matches).forEach(function (p) {
    if (!map[p.category]) { map[p.category] = []; groups.push(p.category); }
    map[p.category].push(p);
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
    var list = document.createElement('div');
    list.className = 'list';
    map[cat].forEach(function (p) { list.appendChild(renderItem(p)); });
    root.appendChild(list);
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
    name.textContent = i.name + (i.item ? ' (' + i.item + ')' : '');
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
    left.textContent = i.qty + ' × ' + i.name + (i.item ? ' (' + i.item + ')' : '');
    var right = document.createElement('span');
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

function render() {
  renderChips();
  renderCatalog();
  renderSummary();
}

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

function customerData() {
  var t = totals();
  return {
    name: document.getElementById('custName').value.trim(),
    phone: document.getElementById('custPhone').value.replace(/\D/g, ''),
    address: document.getElementById('custAddress').value.trim(),
    notes: document.getElementById('custNotes').value.trim(),
    items: t.items.map(function (i) { return { id: i.id, qty: i.qty }; })
  };
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
  var data = customerData();
  var t = totals();
  // MOCK order: no server yet. placeOrder(endpoint) can replace this block later.
  var result = {
    orderId: 'ST-' + Date.now().toString().slice(-6),
    netTotal: t.net,
    mrpTotal: t.mrp,
    savings: t.savings,
    items: t.items,
    customer: data
  };
  try {
    var saved = JSON.parse(localStorage.getItem('crackerOrders') || '[]');
    saved.push({ at: new Date().toISOString(), order: result });
    localStorage.setItem('crackerOrders', JSON.stringify(saved));
  } catch (e) {}
  btn.disabled = false;
  btn.textContent = 'Place order';
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
  render();
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
  render();
}).catch(function () {
  document.getElementById('catalog').innerHTML =
    '<div class="empty">Could not load products. Please refresh.</div>';
});
