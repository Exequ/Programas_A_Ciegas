// Punto de entrada: carga los datos y muestra la página según la dirección (#/juego, #/test…).
import { cargarDatos } from './datos.js';
import { pintarPagina } from './paginas.js';
import { enfocarTitulo, escapar } from './utilidades.js';

const NOMBRE_WEB = 'Programas a ciegas';

const RUTAS = {
  '': { titulo: null, pintar: (c, d) => pintarPagina('pagina-inicio', c, d) },
  juego: { titulo: 'Adivina el partido', pintar: async (c, d) => (await import('./juego.js')).pintarJuego(c, d) },
  test: { titulo: 'Test de afinidad', pintar: async (c, d) => (await import('./test.js')).pintarTest(c, d) },
  partidos: { titulo: 'Partidos y programas', pintar: async (c, d, p) => (await import('./partidos.js')).pintarPartidos(c, d, p) },
  conoces: { titulo: '¿Conoces a tu partido?', pintar: async (c, d) => (await import('./conoces.js')).pintarConoces(c, d) },
  resultados: { titulo: 'Resultados', pintar: async (c, d) => (await import('./resultados.js')).pintarResultados(c, d) },
  metodologia: { titulo: 'Metodología y fuentes', pintar: (c, d) => pintarPagina('pagina-metodologia', c, d) },
  sobre: { titulo: 'Sobre el proyecto', pintar: (c, d) => pintarPagina('pagina-sobre', c, d) },
};

const principal = document.getElementById('contenido');
let primeraCarga = true;

/** Ruta y parámetros de la dirección: «#/partidos/psoe» → { ruta: 'partidos', parametros: ['psoe'] }. */
function rutaActual() {
  const hash = location.hash;
  if (!hash.startsWith('#/')) return { ruta: '', parametros: [] };
  const [ruta, ...parametros] = hash.slice(2).split('?')[0].split('/').map(decodeURIComponent);
  return ruta in RUTAS ? { ruta, parametros: parametros.filter(Boolean) } : { ruta: '', parametros: [] };
}

async function navegar() {
  // Los enlaces internos tipo #contenido no cambian de página.
  if (location.hash && !location.hash.startsWith('#/')) return;

  const { ruta, parametros } = rutaActual();
  const { titulo, pintar } = RUTAS[ruta];
  document.title = titulo ? `${titulo} · ${NOMBRE_WEB}` : `${NOMBRE_WEB} · Lee los programas electorales sin saber de quién son`;

  for (const enlace of document.querySelectorAll('[data-ruta]')) {
    if (enlace.dataset.ruta === ruta) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }

  // Cada página se pinta en un contenedor nuevo: así no se acumulan eventos de páginas anteriores.
  const contenedor = document.createElement('div');
  contenedor.className = `pagina pagina--${ruta || 'inicio'}`;
  try {
    const datos = await cargarDatos();
    document.getElementById('banner-ejemplo').hidden = !datos.modoEjemplo;
    // Una página puede devolver su propio título (por ejemplo, la ficha de un partido).
    const tituloPropio = await pintar(contenedor, datos, parametros);
    if (typeof tituloPropio === 'string') document.title = `${tituloPropio} · ${NOMBRE_WEB}`;
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `
      <h1 tabindex="-1">No se han podido cargar los datos</h1>
      <p class="aviso aviso--error">${escapar(error.message)}</p>`;
  }
  principal.replaceChildren(contenedor);

  if (!primeraCarga) {
    window.scrollTo(0, 0);
    enfocarTitulo(contenedor);
  }
  primeraCarga = false;
}

document.querySelector('[data-saltar]').addEventListener('click', (evento) => {
  evento.preventDefault();
  principal.focus();
});

window.addEventListener('hashchange', navegar);
navegar();
