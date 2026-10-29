// Lógica y vistas de la sección «Partidos y programas». No depende del navegador: se prueba con `npm test`.
// Neutralidad: todas las tarjetas y fichas se generan con las mismas funciones; ninguna rama depende de
// qué partido sea, y el orden nunca depende del tamaño del partido.
import { barajar, colorSeguro, escapar, urlSegura } from './utilidades.js';

export const AMBITOS = { estatal: 'Estatal', territorial: 'Territorial', coalicion: 'Coalición' };

const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** Partidos que aparecen en el directorio: los que tienen `en_directorio: true`. */
export function partidosDelDirectorio(partidos) {
  return partidos.filter((p) => p.en_directorio === true);
}

/** Orden alfabético por nombre o aleatorio (según `config.directorio.orden`). Nada más influye. */
export function ordenarPartidos(partidos, orden = 'alfabetico', azar = Math.random) {
  if (orden === 'aleatorio') return barajar(partidos, azar);
  return [...partidos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
}

/** Filtra por ámbito ('' = todos) y por texto en nombre, siglas o territorio (sin tildes ni mayúsculas). */
export function filtrarPartidos(partidos, { ambito = '', texto = '' } = {}) {
  const buscado = normalizar(texto).trim();
  return partidos.filter((p) => {
    if (ambito && p.ambito !== ambito) return false;
    if (!buscado) return true;
    return [p.nombre, p.siglas, ...(Array.isArray(p.territorio) ? p.territorio : [])].some((campo) => normalizar(campo).includes(buscado));
  });
}

/** Rutas de archivos de datos relativas a la web («/data/x.json» → «data/x.json»), para que funcionen en GitHub Pages. */
export function rutaRelativa(ruta) {
  return typeof ruta === 'string' && ruta.trim() ? ruta.trim().replace(/^\.?\/+/, '') : null;
}

export function programaPublicado(partido) {
  return partido.programa?.estado === 'publicado';
}

/** «2026-11-10» → «10 de noviembre de 2026». */
export function formatearFecha(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '';
  const fecha = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(fecha.getTime()) ? '' : fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function textoAmbito(partido) {
  const partes = [AMBITOS[partido.ambito] ?? 'Ámbito sin indicar'];
  if (Array.isArray(partido.territorio) && partido.territorio.length) partes.push(partido.territorio.join(', '));
  return partes.join(' · ');
}

function textoEstado(partido) {
  const estado = programaPublicado(partido) ? 'Programa publicado' : 'Programa aún no publicado';
  return partido.verificar === true ? `${estado} · Datos por confirmar` : estado;
}

const COLOR_VALIDO = /^#[0-9a-f]{6}$/i;

/**
 * El marco de color solo se usa si TODOS los partidos de la lista tienen un color válido:
 * así ningún partido aparece sin color mientras otros lo tienen.
 */
export function todosConColor(partidos) {
  return partidos.length > 0 && partidos.every((p) => typeof p.color === 'string' && COLOR_VALIDO.test(p.color.trim()));
}

/**
 * Tarjeta del directorio. Siempre la misma estructura: nombre, siglas y ámbito, estado del programa.
 * Con `conColor`, un marco fino con el color del partido (igual para todos).
 */
export function htmlTarjetaPartido(partido, { conColor = false } = {}) {
  const siglas = partido.siglas && partido.siglas !== partido.nombre ? `${escapar(partido.siglas)} · ` : '';
  const color = conColor ? ` tarjeta-partido--color" style="--color-partido: ${colorSeguro(partido.color)}` : '';
  return `
    <li class="tarjeta-partido${color}">
      <h2 class="tarjeta-partido__nombre"><a href="#/partidos/${encodeURIComponent(partido.id)}">${escapar(partido.nombre)}</a></h2>
      <p class="tarjeta-partido__meta">${siglas}${escapar(textoAmbito(partido))}</p>
      <p class="tarjeta-partido__estado estado-programa estado-programa--${programaPublicado(partido) ? 'publicado' : 'pendiente'}">${escapar(textoEstado(partido))}</p>
    </li>`;
}

function enlaceExterno(url, texto, clase = '') {
  return `<a ${clase ? `class="${clase}" ` : ''}href="${escapar(url)}" target="_blank" rel="noopener noreferrer">${texto}<span class="sr-only"> (se abre en una pestaña nueva)</span></a>`;
}

function enlacePartido(partido) {
  return partido.en_directorio === true
    ? `<a href="#/partidos/${encodeURIComponent(partido.id)}">${escapar(partido.nombre)}</a>`
    : escapar(partido.nombre);
}

/** Lista de datos básicos de la ficha, incluidas las coaliciones (en ambos sentidos). */
export function htmlDatosPartido(partido, todos) {
  const porId = new Map(todos.map((p) => [p.id, p]));
  const filas = [['Ámbito', escapar(AMBITOS[partido.ambito] ?? 'Sin indicar')]];
  if (partido.siglas && partido.siglas !== partido.nombre) filas.unshift(['Siglas', escapar(partido.siglas)]);
  if (Array.isArray(partido.territorio) && partido.territorio.length) filas.push(['Se presenta en', escapar(partido.territorio.join(', '))]);
  if (partido.candidato) filas.push(['Cabeza de lista', escapar(partido.candidato)]);
  const web = urlSegura(partido.web_oficial);
  if (web) filas.push(['Web oficial', enlaceExterno(web, escapar(web.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')))]);

  const integrantes = (Array.isArray(partido.coalicion_de) ? partido.coalicion_de : []).map((id) => porId.get(id)).filter(Boolean);
  if (integrantes.length) filas.push(['Coalición formada por', integrantes.map(enlacePartido).join(', ')]);
  const coaliciones = todos.filter((p) => Array.isArray(p.coalicion_de) && p.coalicion_de.includes(partido.id));
  if (coaliciones.length) filas.push(['Forma parte de', coaliciones.map(enlacePartido).join(', ')]);

  return `<dl class="datos-partido">${filas.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join('')}</dl>`;
}

/** Bloque «Programa electoral» de la ficha: estado, PDF oficial y copia guardada. */
export function htmlProgramaPartido(partido) {
  const programa = partido.programa ?? {};
  const web = urlSegura(partido.web_oficial);

  if (!programaPublicado(partido)) {
    return `
      <p class="estado-programa estado-programa--pendiente">Programa aún no publicado.</p>
      ${web ? `<p>Mientras tanto, puedes consultar la ${enlaceExterno(web, 'web oficial del partido')}.</p>` : ''}`;
  }

  const url = urlSegura(programa.url_oficial);
  const copia = rutaRelativa(programa.archivo_local);
  const fechaCopia = formatearFecha(programa.fecha_comprobacion);
  const detalles = [
    programa.fecha_publicacion && `Publicado el ${formatearFecha(programa.fecha_publicacion)}`,
    programa.paginas && `${escapar(programa.paginas)} páginas`,
    programa.version && `versión ${escapar(programa.version)}`,
    programa.fecha_comprobacion && `comprobado el ${fechaCopia}`,
  ].filter(Boolean);

  const botones = [
    url
      ? enlaceExterno(url, 'Ver programa oficial (PDF)', 'boton boton--primario')
      : partido.ejemplo
        ? '<p><em>Programa ficticio de ejemplo: no tiene PDF.</em></p>'
        : '<p>El enlace al programa oficial se añadirá en breve.</p>',
    copia
      ? `<a class="boton boton--secundario" href="${escapar(copia)}" download>Descargar copia guardada${fechaCopia ? ` (${fechaCopia})` : ''}</a>`
      : '',
  ].join('');

  return `
    <p class="estado-programa estado-programa--publicado">Programa publicado.</p>
    ${detalles.length ? `<p class="ayuda">${detalles.join(' · ')}.</p>` : ''}
    <div class="acciones">${botones}</div>
    ${
      copia
        ? `<p class="ayuda">La copia guardada se descargó${fechaCopia ? ` el ${fechaCopia}` : ''} para que siga disponible si cambia el enlace. La versión oficial es siempre la publicada por el partido.</p>`
        : ''
    }`;
}

/**
 * Resumen por temas. Recorre siempre todos los temas en el mismo orden:
 * - lista vacía → «No aborda este tema en su programa» (el tema se ha revisado y no aparece);
 * - tema ausente del archivo → «Tema aún no resumido».
 */
export function htmlResumen(resumen, partido, temas) {
  const url = urlSegura(partido.programa?.url_oficial);
  const porTema = new Map((Array.isArray(resumen.temas) ? resumen.temas : []).map((t) => [t.tema, t]));
  const ejemplo = resumen.ejemplo === true ? ' <span class="etiqueta etiqueta--ejemplo">Ejemplo ficticio</span>' : '';

  const bloques = temas
    .map((tema) => {
      const entrada = porTema.get(tema.id);
      let contenido;
      if (!entrada) {
        contenido = '<p class="sin-datos">Tema aún no resumido.</p>';
      } else if (!Array.isArray(entrada.puntos) || entrada.puntos.length === 0) {
        contenido = '<p class="sin-datos">No aborda este tema en su programa.</p>';
      } else {
        contenido = `<ul class="resumen__puntos">${entrada.puntos
          .map(
            (punto) => `
              <li>${escapar(punto.texto)}
                <span class="resumen__pagina">${punto.pagina ? `(pág. ${escapar(punto.pagina)})` : '(página sin indicar)'}</span>
              </li>`,
          )
          .join('')}</ul>`;
      }
      return `<div class="resumen__tema"><h3>${escapar(tema.nombre)}</h3>${contenido}</div>`;
    })
    .join('');

  const datos = [
    escapar(resumen.autor || 'Elaborado por este proyecto'),
    resumen.fecha_elaboracion && `el ${formatearFecha(resumen.fecha_elaboracion)}`,
  ].filter(Boolean).join(' ');

  return `
    <div class="aviso aviso--importante" role="note">
      <p><strong>Resumen elaborado por este proyecto; no sustituye al programa oficial.</strong>
      Cada punto indica la página del programa donde puedes comprobarlo${
        url ? `: ${enlaceExterno(url, 'consulta el programa oficial (PDF)')}` : ''
      }.</p>
    </div>
    <p class="ayuda">${datos}. ${resumen.revisado === true ? 'Revisado y contrastado con el programa.' : 'Pendiente de revisión.'}${ejemplo}</p>
    ${resumen.introduccion ? `<p class="resumen__intro">${escapar(resumen.introduccion)}</p>` : ''}
    <div class="resumen">${bloques}</div>`;
}
