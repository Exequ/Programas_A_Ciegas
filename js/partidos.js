// Sección «Partidos y programas»: directorio (#/partidos) y ficha de cada partido (#/partidos/<id>).
// No se guarda ni se envía qué partidos se consultan.
import {
  AMBITOS,
  filtrarPartidos,
  htmlDatosPartido,
  htmlProgramaPartido,
  htmlResumen,
  htmlTarjetaPartido,
  ordenarPartidos,
  partidosDelDirectorio,
  programaPublicado,
  rutaRelativa,
} from './partidos-logica.js';
import { escapar } from './utilidades.js';

// Filtros del directorio mientras la pestaña esté abierta (en memoria; no se guardan).
const filtros = { ambito: '', texto: '' };

export function pintarPartidos(contenedor, datos, parametros = []) {
  return parametros[0] ? pintarFicha(contenedor, datos, parametros[0]) : pintarDirectorio(contenedor, datos);
}

// ---------- Directorio ----------

function pintarDirectorio(contenedor, datos) {
  const orden = datos.config?.directorio?.orden ?? 'alfabetico';
  // El orden se calcula una vez por visita (si es aleatorio, cambia en cada visita).
  const partidos = ordenarPartidos(partidosDelDirectorio(datos.todosPartidos), orden);
  const ejemplos = ordenarPartidos(partidosDelDirectorio(datos.partidosEjemplo), 'alfabetico');

  const radiosAmbito = [['', 'Todos'], ...Object.entries(AMBITOS)]
    .map(
      ([valor, etiqueta]) => `
        <label>
          <input type="radio" name="ambito" value="${valor}" ${filtros.ambito === valor ? 'checked' : ''}>
          <span>${etiqueta}</span>
        </label>`,
    )
    .join('');

  contenedor.innerHTML = `
    <h1 tabindex="-1">Partidos y programas</h1>
    <p class="entradilla">
      Candidaturas a las elecciones generales del 29 de noviembre de 2026, con el enlace a su programa electoral
      y un resumen elaborado por este proyecto cuando el programa esté publicado.
    </p>
    <p class="ayuda">
      ${orden === 'aleatorio' ? 'El orden de la lista es aleatorio y cambia en cada visita.' : 'Orden alfabético.'}
      Todas las candidaturas se presentan con el mismo formato, sin logos ni colores.
    </p>

    <form class="filtros-directorio" role="search" aria-label="Buscar partidos">
      <div class="campo-busqueda">
        <label for="buscar-partido">Buscar por nombre, siglas o territorio</label>
        <input type="search" id="buscar-partido" name="texto" value="${escapar(filtros.texto)}" autocomplete="off">
      </div>
      <fieldset class="filtro-ambito">
        <legend>Ámbito</legend>
        <div class="segmentado">${radiosAmbito}</div>
      </fieldset>
    </form>

    <p class="contador" data-contador aria-live="polite"></p>
    <ul class="rejilla-partidos" data-lista></ul>

    ${
      ejemplos.length
        ? `<section class="bloque" aria-labelledby="titulo-ejemplo">
             <h2 id="titulo-ejemplo">Fichas de ejemplo (ficticias)</h2>
             <p class="aviso aviso--importante">Estos partidos son <strong>inventados</strong> y solo sirven para probar el diseño de las fichas mientras no haya datos reales.</p>
             <ul class="rejilla-partidos">${ejemplos.map(htmlTarjetaPartido).join('')}</ul>
           </section>`
        : ''
    }`;

  const lista = contenedor.querySelector('[data-lista]');
  const contador = contenedor.querySelector('[data-contador]');
  const actualizar = () => {
    const visibles = filtrarPartidos(partidos, filtros);
    lista.innerHTML = visibles.map(htmlTarjetaPartido).join('');
    contador.textContent =
      visibles.length === 0
        ? 'Ninguna candidatura coincide con la búsqueda.'
        : `${visibles.length} ${visibles.length === 1 ? 'candidatura' : 'candidaturas'}${visibles.length < partidos.length ? ` de ${partidos.length}` : ''}.`;
  };

  const formulario = contenedor.querySelector('form');
  formulario.addEventListener('input', () => {
    filtros.texto = formulario.elements.texto.value;
    filtros.ambito = formulario.elements.ambito.value;
    actualizar();
  });
  formulario.addEventListener('submit', (evento) => evento.preventDefault());
  actualizar();
}

// ---------- Ficha ----------

async function pintarFicha(contenedor, datos, id) {
  const todos = [...datos.todosPartidos, ...datos.partidosEjemplo];
  const partido = todos.find((p) => p.id === id && p.en_directorio === true);
  const volver = '<p class="miga"><a href="#/partidos">← Todos los partidos</a></p>';

  if (!partido) {
    contenedor.innerHTML = `
      ${volver}
      <h1 tabindex="-1">Partido no encontrado</h1>
      <p>No hay ninguna ficha con esta dirección. Puede que el partido no forme parte del directorio.</p>`;
    return 'Partido no encontrado';
  }

  const relacionados = partido.ejemplo ? datos.partidosEjemplo : datos.todosPartidos;
  contenedor.innerHTML = `
    ${volver}
    <h1 tabindex="-1">${escapar(partido.nombre)}</h1>
    ${
      partido.ejemplo
        ? '<p class="aviso aviso--importante"><strong>Partido ficticio de ejemplo.</strong> Esta ficha es inventada y solo sirve para probar el diseño.</p>'
        : ''
    }
    ${partido.verificar === true ? '<p class="aviso">Algunos datos de esta ficha están pendientes de confirmar tras la proclamación oficial de candidaturas.</p>' : ''}
    ${htmlDatosPartido(partido, relacionados)}

    <section class="bloque" aria-labelledby="titulo-programa">
      <h2 id="titulo-programa">Programa electoral</h2>
      ${htmlProgramaPartido(partido)}
    </section>

    <section class="bloque" aria-labelledby="titulo-resumen" data-resumen></section>`;

  await pintarResumen(contenedor.querySelector('[data-resumen]'), partido, datos);
  return partido.nombre;
}

async function pintarResumen(seccion, partido, datos) {
  const ruta = rutaRelativa(partido.resumen);
  if (!ruta) {
    // Sin resumen: solo se menciona si el programa ya está publicado.
    if (programaPublicado(partido)) {
      seccion.innerHTML = '<h2 id="titulo-resumen">Resumen del programa</h2><p class="sin-datos">El resumen de este programa está en preparación.</p>';
    } else {
      seccion.remove();
    }
    return;
  }
  let resumen;
  try {
    const respuesta = await fetch(ruta, { cache: 'no-cache' });
    if (!respuesta.ok) throw new Error(String(respuesta.status));
    resumen = await respuesta.json();
  } catch {
    seccion.innerHTML = '<h2 id="titulo-resumen">Resumen del programa</h2><p class="aviso aviso--error">No se ha podido cargar el resumen.</p>';
    return;
  }
  // Todos los temas, en el mismo orden para todos los partidos.
  const temas = await cargarTemas();
  seccion.innerHTML = `<h2 id="titulo-resumen">Resumen del programa</h2>${htmlResumen(resumen, partido, temas)}`;
}

let promesaTemas = null;
/** Todos los temas de temas.json (datos.temas solo incluye los temas con propuestas en el juego). */
function cargarTemas() {
  promesaTemas ??= fetch('data/temas.json', { cache: 'no-cache' }).then((r) => r.json());
  return promesaTemas;
}
