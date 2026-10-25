const KEY='cc_ng_v1',$=s=>document.querySelector(s),uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const VIEWS={talleres:'Talleres',participantes:'Participantes',inscripciones:'Inscripciones',asistencia:'Asistencia',atencion:'Atención',reportes:'Reportes',usuarios:'Usuarios'};
const ROLES={'Recepción':['talleres','participantes','inscripciones','atencion'],'Profesor':['talleres','asistencia'],'Coordinación':['talleres','asistencia','atencion','reportes'],'Administración':Object.keys(VIEWS)};
let D,M,U=null,rol='',fallos=0,bloq=0,vista='talleres',S={q:'',c:'',t:'',f:today()},charts=[];
const V={};
const catCol=c=>({'Música':'var(--azul)','Danza':'var(--morado)','Teatro':'var(--naranja)','Arte':'var(--verde)'}[c]||'var(--brand)');
const base=async()=>(await fetch('data/datos.json')).json();
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const save=()=>localStorage.setItem(KEY,JSON.stringify(D));
const P=id=>D.participantes.find(p=>p.id==id)||{nombres:'(eliminado)'};
const Tl=id=>D.talleres.find(t=>t.id==id)||{nombre:'(eliminado)'};
const nIns=t=>D.inscripciones.filter(i=>i.tid==t.id).length;
const cupos=t=>t.capacidad-nIns(t);
const estado=t=>t.estado=='cancelado'?['Cancelado','danger']:t.estado=='finalizado'?['Finalizado','secondary']:cupos(t)<=0?['Lleno','danger']:['Disponible','success'];
const abierto=t=>estado(t)[0]=='Disponible';
const puedeEditar=()=>['Coordinación','Administración'].includes(rol);
const v=id=>$('#'+id).value.trim();
const valid=f=>{f.classList.add('was-validated');return f.checkValidity()};
const vacio=m=>`<div class="text-secondary p-4 text-center">${m}</div>`;
const badge=(t,c)=>`<span class="badge text-bg-${c}">${esc(t)}</span>`;
const inp=(id,l,val='',c='col-md-6',x='')=>`<div class="${c}"><label class="form-label small mb-1" for="${id}">${l}</label><input class="form-control" id="${id}" value="${esc(val)}" required ${x}><div class="invalid-feedback">Revisa este campo.</div></div>`;
const sel=(id,l,o,val='',c='col-md-6',x='')=>`<div class="${c}"><label class="form-label small mb-1" for="${id}">${l}</label><select class="form-select" id="${id}" ${x}>${o.map(([a,b,d])=>`<option value="${esc(a)}" ${a==val?'selected':''} ${d?'disabled':''}>${esc(b)}</option>`).join('')}</select></div>`;
const tabla=(cols,rows)=>`<div class="card"><div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')||`<tr><td colspan="${cols.length}">${vacio('Sin registros')}</td></tr>`}</tbody></table></div></div>`;
function toast(m,t='success'){const e=document.createElement('div');e.className=`toast align-items-center text-bg-${t} border-0 show`;e.innerHTML=`<div class="d-flex"><div class="toast-body">${esc(m)}</div></div>`;$('#toasts').append(e);setTimeout(()=>e.remove(),3200)}
function modal(title,body,ok,label='Guardar'){$('#mt').textContent=title;$('#mb').innerHTML=body;const b=$('#mok');b.textContent=label;b.classList.toggle('d-none',!ok);b.onclick=()=>{if(ok()!==false)M.hide()};M.show()}
const confirmar=(msg,fn)=>modal('Confirmar',`<p class="mb-0">${msg}</p>`,()=>{fn()},'Confirmar');
function sq(val){S.q=val;render();const q=$('#q');q.focus();q.setSelectionRange(val.length,val.length)}
const buscador=()=>`<input id="q" class="form-control w-auto" placeholder="Buscar…" value="${esc(S.q)}" oninput="sq(this.value)">`;
const hit=(...s)=>s.join(' ').toLowerCase().includes(S.q.toLowerCase());

/* Talleres */
V.talleres=()=>{
  const cats=[...new Set(D.talleres.map(t=>t.categoria))].sort();
  const l=D.talleres.filter(t=>(!S.c||t.categoria==S.c)&&hit(t.nombre,t.profesor));
  return `<div class="d-flex flex-wrap gap-2 mb-3">
    <select class="form-select w-auto" aria-label="Categoría" onchange="S.c=this.value;render()"><option value="">Todas las categorías</option>${cats.map(c=>`<option ${c==S.c?'selected':''}>${esc(c)}</option>`).join('')}</select>
    ${buscador()}${puedeEditar()?'<button class="btn btn-primary ms-auto" onclick="fTaller()">Nuevo taller</button>':''}</div>
  <div class="row g-3">${l.map(t=>{const n=nIns(t),[e,c]=estado(t),p=Math.min(100,Math.round(n/t.capacidad*100));
    return `<div class="col-md-6 col-xl-4"><div class="card h-100" style="border-top:4px solid ${catCol(t.categoria)}"><div class="card-body">
      <div class="d-flex justify-content-between gap-2"><h6>${esc(t.nombre)}</h6>${badge(e,c)}</div>
      <div class="small text-secondary">${esc(t.categoria)} · ${esc(t.profesor)} · ${esc(t.horario)}</div>
      <div class="progress my-2" style="height:8px"><div class="progress-bar ${t.capacidad-n<=3?'bg-warning':''}" style="width:${p}%"></div></div>
      <div class="small">${Math.max(t.capacidad-n,0)} cupos de ${t.capacidad}</div></div>
      ${puedeEditar()?`<div class="card-footer bg-transparent"><button class="btn btn-sm btn-outline-secondary" onclick="fTaller('${t.id}')">Editar</button></div>`:''}</div></div>`}).join('')||vacio('No hay talleres con ese filtro')}</div>`};
function fTaller(id){
  const t=D.talleres.find(x=>x.id==id)||{nombre:'',categoria:'',profesor:'',horario:'',capacidad:10,estado:''};
  modal(id?'Editar taller':'Nuevo taller',`<form id="f" class="row g-2" novalidate>
    ${inp('nombre','Nombre',t.nombre,'col-12')}${inp('categoria','Categoría',t.categoria,'col-md-6','list="cats"')}<datalist id="cats">${[...new Set(D.talleres.map(x=>x.categoria))].map(c=>`<option>${esc(c)}</option>`).join('')}</datalist>
    ${inp('profesor','Profesor',t.profesor)}${inp('horario','Horario',t.horario,'col-md-6','placeholder="Lun 5:00 pm"')}
    ${inp('capacidad','Capacidad máxima',t.capacidad,'col-md-6',`type="number" min="${id?Math.max(1,nIns(t)):1}"`)}
    ${sel('estadoM','Estado',[['','Automático'],['finalizado','Finalizado'],['cancelado','Cancelado']],t.estado,'col-md-6')}</form>`,()=>{
    if(!valid($('#f')))return false;
    const o={nombre:v('nombre'),categoria:v('categoria'),profesor:v('profesor'),horario:v('horario'),capacidad:+v('capacidad'),estado:$('#estadoM').value};
    if(id)Object.assign(t,o);else D.talleres.push({id:uid(),...o});
    save();render();toast('Taller guardado')})}

/* Participantes */
V.participantes=()=>{
  const l=D.participantes.filter(p=>hit(p.nombres,p.correo,p.telefono));
  return `<div class="card mb-3"><div class="card-body"><form id="fp" class="row g-2" novalidate>
    ${inp('nombres','Nombres','','col-md-4')}${inp('edad','Edad','','col-md-2','type="number" min="3" max="99"')}
    ${inp('telefono','Teléfono','','col-md-3','pattern="[0-9 +]{7,15}"')}${inp('correo','Correo','','col-md-3','type="email"')}
    ${inp('emergencia','Contacto de emergencia','','col-md-8','placeholder="Nombre y teléfono"')}
    <div class="col-md-4 d-flex align-items-end"><button type="button" class="btn btn-primary" onclick="addP()">Registrar participante</button></div></form></div></div>
  <div class="mb-3">${buscador()}</div>
  ${tabla(['Nombre','Edad','Teléfono','Correo','Matrícula',''],l.map(p=>{const n=D.inscripciones.filter(i=>i.pid==p.id).length;
    return `<tr><td>${esc(p.nombres)}</td><td>${p.edad}</td><td>${esc(p.telefono)}</td><td>${esc(p.correo)}</td><td>${n?badge('Matriculado · '+n,'success'):badge('Sin matrícula','secondary')}</td>
    <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-secondary" onclick="hist('${p.id}')">Historial</button> <button class="btn btn-sm btn-outline-danger" onclick="delP('${p.id}')">Eliminar</button></td></tr>`}))}`};
function addP(){const f=$('#fp');if(!valid(f))return toast('Completa los campos obligatorios','danger');
  D.participantes.push({id:uid(),nombres:v('nombres'),edad:+v('edad'),telefono:v('telefono'),correo:v('correo'),emergencia:v('emergencia')});save();render();toast('Participante registrado')}
function delP(id){confirmar(`¿Eliminar a <b>${esc(P(id).nombres)}</b>? Se quitarán sus inscripciones, asistencias y solicitudes.`,()=>{
  D.participantes=D.participantes.filter(p=>p.id!=id);['inscripciones','asistencia','solicitudes'].forEach(k=>D[k]=D[k].filter(x=>x.pid!=id));save();render();toast('Participante eliminado')})}
function hist(id){const r=D.inscripciones.filter(i=>i.pid==id);
  modal('Historial · '+P(id).nombres,r.length?`<table class="table table-sm"><tr><th>Taller</th><th>Inscrito</th><th>Estado</th></tr>${r.map(i=>{const t=Tl(i.tid),e=t.capacidad?estado(t):['—','secondary'];return `<tr><td>${esc(t.nombre)}</td><td>${i.fecha}</td><td>${badge(e[0],e[1])}</td></tr>`}).join('')}</table>`:'<p class="mb-0 text-secondary">Aún no cursa talleres.</p>')}

/* Inscripciones y vacantes */
V.inscripciones=()=>{
  if(!D.talleres.some(t=>t.id==S.t))S.t=D.talleres[0]?.id||'';
  const t=Tl(S.t),pad=D.inscripciones.filter(i=>i.tid==S.t);
  return `<div class="card mb-3"><div class="card-body"><div class="row g-2 align-items-end">
    ${sel('ip','Participante',[['','Selecciona…'],...D.participantes.map(p=>[p.id,p.nombres])],'','col-md-4')}
    ${sel('it','Taller',[['','Selecciona…'],...D.talleres.map(x=>[x.id,`${x.nombre} — ${estado(x)[0]} (${Math.max(cupos(x),0)} cupos)`,!abierto(x)])],'','col-md-5')}
    <div class="col-md-3"><button class="btn btn-primary w-100" onclick="inscribir()">Inscribir</button></div></div></div></div>
  <div class="d-flex flex-wrap gap-2 align-items-center mb-2"><h6 class="mb-0">Padrón del taller</h6>
    <select class="form-select w-auto" aria-label="Taller" onchange="S.t=this.value;render()">${D.talleres.map(x=>`<option value="${x.id}" ${x.id==S.t?'selected':''}>${esc(x.nombre)}</option>`).join('')}</select>
    ${t.capacidad?`<span class="text-secondary small">${pad.length} de ${t.capacidad} · ${badge(estado(t)[0],estado(t)[1])}</span>`:''}</div>
  ${tabla(['Participante','Inscrito el',''],pad.map(i=>`<tr><td>${esc(P(i.pid).nombres)}</td><td>${i.fecha}</td><td class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="quitar('${i.id}')">Quitar</button></td></tr>`))}`};
function inscribir(){const pid=$('#ip').value,tid=$('#it').value;
  if(!pid||!tid)return toast('Elige participante y taller','warning');
  const t=Tl(tid);
  if(!abierto(t))return toast('Inscripción bloqueada: el taller no tiene vacantes','danger');
  if(D.inscripciones.some(i=>i.pid==pid&&i.tid==tid))return toast('El participante ya está inscrito en ese taller','warning');
  confirmar(`¿Inscribir a <b>${esc(P(pid).nombres)}</b> en <b>${esc(t.nombre)}</b>? Quedarán ${cupos(t)-1} cupos.`,()=>{
    if(!abierto(t))return toast('Sin vacantes','danger');
    D.inscripciones.push({id:uid(),pid,tid,fecha:today()});S.t=tid;save();render();toast('Inscripción registrada')})}
function quitar(id){confirmar('¿Quitar esta inscripción? El cupo quedará libre.',()=>{D.inscripciones=D.inscripciones.filter(i=>i.id!=id);save();render();toast('Inscripción retirada')})}

/* Asistencia */
V.asistencia=()=>{
  const ts=D.talleres.filter(t=>nIns(t)>0);if(!ts.length)return vacio('Aún no hay talleres con inscritos.');
  if(!ts.some(t=>t.id==S.t))S.t=ts[0].id;
  const pids=D.inscripciones.filter(i=>i.tid==S.t).map(i=>i.pid),reg=D.asistencia.filter(a=>a.tid==S.t&&a.fecha==S.f);
  return `<div class="d-flex flex-wrap gap-2 mb-3 align-items-center">
    <select class="form-select w-auto" aria-label="Taller" onchange="S.t=this.value;render()">${ts.map(t=>`<option value="${t.id}" ${t.id==S.t?'selected':''}>${esc(t.nombre)}</option>`).join('')}</select>
    <input type="date" class="form-control w-auto" aria-label="Fecha de sesión" value="${S.f}" max="${today()}" onchange="S.f=this.value||S.f;render()">
    <button class="btn btn-primary ms-auto" onclick="guardarAsist()">Guardar asistencia</button></div>
  ${tabla(['Alumno','Presente','Asistencias','Alertas'],pids.map(pid=>{
    const r=D.asistencia.filter(a=>a.tid==S.t&&a.pid==pid),pr=r.filter(a=>a.presente).length,fa=r.length-pr,pc=r.length?Math.round(pr/r.length*100):0,h=reg.find(a=>a.pid==pid);
    return `<tr><td>${esc(P(pid).nombres)}</td><td><input type="checkbox" class="form-check-input chk" data-p="${pid}" aria-label="Presente" ${!h||h.presente?'checked':''}></td><td>${pr} de ${r.length} (${pc}%)</td>
    <td>${r.length>=2&&pc>=80?badge('Frecuente','success'):''} ${fa>=2?badge(fa+' inasistencias',fa>=3?'danger':'warning'):''}</td></tr>`}))}`};
function guardarAsist(){D.asistencia=D.asistencia.filter(a=>!(a.tid==S.t&&a.fecha==S.f));
  document.querySelectorAll('.chk').forEach(c=>D.asistencia.push({tid:S.t,fecha:S.f,pid:c.dataset.p,presente:c.checked}));save();render();toast('Asistencia del '+S.f+' guardada')}

/* Atención al participante */
V.atencion=()=>`<div class="card mb-3"><div class="card-body"><form id="fa" class="row g-2" novalidate>
  ${sel('sp','Participante',[['','Selecciona…'],...D.participantes.map(p=>[p.id,p.nombres])],'','col-md-3','required')}
  ${sel('st','Tipo',[['Petición','Petición'],['Cambio de horario','Cambio de horario'],['Cancelación','Cancelación']],'','col-md-3')}
  ${sel('sk','Taller relacionado',[['','Ninguno'],...D.talleres.map(t=>[t.id,t.nombre])],'','col-md-3')}
  ${inp('sd','Detalle','','col-md-3')}
  <div class="col-12"><button type="button" class="btn btn-primary" onclick="addS()">Registrar solicitud</button></div></form></div></div>
  ${tabla(['Fecha','Participante','Tipo','Taller','Detalle','Estado',''],[...D.solicitudes].reverse().map(s=>`<tr><td>${s.fecha}</td><td>${esc(P(s.pid).nombres)}</td><td>${esc(s.tipo)}</td><td>${s.tid?esc(Tl(s.tid).nombre):'—'}</td><td>${esc(s.detalle)}</td><td>${badge(s.estado,s.estado=='Atendida'?'success':'warning')}</td>
  <td class="text-end"><button class="btn btn-sm btn-outline-secondary" onclick="atender('${s.id}')">${s.estado=='Atendida'?'Reabrir':'Marcar atendida'}</button></td></tr>`))}`;
function addS(){if(!valid($('#fa')))return toast('Completa participante y detalle','danger');
  D.solicitudes.push({id:uid(),pid:$('#sp').value,tipo:$('#st').value,tid:$('#sk').value,detalle:v('sd'),estado:'Pendiente',fecha:today()});save();render();toast('Solicitud registrada')}
function atender(id){const s=D.solicitudes.find(x=>x.id==id);
  const go=()=>{s.estado=s.estado=='Atendida'?'Pendiente':'Atendida';save();render()};
  if(s.estado=='Pendiente'&&s.tipo=='Cancelación'&&s.tid&&D.inscripciones.some(i=>i.pid==s.pid&&i.tid==s.tid))
    confirmar('Al atender la cancelación se retirará al participante del taller y se liberará el cupo. ¿Continuar?',()=>{D.inscripciones=D.inscripciones.filter(i=>!(i.pid==s.pid&&i.tid==s.tid));go();toast('Cancelación aplicada')});
  else go()}

/* Reportes */
V.reportes=()=>{
  const act=D.talleres.filter(t=>!t.estado),top=[...D.talleres].sort((a,b)=>nIns(b)/b.capacidad-nIns(a)/a.capacidad);
  const k=[['Participantes',D.participantes.length],['Matriculados',new Set(D.inscripciones.map(i=>i.pid)).size],['Inscripciones',D.inscripciones.length],['Cupos libres',act.reduce((a,t)=>a+Math.max(cupos(t),0),0)],['Talleres llenos',D.talleres.filter(t=>estado(t)[0]=='Lleno').length]];
  return `<div class="row g-3 mb-3">${k.map(([l,n])=>`<div class="col-6 col-lg"><div class="card"><div class="card-body"><div class="small text-secondary">${l}</div><div class="fs-3">${n}</div></div></div></div>`).join('')}</div>
  <div class="row g-3 mb-3"><div class="col-lg-7"><div class="card"><div class="card-body"><h6>Inscritos y capacidad por taller</h6><canvas id="c1" height="170"></canvas></div></div></div>
  <div class="col-lg-5"><div class="card"><div class="card-body"><h6>Matrículas por mes</h6><canvas id="c2" height="230"></canvas></div></div></div></div>
  <h6>Talleres con mayor demanda</h6>${tabla(['Taller','Inscritos','Cupos libres','Ocupación','Estado'],top.map(t=>{const p=Math.round(nIns(t)/t.capacidad*100),e=estado(t);return `<tr><td>${esc(t.nombre)}</td><td>${nIns(t)}</td><td>${Math.max(cupos(t),0)}</td><td style="min-width:140px"><div class="progress" style="height:8px"><div class="progress-bar" style="width:${Math.min(p,100)}%"></div></div></td><td>${badge(e[0],e[1])}</td></tr>`}))}`};
function graficos(){
  if(!window.Chart||!$('#c1'))return;const cs=getComputedStyle(document.documentElement);Chart.defaults.color=cs.getPropertyValue('--bs-body-color').trim();Chart.defaults.borderColor=cs.getPropertyValue('--bs-border-color').trim();const ts=D.talleres,m={};
  D.inscripciones.forEach(i=>{const k=i.fecha.slice(0,7);m[k]=(m[k]||0)+1});const ks=Object.keys(m).sort();
  charts.push(new Chart($('#c1'),{type:'bar',data:{labels:ts.map(t=>t.nombre),datasets:[{label:'Inscritos',data:ts.map(nIns),backgroundColor:'#0072D2'},{label:'Capacidad',data:ts.map(t=>t.capacidad),backgroundColor:'rgba(142,51,164,.35)'}]}}));
  charts.push(new Chart($('#c2'),{type:'line',data:{labels:ks,datasets:[{label:'Matrículas',data:ks.map(x=>m[x]),borderColor:'#178736',tension:.3}]},options:{scales:{y:{beginAtZero:true,ticks:{precision:0}}}}}))}

/* Sesión local y usuarios */
const loginHTML=()=>`<div class="card mx-auto mt-5" style="max-width:380px"><div class="card-body p-4"><div class="text-center mb-3"><img class="logo-l" src="img/logo-claro.png" alt="Logo del Centro Cultural Nueva Generación" width="130"><img class="logo-d" src="img/logo-oscuro.png" alt="Logo del Centro Cultural Nueva Generación" width="130"></div><h4 class="mb-1">Iniciar sesión</h4><p class="text-secondary small">Acceso solo para el personal del centro.</p>
  <form id="fl" onsubmit="entrar(event)" novalidate><div class="mb-3"><label class="form-label small mb-1" for="lu">Usuario</label><input id="lu" class="form-control" autocomplete="username" required></div>
  <div class="mb-3"><label class="form-label small mb-1" for="lc">Contraseña</label><input id="lc" type="password" class="form-control" autocomplete="current-password" required></div>
  <div id="le" class="text-danger small mb-2" role="alert"></div><button class="btn btn-primary w-100">Entrar</button></form></div></div>`;
async function entrar(e){e.preventDefault();const le=$('#le');
  if(!window.crypto||!crypto.subtle)return le.textContent='Abre el sistema desde localhost o HTTPS para poder iniciar sesión.';
  if(Date.now()<bloq)return le.textContent=`Demasiados intentos. Espera ${Math.ceil((bloq-Date.now())/1000)} s.`;
  const u=D.usuarios.find(x=>x.usuario==v('lu').toLowerCase()&&x.activo);
  if(!u||await sha(u.salt+$('#lc').value)!==u.hash){if(++fallos>=5){bloq=Date.now()+30000;fallos=0}return le.textContent='Usuario o contraseña incorrectos.'}
  fallos=0;U=u;rol=u.rol;sessionStorage.setItem('cc_u',u.id);vista=ROLES[rol][0];S.q='';render()}
function salir(){U=null;rol='';sessionStorage.removeItem('cc_u');render()}
function barra(){$('#barra').innerHTML=U?`<span class="text-white-50 small">${esc(U.nombre)} · ${esc(U.rol)}</span><button class="btn btn-sm btn-outline-light" onclick="cambiarClave()">Contraseña</button>${rol=='Administración'?'<button class="btn btn-sm btn-outline-light" onclick="resetDatos()">Restablecer datos</button>':''}<button class="btn btn-sm btn-light" onclick="salir()">Salir</button>`:''}
function cambiarClave(){const f=(id,l,x='')=>`<div class="col-12"><label class="form-label small mb-1" for="${id}">${l}</label><input id="${id}" type="password" class="form-control" required ${x}></div>`;
  modal('Cambiar contraseña',`<form id="fc" class="row g-2" novalidate>${f('c0','Contraseña actual')}${f('c1','Nueva contraseña (mínimo 8 caracteres)','minlength="8"')}${f('c2','Repite la nueva contraseña')}</form>`,()=>{
    const a=$('#c0').value,b=$('#c1').value;
    if(!valid($('#fc')))return false;
    if(b!==$('#c2').value){toast('Las contraseñas no coinciden','danger');return false}
    sha(U.salt+a).then(async h=>{if(h!==U.hash)return toast('La contraseña actual es incorrecta','danger');const s=uid(),n=await sha(s+b);U.salt=s;U.hash=n;save();toast('Contraseña actualizada')})})}
V.usuarios=()=>`<div class="card mb-3"><div class="card-body"><form id="fu" class="row g-2" novalidate>
  ${inp('uu','Usuario','','col-md-3','pattern="[a-z0-9._]{3,20}" placeholder="minúsculas, sin espacios"')}${inp('un','Nombre completo','','col-md-3')}
  ${sel('ur','Rol',Object.keys(ROLES).map(r=>[r,r]),'','col-md-3')}${inp('up','Contraseña temporal','','col-md-3','minlength="8"')}
  <div class="col-12"><button type="button" class="btn btn-primary" onclick="addU()">Crear usuario</button></div></form></div></div>
  ${tabla(['Usuario','Nombre','Rol','Estado',''],D.usuarios.map(u=>`<tr><td>${esc(u.usuario)}</td><td>${esc(u.nombre)}</td><td>${esc(u.rol)}</td><td>${badge(u.activo?'Activo':'Inactivo',u.activo?'success':'secondary')}</td>
  <td class="text-end text-nowrap"><button class="btn btn-sm btn-outline-secondary" onclick="resetU('${u.id}')">Restablecer clave</button> ${u.id==U.id?'':`<button class="btn btn-sm btn-outline-${u.activo?'danger':'success'}" onclick="togU('${u.id}')">${u.activo?'Desactivar':'Activar'}</button>`}</td></tr>`))}`;
async function addU(){if(!valid($('#fu')))return toast('Revisa los campos (usuario en minúsculas, clave de 8+ caracteres)','danger');
  const us=v('uu').toLowerCase();if(D.usuarios.some(x=>x.usuario==us))return toast('Ese usuario ya existe','danger');
  const salt=uid();D.usuarios.push({id:uid(),usuario:us,nombre:v('un'),rol:$('#ur').value,salt,hash:await sha(salt+$('#up').value),activo:true});save();render();toast('Usuario creado')}
function resetU(id){const u=D.usuarios.find(x=>x.id==id);
  modal('Restablecer clave de '+u.usuario,'<label class="form-label small" for="rn">Nueva contraseña temporal (mínimo 8 caracteres)</label><input id="rn" class="form-control">',()=>{
    const p=$('#rn').value;if(p.length<8){toast('Mínimo 8 caracteres','danger');return false}
    const s=uid();sha(s+p).then(h=>{u.salt=s;u.hash=h;save();toast('Clave restablecida')})})}
function togU(id){const u=D.usuarios.find(x=>x.id==id);
  if(u.activo&&u.rol=='Administración'&&D.usuarios.filter(x=>x.activo&&x.rol=='Administración').length<2)return toast('Debe quedar al menos un administrador activo','danger');
  u.activo=!u.activo;save();render()}

/* Núcleo */
function nav(){const ok=ROLES[rol];if(!ok.includes(vista))vista=ok[0];
  $('#nav').innerHTML=`<div class="nav nav-pills flex-lg-column gap-1">${ok.map(k=>`<button class="nav-link text-start ${k==vista?'active':''}" onclick="go('${k}')">${VIEWS[k]}</button>`).join('')}</div>`}
function go(k){vista=k;S.q='';S.c='';render()}
function render(){charts.forEach(c=>c.destroy());charts=[];barra();
  $('#nav').classList.toggle('d-none',!U);$('main').className=U?'col-lg-10 p-4':'col-12 p-4';
  if(!U){$('#vista').innerHTML=loginHTML();$('#lu')?.focus();return}
  nav();$('#vista').innerHTML=`<h4 class="mb-3">${VIEWS[vista]}</h4>`+V[vista]();if(vista=='reportes')graficos()}
function resetDatos(){confirmar('Se borrarán los cambios y volverán los datos de ejemplo.',()=>{localStorage.removeItem(KEY);location.reload()})}
async function init(){
  aplicarTema();M=new bootstrap.Modal('#modal');
  const s=localStorage.getItem(KEY);
  try{D=s?JSON.parse(s):await base();if(!D.usuarios)D.usuarios=(await base()).usuarios;save()}
  catch(e){$('#vista').innerHTML='<div class="alert alert-warning">No se pudo cargar <code>data/datos.json</code>. Abre el proyecto con un servidor local (Live Server en VS Code, o <code>python -m http.server</code>) en lugar de abrir el archivo directamente.</div>';return}
  U=D.usuarios.find(x=>x.id==sessionStorage.getItem('cc_u')&&x.activo)||null;rol=U?U.rol:'';
  render()}
function aplicarTema(){const t=localStorage.getItem('cc_tema')||'auto',d=t=='oscuro'||(t=='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-bs-theme',d?'dark':'light');
  $('#temaBtn').textContent={claro:'☀ Claro',oscuro:'☾ Oscuro',auto:'◐ Automático'}[t];
  document.querySelectorAll('#temaMenu .dropdown-item').forEach(b=>b.classList.toggle('active',b.dataset.t==t))}
function setTema(t){localStorage.setItem('cc_tema',t);aplicarTema();if(D)render()}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if((localStorage.getItem('cc_tema')||'auto')=='auto'){aplicarTema();if(D)render()}});
init();
