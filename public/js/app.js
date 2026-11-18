// ==========================================
// 1. FONDO DINÁMICO SEGÚN LA HORA DEL DÍA
// ==========================================
function actualizarFondoPorHora() {
  const hora = new Date().getHours();
  let claseFondo = 'bg-night';

  if (hora >= 0 && hora < 6) claseFondo = 'bg-midnight';
  else if (hora >= 6 && hora < 9) claseFondo = 'bg-dawn';
  else if (hora >= 9 && hora < 12) claseFondo = 'bg-morning';
  else if (hora >= 12 && hora < 15) claseFondo = 'bg-noon';
  else if (hora >= 15 && hora < 18) claseFondo = 'bg-afternoon';
  else if (hora >= 18 && hora < 20) claseFondo = 'bg-evening';

  if (document.body.className !== claseFondo) {
    document.body.className = claseFondo;
  }
}

// ==========================================
// 2. AYUDANTE FETCH PARA LA API
// ==========================================
const api = async (url, opciones = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición al servidor');
  }
  return data;
};

// ==========================================
// 3. NOTIFICACIONES TOAST (SIN SOLAPAMIENTO)
// ==========================================
let toastTimer;
const mostrarToast = (msj, tipo = 'success') => {
  const t = document.getElementById('toast');
  clearTimeout(toastTimer);
  t.textContent = msj;
  t.className = `toast ${tipo}`;
  toastTimer = setTimeout(() => {
    t.className = 'toast';
  }, 3200);
};

// Auxiliares seguros contra XSS
const crearCelda = (texto, claseBadge = '') => {
  const td = document.createElement('td');
  if (claseBadge) {
    const span = document.createElement('span');
    span.className = `badge ${claseBadge}`;
    span.textContent = texto;
    td.appendChild(span);
  } else {
    td.textContent = texto;
  }
  return td;
};

const mostrarFilaVacia = (tbody, columnas, mensaje) => {
  const tr = document.createElement('tr');
  tr.className = 'empty-row';
  const td = document.createElement('td');
  td.colSpan = columnas;
  td.textContent = mensaje;
  tr.appendChild(td);
  tbody.appendChild(tr);
};

// ==========================================
// 4. NAVEGACIÓN ENTRE VISTAS
// ==========================================
const cambiarVista = (id) => {
  document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));

  const seccion = document.getElementById(id);
  if (seccion) seccion.classList.add('activa');

  // Busca el botón exacto sin importar tildes
  const btn = document.querySelector(`nav button[onclick*="'${id}'"]`);
  if (btn) btn.classList.add('active');

  if (id === 'inventario') cargarEquipos();
  if (id === 'usuarios') cargarUsuarios();
  if (id === 'prestamos') cargarPrestamos();
  if (id === 'resumen') cargarResumen();
};

// ==========================================
// 5. VISTA 1: INVENTARIO (EQUIPOS)
// ==========================================
const cargarEquipos = async () => {
  try {
    const equipos = await api('/api/equipos');
    const tbody = document.querySelector('#tabla-equipos tbody');
    tbody.innerHTML = '';

    if (!equipos.length) {
      return mostrarFilaVacia(tbody, 4, 'No hay equipos registrados en el inventario.');
    }

    equipos.forEach(eq => {
      const tr = document.createElement('tr');
      tr.append(
        crearCelda(eq.codigo),
        crearCelda(eq.nombre),
        crearCelda(eq.categoria),
        crearCelda(eq.estado, `estado-${eq.estado}`)
      );
      tbody.appendChild(tr);
    });
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
};

document.getElementById('form-equipo').onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  const body = {
    codigo: document.getElementById('eq-codigo').value.trim().toUpperCase(),
    nombre: document.getElementById('eq-nombre').value.trim(),
    categoria: document.getElementById('eq-categoria').value
  };

  try {
    await api('/api/equipos', { method: 'POST', body: JSON.stringify(body) });
    mostrarToast('Equipo creado correctamente');
    e.target.reset();
    cargarEquipos();
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
};

// ==========================================
// 6. VISTA 2: USUARIOS
// ==========================================
const cargarUsuarios = async () => {
  try {
    const usuarios = await api('/api/usuarios');
    const tbody = document.querySelector('#tabla-usuarios tbody');
    tbody.innerHTML = '';

    if (!usuarios.length) {
      return mostrarFilaVacia(tbody, 4, 'No hay usuarios registrados.');
    }

    usuarios.forEach(u => {
      const tr = document.createElement('tr');
      tr.append(
        crearCelda(u.nombre),
        crearCelda(u.documento),
        crearCelda(u.tipo),
        crearCelda(u.activo ? 'Activo' : 'Inactivo', u.activo ? 'estado-activo' : 'estado-inactivo')
      );
      tbody.appendChild(tr);
    });
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
};

document.getElementById('form-usuario').onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  const body = {
    nombre: document.getElementById('usr-nombre').value.trim(),
    documento: document.getElementById('usr-doc').value.trim(),
    email: document.getElementById('usr-email').value.trim().toLowerCase(),
    tipo: document.getElementById('usr-tipo').value
  };

  try {
    await api('/api/usuarios', { method: 'POST', body: JSON.stringify(body) });
    mostrarToast('Usuario registrado correctamente');
    e.target.reset();
    cargarUsuarios();
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
};

// ==========================================
// 7. VISTA 3: PRÉSTAMOS
// ==========================================
const DIAS_MAX_ROL = { estudiante: 7, docente: 15, administrativo: 7 };
let usuariosCache = [];

const actualizarLimiteCalendario = () => {
  const inputFecha = document.getElementById('prest-fecha');
  const selUsuario = document.getElementById('prest-usuario');
  if (!inputFecha) return;

  const hoy = new Date();
  inputFecha.min = hoy.toISOString().split('T')[0];

  const usuario = usuariosCache.find(u => u._id === selUsuario.value);
  if (usuario && DIAS_MAX_ROL[usuario.tipo]) {
    const maxFecha = new Date();
    maxFecha.setDate(hoy.getDate() + DIAS_MAX_ROL[usuario.tipo]);
    inputFecha.max = maxFecha.toISOString().split('T')[0];
  } else {
    inputFecha.removeAttribute('max');
  }
};

document.getElementById('prest-usuario').addEventListener('change', actualizarLimiteCalendario);

const cargarSelectsPrestamo = async () => {
  try {
    const [equiposDisp, usuarios] = await Promise.all([
      api('/api/equipos?estado=disponible'),
      api('/api/usuarios?activo=true')
    ]);

    usuariosCache = usuarios;

    const selEquipo = document.getElementById('prest-equipo');
    selEquipo.innerHTML = '<option value="">Seleccione equipo disponible...</option>';
    equiposDisp.forEach(eq => {
      const opt = document.createElement('option');
      opt.value = eq._id;
      opt.textContent = `${eq.codigo} - ${eq.nombre}`;
      selEquipo.appendChild(opt);
    });

    const selUsuario = document.getElementById('prest-usuario');
    selUsuario.innerHTML = '<option value="">Seleccione usuario activo...</option>';
    usuarios.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u._id;
      opt.textContent = `${u.nombre} (${u.tipo} - máx. ${DIAS_MAX_ROL[u.tipo] || 7}d)`;
      selUsuario.appendChild(opt);
    });

    actualizarLimiteCalendario();
  } catch (e) {
    mostrarToast('Error cargando listas: ' + e.message, 'error');
  }
};

const cargarPrestamos = async () => {
  cargarSelectsPrestamo();
  try {
    const prestamos = await api('/api/prestamos');
    const tbody = document.querySelector('#tabla-prestamos tbody');
    tbody.innerHTML = '';

    if (!prestamos.length) {
      return mostrarFilaVacia(tbody, 5, 'No hay préstamos registrados.');
    }

    prestamos.forEach(p => {
      const tr = document.createElement('tr');
      if (p.vencido) tr.classList.add('vencido');

      const equipoTexto = p.equipo ? `${p.equipo.codigo} - ${p.equipo.nombre}` : 'Equipo eliminado';
      const usuarioTexto = p.usuario ? p.usuario.nombre : 'Usuario eliminado';
      const fechaTexto = new Date(p.fechaLimite).toLocaleDateString('es-CO');
      const estadoTexto = p.vencido ? 'Vencido' : p.estado;
      const claseEstado = p.vencido ? 'estado-mantenimiento' : (p.estado === 'activo' ? 'estado-prestado' : 'estado-disponible');

      const tdAccion = document.createElement('td');
      if (p.estado === 'activo') {
        const btnDev = document.createElement('button');
        btnDev.type = 'button';
        btnDev.textContent = 'Devolver';
        btnDev.onclick = () => devolver(p._id);
        tdAccion.appendChild(btnDev);
      } else {
        tdAccion.textContent = '—';
      }

      tr.append(
        crearCelda(equipoTexto),
        crearCelda(usuarioTexto),
        crearCelda(fechaTexto),
        crearCelda(estadoTexto, claseEstado),
        tdAccion
      );
      tbody.appendChild(tr);
    });
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
};

document.getElementById('form-prestamo').onsubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  // Se envía con hora 23:59:59 local para evitar fallos de zona horaria UTC
  const fechaSolo = document.getElementById('prest-fecha').value;
  const body = {
    equipoId: document.getElementById('prest-equipo').value,
    usuarioId: document.getElementById('prest-usuario').value,
    fechaLimite: new Date(`${fechaSolo}T23:59:59`).toISOString()
  };

  try {
    await api('/api/prestamos', { method: 'POST', body: JSON.stringify(body) });
    mostrarToast('Préstamo registrado');
    e.target.reset();
    cargarPrestamos();
  } catch (err) {
    mostrarToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
};

window.devolver = async (id) => {
  try {
    const res = await api(`/api/prestamos/${id}/devolver`, { method: 'PATCH' });
    mostrarToast(res.mensaje || 'Equipo devuelto');
    cargarPrestamos();
  } catch (err) {
    mostrarToast(err.message, 'error');
  }
};

// ==========================================
// 8. VISTA 4: RESUMEN (REPORTES)
// ==========================================
const crearTarjetaKpi = (titulo, valor, esAlerta = false) => {
  const card = document.createElement('div');
  card.className = `kpi-card ${esAlerta ? 'alerta' : ''}`;

  const divTitulo = document.createElement('div');
  divTitulo.className = 'kpi-titulo';
  divTitulo.textContent = titulo;

  const divValor = document.createElement('div');
  divValor.className = 'kpi-valor';
  divValor.textContent = valor;

  card.append(divTitulo, divValor);
  return card;
};

const cargarResumen = async () => {
  try {
    const [resumen, top] = await Promise.all([
      api('/api/reportes/resumen'),
      api('/api/reportes/top-equipos')
    ]);

    const kpiContainer = document.getElementById('kpi-container');
    kpiContainer.innerHTML = '';
    kpiContainer.append(
      crearTarjetaKpi('Préstamos Activos', resumen.prestamosActivos ?? 0),
      crearTarjetaKpi('Préstamos Vencidos', resumen.prestamosVencidos ?? 0, (resumen.prestamosVencidos ?? 0) > 0)
    );

    const desglose = document.getElementById('desglose-container');
    desglose.innerHTML = '';

    (resumen.equiposPorEstado || []).forEach(item => {
      desglose.appendChild(crearTarjetaKpi(`Equipos (${item._id})`, item.total));
    });

    (resumen.activosPorTipoUsuario || []).forEach(item => {
      desglose.appendChild(crearTarjetaKpi(`Préstamos (${item._id})`, item.total));
    });

    const tbodyTop = document.querySelector('#tabla-top tbody');
    tbodyTop.innerHTML = '';

    if (!top.length) {
      return mostrarFilaVacia(tbodyTop, 4, 'Aún no hay historial de préstamos.');
    }

    top.forEach((eq, index) => {
      const tr = document.createElement('tr');
      tr.append(
        crearCelda(`#${index + 1}`),
        crearCelda(eq.codigo),
        crearCelda(eq.nombre),
        crearCelda(`${eq.totalPrestamos} préstamo(s)`)
      );
      tbodyTop.appendChild(tr);
    });
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
};

// ==========================================
// 9. RELOJ DIGITAL E INICIALIZACIÓN
// ==========================================
function actualizarReloj() {
  const ahora = new Date();
  actualizarFondoPorHora();

  const opcionesFecha = { weekday: 'short', day: 'numeric', month: 'short' };
  const fechaFormateada = ahora.toLocaleDateString('es-ES', opcionesFecha);

  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');
  const ampm = ahora.getHours() >= 12 ? 'PM' : 'AM';
  let horas12 = ahora.getHours() % 12;
  horas12 = horas12 ? horas12 : 12;
  const horaFormateada = `${String(horas12).padStart(2, '0')}:${minutos}:${segundos} ${ampm}`;

  const relojEl = document.getElementById('reloj-digital');
  if (relojEl) {
    relojEl.textContent = `${fechaFormateada} | ${horaFormateada}`;
  }
}

actualizarLimiteCalendario();
actualizarReloj();
setInterval(actualizarReloj, 1000);
cargarEquipos();