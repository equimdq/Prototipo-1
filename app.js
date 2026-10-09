const KEY = 'registro-envios-demo-v1';
const $ = (id) => document.getElementById(id);
const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const shiftDate = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const demoClients = ['Cliente Norte', 'Cliente Sur', 'Cliente Centro', 'Cliente Costa', 'Cliente Oeste'];
function seed() {
  const rows = [];
  for (let offset = 29; offset >= 0; offset--) {
    const day = shiftDate(todayISO(), -offset);
    demoClients.forEach((client, i) => {
      let qty = 48 + ((offset * 13 + i * 29) % 115);
      if ((offset + i) % 11 === 0) qty = 0;
      rows.push({ fecha: day, cliente: client, cantidad: qty });
    });
  }
  return rows;
}
function loadRows() {
  try { const value = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(value) ? value : seed(); }
  catch { return seed(); }
}
let rows = loadRows();
if (!localStorage.getItem(KEY)) saveRows();
function saveRows() { localStorage.setItem(KEY, JSON.stringify(rows)); }
function formatNumber(n) { return new Intl.NumberFormat('es-AR').format(n); }
function formatDate(iso) { return new Intl.DateTimeFormat('es-AR', {day:'2-digit', month:'short', year:'numeric'}).format(new Date(`${iso}T12:00:00`)); }
function uniqueClients() { return [...new Set(rows.map(r => r.cliente))].sort((a,b) => a.localeCompare(b, 'es')); }
function fillClientOptions() {
  const all = uniqueClients();
  const filter = $('clientFilter'); const previous = filter.value;
  filter.innerHTML = '<option value="">Todos los clientes</option>' + all.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
  if (all.includes(previous)) filter.value = previous;
  const entry = $('entryClient'); const current = entry.value;
  entry.innerHTML = all.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('') + '<option value="__new">Agregar cliente…</option>';
  if (all.includes(current)) entry.value = current;
  toggleNewClient();
}
function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function filteredRows() {
  const from = $('dateFrom').value, to = $('dateTo').value, client = $('clientFilter').value;
  return rows.filter(r => (!from || r.fecha >= from) && (!to || r.fecha <= to) && (!client || r.cliente === client));
}
function dailyChart(items) {
  const node = $('dailyChart');
  if (!items.length) { node.innerHTML = '<p class="empty">Sin datos para mostrar.</p>'; return; }
  const byDay = new Map(); items.forEach(r => byDay.set(r.fecha, (byDay.get(r.fecha) || 0) + Number(r.cantidad)));
  const dates = [...byDay.keys()].sort(); const vals = dates.map(d => byDay.get(d));
  const w = 600, h = 190, pad = {l:10,r:10,t:12,b:28};
  const max = Math.max(1, ...vals); const x = i => pad.l + (dates.length < 2 ? 0 : i * (w-pad.l-pad.r)/(dates.length-1));
  const y = v => h-pad.b - (v/max)*(h-pad.t-pad.b);
  const pts = vals.map((v,i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${x(0)},${h-pad.b} ${pts} ${x(vals.length-1)},${h-pad.b}`;
  const ticks = [0, .5, 1].map(p => { const yy = y(max*p); return `<line class="grid-line" x1="${pad.l}" y1="${yy}" x2="${w-pad.r}" y2="${yy}"/><text class="axis-label" x="${pad.l}" y="${yy-3}">${formatNumber(Math.round(max*p))}</text>`; }).join('');
  const labelAt = [0, Math.floor((dates.length-1)/2), dates.length-1].filter((v,i,a) => a.indexOf(v)===i).map(i => `<text class="axis-label" text-anchor="${i===0?'start':i===dates.length-1?'end':'middle'}" x="${x(i)}" y="${h-5}">${formatDate(dates[i]).replace(/ de \d{4}/,'')}</text>`).join('');
  const circles = vals.map((v,i) => dates.length <= 15 ? `<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="3"><title>${formatDate(dates[i])}: ${formatNumber(v)}</title></circle>` : '').join('');
  node.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Gráfico de envíos por día"><defs><linearGradient id="fade" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#78bd91" stop-opacity=".32"/><stop offset="100%" stop-color="#78bd91" stop-opacity="0"/></linearGradient></defs>${ticks}<polygon class="area-path" points="${area}"/><polyline class="line-path" points="${pts}"/>${circles}${labelAt}</svg>`;
}
function render() {
  fillClientOptions();
  const items = filteredRows();
  const total = items.reduce((a,r) => a + Number(r.cantidad), 0);
  const active = new Set(items.filter(r => Number(r.cantidad) > 0).map(r => r.cliente)).size;
  const days = $('dateFrom').value && $('dateTo').value ? Math.max(1, Math.round((new Date(`${$('dateTo').value}T12:00:00`) - new Date(`${$('dateFrom').value}T12:00:00`))/86400000)+1) : 1;
  $('totalMetric').textContent = formatNumber(total);
  $('clientsMetric').textContent = formatNumber(active);
  $('averageMetric').textContent = formatNumber(Math.round(total/days));
  dailyChart(items);
  const sum = new Map(); items.forEach(r => sum.set(r.cliente, (sum.get(r.cliente)||0)+Number(r.cantidad)));
  const ranked = [...sum.entries()].sort((a,b) => b[1]-a[1]); const max = Math.max(1,...ranked.map(x=>x[1]));
  $('clientChart').innerHTML = ranked.length ? ranked.slice(0,8).map(([name,value]) => `<div class="bar-row"><span class="bar-label" title="${escapeHTML(name)}">${escapeHTML(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${value/max*100}%"></div></div><span class="bar-value">${formatNumber(value)}</span></div>`).join('') : '<p class="empty">Sin datos para mostrar.</p>';
  const recent = [...items].sort((a,b) => b.fecha.localeCompare(a.fecha) || a.cliente.localeCompare(b.cliente,'es')).slice(0,50);
  $('recordsBody').innerHTML = recent.map(r => `<tr><td>${formatDate(r.fecha)}</td><td>${escapeHTML(r.cliente)}</td><td class="num">${formatNumber(r.cantidad)}</td></tr>`).join('');
  $('emptyState').hidden = recent.length > 0;
}
function openDialog() { $('entryDate').value = todayISO(); $('entryQty').value = '0'; $('newClient').value = ''; fillClientOptions(); $('entryDialog').showModal(); }
function toggleNewClient() { const isNew = $('entryClient').value === '__new'; $('newClientWrap').hidden = !isNew; $('newClient').required = isNew; }
function csvDownload(content, name) { const blob = new Blob([content], {type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/,'').trim().split(/\r?\n/); if (lines.length < 2) throw new Error('El archivo no tiene filas de datos.');
  const parseLine = line => { const out=[]; let cur='', quoted=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='"'&&quoted&&line[i+1]==='"'){cur+='"';i++;} else if(ch==='"'){quoted=!quoted;} else if(ch===','&&!quoted){out.push(cur);cur='';} else cur+=ch;} out.push(cur); return out; };
  const headers = parseLine(lines[0]).map(x=>x.trim().toLowerCase()); const ix={fecha:headers.indexOf('fecha'),cliente:headers.indexOf('cliente'),cantidad:headers.indexOf('cantidad')};
  if(Object.values(ix).some(v=>v<0)) throw new Error('Se requieren las columnas fecha, cliente y cantidad.');
  const incoming=lines.slice(1).filter(Boolean).map(line=>{const c=parseLine(line);const fecha=c[ix.fecha]?.trim(),cliente=c[ix.cliente]?.trim(),cantidad=Number(c[ix.cantidad]);if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha)||!cliente||!Number.isInteger(cantidad)||cantidad<0)throw new Error(`Fila inválida: ${line}`);return {fecha,cliente,cantidad};});
  const seen=new Set();for(const r of incoming){const k=r.fecha+'|'+r.cliente;if(seen.has(k))throw new Error(`Combinación repetida: ${r.fecha}, ${r.cliente}`);seen.add(k);}return incoming;
}
$('dateFrom').value = shiftDate(todayISO(), -29); $('dateTo').value = todayISO();
$('dateFrom').addEventListener('change',render); $('dateTo').addEventListener('change',render); $('clientFilter').addEventListener('change',render);
$('resetFilters').addEventListener('click',()=>{$('dateFrom').value=shiftDate(todayISO(),-29);$('dateTo').value=todayISO();$('clientFilter').value='';render();});
$('openForm').addEventListener('click',openDialog); $('fab').addEventListener('click',openDialog); $('closeDialog').addEventListener('click',()=>$('entryDialog').close()); $('entryClient').addEventListener('change',toggleNewClient);
$('entryForm').addEventListener('submit',e=>{e.preventDefault();const date=$('entryDate').value;const client=($('entryClient').value==='__new'?$('newClient').value:$('entryClient').value).trim();const qty=Number($('entryQty').value);if(!date||!client||!Number.isInteger(qty)||qty<0)return;const existing=rows.find(r=>r.fecha===date&&r.cliente.toLowerCase()===client.toLowerCase());if(existing)existing.cantidad=qty;else rows.push({fecha:date,cliente,cantidad:qty});saveRows();$('entryDialog').close();render();});
$('exportBtn').addEventListener('click',()=>{const lines=['fecha,cliente,cantidad',...rows.sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.cliente.localeCompare(b.cliente,'es')).map(r=>`${r.fecha},"${r.cliente.replaceAll('"','""')}",${r.cantidad}`)];csvDownload(lines.join('\n'),'registro_diario_envios.csv');});
$('templateBtn').addEventListener('click',()=>csvDownload('fecha,cliente,cantidad\n'+todayISO()+',Cliente de ejemplo,100\n','plantilla_envios.csv'));
$('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const incoming=parseCSV(await file.text());const map=new Map(rows.map(r=>[r.fecha+'|'+r.cliente.toLowerCase(),r]));incoming.forEach(r=>{const old=map.get(r.fecha+'|'+r.cliente.toLowerCase());if(old)old.cantidad=r.cantidad;else rows.push(r);});saveRows();$('importMessage').textContent=`Importación correcta: ${incoming.length} registros.`;render();}catch(err){$('importMessage').textContent=err.message;}e.target.value='';});
let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').hidden=false;});$('installBtn').addEventListener('click',async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').hidden=true;});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
