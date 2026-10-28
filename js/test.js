// Modo «Test de afinidad».
import { RESPUESTAS, SIN_CRITERIO } from './afinidad.js';
import {
  enfocarTitulo,
  escapar,
  etiquetaEjemplo,
  guardarSesion,
  htmlSinPropuestas,
  seleccionEquilibrada,
} from './utilidades.js';

const IMPORTANCIAS = [
  { id: 'poco', etiqueta: 'Poco importante' },
  { id: 'normal', etiqueta: 'Normal' },
  { id: 'importante', etiqueta: 'Importante' },
];

// Se conserva mientras la pestaña esté abierta, por si sales a leer la metodología y vuelves.
let estado = null;

export function pintarTest(contenedor, datos) {
  if (datos.propuestas.length === 0) {
    contenedor.innerHTML = htmlSinPropuestas('Test de afinidad');
    return;
  }
  estado ??= { fase: 'config', duracion: null, importancia: {} };

  const pintar = (enfocar) => {
    contenedor.innerHTML = estado.fase === 'config' ? htmlConfig(datos) : htmlPregunta(datos);
    if (enfocar) {
      window.scrollTo(0, 0);
      enfocarTitulo(contenedor, enfocar);
    }
  };

  const responder = (valor) => {
    const propuesta = estado.lista[estado.indice];
    estado.respuestas.set(propuesta.id, valor);
    if (estado.indice < estado.lista.length - 1) {
      estado.indice++;
      pintar('h1');
    } else {
      finalizar(datos);
    }
  };

  contenedor.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const formulario = new FormData(evento.target);
    estado.duracion = formulario.get('duracion');
    for (const tema of datos.temas) estado.importancia[tema.id] = formulario.get(`importancia-${tema.id}`) ?? 'normal';

    const opcion = opcionesDuracion(datos).find((o) => o.id === estado.duracion);
    estado.lista = seleccionEquilibrada(datos.propuestas, opcion?.propuestas ?? null);
    estado.respuestas = new Map();
    estado.indice = 0;
    estado.fase = 'pregunta';
    pintar('h1');
  });

  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const accion = boton.dataset.accion;
    if (accion === 'responder') {
      responder(boton.dataset.valor === '' ? null : Number(boton.dataset.valor));
    } else if (accion === 'anterior' && estado.indice > 0) {
      estado.indice--;
      pintar('h1');
    } else if (accion === 'siguiente' && estado.indice < estado.lista.length - 1) {
      estado.indice++;
      pintar('h1');
    } else if (accion === 'terminar') {
      finalizar(datos);
    } else if (accion === 'reiniciar') {
      estado.fase = 'config';
      pintar('h1');
    }
  });

  // Importancia del tema marcada durante el test: se aplica a todas las propuestas de ese tema.
  contenedor.addEventListener('change', (evento) => {
    const campo = evento.target;
    if (estado.fase === 'pregunta' && campo.name?.startsWith('importancia-')) {
      estado.importancia[campo.name.slice('importancia-'.length)] = campo.value;
    }
  });

  // Atajos de teclado: 1–5 para la escala y 0 para «No tengo criterio suficiente».
  const alPulsarTecla = (evento) => {
    if (!contenedor.isConnected) {
      document.removeEventListener('keydown', alPulsarTecla);
      return;
    }
    if (estado.fase !== 'pregunta' || evento.altKey || evento.ctrlKey || evento.metaKey) return;
    if (evento.target.closest?.('input:not([type="radio"]), textarea, select, summary')) return;
    const respuesta = [...RESPUESTAS, SIN_CRITERIO].find((r) => r.tecla === evento.key);
    if (respuesta) {
      evento.preventDefault();
      responder(respuesta.valor);
    }
  };
  document.addEventListener('keydown', alPulsarTecla);

  pintar();
}

// ---------- Lógica ----------

/** Duraciones posibles según cuántas propuestas haya (sin ofrecer «20» si solo hay 12). */
function opcionesDuracion(datos) {
  const total = datos.propuestas.length;
  const duraciones = datos.config?.test?.duraciones ?? [{ id: 'completo', nombre: 'Completo', propuestas: null }];
  return duraciones
    .filter((d) => d.propuestas == null || d.propuestas < total)
    .map((d) => ({ ...d, cantidad: d.propuestas ?? total }));
}

function factorTema(datos, temaId) {
  const config = datos.config?.test ?? {};
  const importancia = estado.importancia[temaId];
  if (importancia === 'importante') return config.peso_tema_importante ?? 2;
  if (importancia === 'poco') return config.peso_tema_poco_importante ?? 0.5;
  return 1;
}

function finalizar(datos) {
  // Solo las propuestas a las que se llegó (si se termina antes, las demás no cuentan).
  const items = estado.lista
    .filter((p) => estado.respuestas.has(p.id))
    .map((p) => ({
      id: p.id,
      partido: p.partido,
      tema: p.tema,
      mostrado: p.mostrado,
      texto: p.texto,
      pagina: p.pagina,
      url_fuente: p.url_fuente,
      ejemplo: p.ejemplo === true,
      valor: estado.respuestas.get(p.id),
      peso: p.peso * factorTema(datos, p.tema),
    }));

  const copiaPartido = ({ id, nombre, siglas, color, url_programa }) => ({ id, nombre, siglas, color, url_programa });
  guardarSesion('pac-test', {
    fecha: new Date().toISOString(),
    modoEjemplo: datos.modoEjemplo,
    partidos: datos.partidos.map(copiaPartido),
    programas: datos.partidosOficiales.map(copiaPartido),
    temas: datos.temas.map(({ id, nombre }) => ({ id, nombre })),
    items,
  });

  estado.fase = 'config';
  location.hash = '#/resultados';
}

// ---------- Vistas ----------

function htmlAvisoNoRecomendacion() {
  return `
    <div class="aviso aviso--importante" role="note">
      <p><strong>Esto no es una recomendación de voto ni un sondeo.</strong>
      Mide cuánto coincides con una selección de propuestas concretas, no con los partidos en su conjunto.</p>
    </div>`;
}

function htmlConfig(datos) {
  const opciones = opcionesDuracion(datos);
  const elegida = opciones.some((o) => o.id === estado.duracion) ? estado.duracion : opciones[0]?.id;

  const radiosDuracion = opciones
    .map(
      (o) => `
      <label class="casilla">
        <input type="radio" name="duracion" value="${escapar(o.id)}" ${o.id === elegida ? 'checked' : ''}>
        <span><strong>${escapar(o.nombre)}</strong> · ${o.cantidad} propuestas</span>
      </label>`,
    )
    .join('');

  const filasImportancia = datos.temas
    .map(
      (tema) => `
        <fieldset class="importancia__fila">
          <legend>${escapar(tema.nombre)}</legend>
          ${htmlSelectorImportancia(tema)}
        </fieldset>`,
    )
    .join('');

  return `
    <h1 tabindex="-1">Test de afinidad</h1>
    ${htmlAvisoNoRecomendacion()}
    <p class="entradilla bloque">
      Verás propuestas de los programas una a una, sin saber de qué partido son. Di qué te parece cada una.
      Al final verás con qué partidos coinciden más tus respuestas y de quién era cada propuesta.
    </p>
    <form class="formulario">
      <fieldset>
        <legend>Duración</legend>
        <p class="ayuda">Las propuestas se eligen al azar, repartidas por igual entre partidos y temas.</p>
        <div class="casillas">${radiosDuracion}</div>
      </fieldset>
      <fieldset>
        <legend>¿Qué temas te importan más? <span class="opcional">(opcional)</span></legend>
        <p class="ayuda">
          Tus respuestas en los temas importantes cuentan el doble; en los poco importantes, la mitad.
          Si no tocas nada, todos cuentan igual. También puedes cambiarlo durante el test, en cada propuesta.
        </p>
        <div class="importancia">${filasImportancia}</div>
      </fieldset>
      <button type="submit" class="boton boton--primario">Empezar el test</button>
    </form>`;
}

function htmlPregunta(datos) {
  const { lista, indice, respuestas } = estado;
  const propuesta = lista[indice];
  const tema = datos.temaPorId.get(propuesta.tema);
  const actual = respuestas.has(propuesta.id) ? respuestas.get(propuesta.id) : undefined;

  const botonRespuesta = (r, clase = '') => `
    <button type="button" class="respuesta ${clase}" data-accion="responder" data-valor="${r.valor ?? ''}"
      aria-pressed="${actual === r.valor}" aria-keyshortcuts="${r.tecla}">${r.etiqueta}</button>`;

  return `
    <div class="progreso">
      <h1 tabindex="-1">Propuesta ${indice + 1} de ${lista.length}</h1>
      <span>${respuestas.size} ${respuestas.size === 1 ? 'respondida' : 'respondidas'}</span>
    </div>
    <div class="barra-progreso" aria-hidden="true"><span style="width: ${(indice / lista.length) * 100}%"></span></div>

    <article class="tarjeta propuesta" aria-label="Propuesta">
      <div class="etiquetas">
        <span class="etiqueta">${escapar(tema.nombre)}</span>
        ${etiquetaEjemplo(propuesta)}
      </div>
      <blockquote class="propuesta__texto">${escapar(propuesta.mostrado)}</blockquote>
    </article>

    <fieldset class="respuestas">
      <legend class="pregunta-titulo">¿Qué te parece esta propuesta?</legend>
      <div class="escala">${RESPUESTAS.map((r) => botonRespuesta(r)).join('')}</div>
      ${botonRespuesta(SIN_CRITERIO, 'respuesta--saltar')}
    </fieldset>

    <fieldset class="importancia-tema">
      <legend>¿Cuánto te importa el tema «${escapar(tema.nombre)}»?</legend>
      ${htmlSelectorImportancia(tema)}
    </fieldset>

    <div class="navegacion-test">
      <span>
        ${indice > 0 ? '<button type="button" class="boton boton--secundario boton--pequeno" data-accion="anterior">← Anterior</button>' : ''}
        ${actual !== undefined && indice < lista.length - 1 ? '<button type="button" class="boton boton--secundario boton--pequeno" data-accion="siguiente">Siguiente →</button>' : ''}
      </span>
      <span>
        ${respuestas.size > 0 ? '<button type="button" class="boton boton--texto boton--pequeno" data-accion="terminar">Terminar ahora y ver resultados</button>' : ''}
        <button type="button" class="boton boton--texto boton--pequeno" data-accion="reiniciar">Volver a empezar</button>
      </span>
    </div>
    <p class="atajos">Atajos de teclado: teclas 1 a 5 para responder de «Muy a favor» a «Muy en contra» y 0 para «No tengo criterio suficiente».</p>`;
}

/** Botones Poco importante / Normal / Importante para un tema. */
function htmlSelectorImportancia(tema) {
  const actual = estado.importancia[tema.id] ?? 'normal';
  const opciones = IMPORTANCIAS.map(
    (i) => `
      <label>
        <input type="radio" name="importancia-${escapar(tema.id)}" value="${i.id}" ${i.id === actual ? 'checked' : ''}>
        <span>${i.etiqueta}</span>
      </label>`,
  ).join('');
  return `<div class="segmentado">${opciones}</div>`;
}
