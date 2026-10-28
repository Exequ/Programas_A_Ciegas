// Modo «¿Conoces a tu partido?».
// Privacidad: el partido elegido y las respuestas solo viven en la memoria de esta página;
// no se guardan (ni siquiera en sessionStorage) ni se envían a ningún sitio.
import { RESPUESTAS_CONOCES, evaluarRespuesta, propuestasDisponibles, preguntasPosibles, seleccionarPreguntas } from './conoces-logica.js';
import { htmlResultadoConoces } from './conoces-resultado.js';
import {
  barajar,
  enfocarTitulo,
  enlaceFuente,
  escapar,
  etiquetaEjemplo,
  htmlPuntoPartido,
  htmlSinPropuestas,
} from './utilidades.js';

let estado = null;

export function pintarConoces(contenedor, datos) {
  if (datos.partidos.length < 2) {
    contenedor.innerHTML = htmlSinPropuestas('¿Conoces a tu partido?');
    return;
  }
  const ajustes = leerAjustes(datos);
  estado ??= { fase: 'eleccion', partido: null, total: ajustes.preguntas[0], temas: datos.temas.map((t) => t.id) };
  // Orden aleatorio en cada visita: ningún partido aparece siempre el primero.
  const orden = barajar(datos.partidos);

  const pintar = (enfocar) => {
    if (estado.fase === 'eleccion') {
      contenedor.innerHTML = htmlEleccion(datos, orden, ajustes);
      actualizarContador(contenedor, datos, ajustes);
    } else if (estado.fase === 'pregunta') {
      contenedor.innerHTML = htmlPregunta(datos);
    } else {
      contenedor.innerHTML = htmlResultadoConoces(estado, datos);
    }
    if (enfocar) {
      if (enfocar === 'h1') window.scrollTo(0, 0);
      enfocarTitulo(contenedor, enfocar);
    }
  };

  const empezar = () => {
    const resultado = seleccionarPreguntas(datos.propuestas, estado.partido, {
      total: estado.total,
      proporcion: ajustes.proporcion,
      temas: estado.temas,
      minimo: ajustes.minimo,
    });
    if (resultado.insuficiente) return false;
    estado.rondas = resultado.preguntas.map((propuesta) => ({ propuesta, respuesta: null }));
    estado.reducido = resultado.reducido;
    estado.indice = 0;
    estado.fase = 'pregunta';
    return true;
  };

  const responder = (respuesta) => {
    const ronda = estado.rondas[estado.indice];
    if (ronda.respuesta) return;
    ronda.respuesta = respuesta;
    pintar('#titulo-revelacion');
  };

  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const accion = boton.dataset.accion;

    if (accion === 'todos' || accion === 'ninguno') {
      for (const casilla of contenedor.querySelectorAll('input[name="tema"]')) casilla.checked = accion === 'todos';
      actualizarContador(contenedor, datos, ajustes);
    } else if (accion === 'responder') {
      responder(boton.dataset.respuesta);
    } else if (accion === 'siguiente') {
      if (estado.indice < estado.rondas.length - 1) estado.indice++;
      else estado.fase = 'final';
      pintar('h1');
    } else if (accion === 'repetir') {
      if (!empezar()) estado.fase = 'eleccion';
      pintar('h1');
    } else if (accion === 'otro-partido' || accion === 'salir') {
      estado.fase = 'eleccion';
      estado.partido = null;
      pintar('h1');
    }
  });

  contenedor.addEventListener('change', () => {
    if (estado.fase === 'eleccion') actualizarContador(contenedor, datos, ajustes);
  });

  contenedor.addEventListener('submit', (evento) => {
    evento.preventDefault();
    leerFormulario(contenedor);
    const error = contenedor.querySelector('[data-error]');
    if (!estado.partido) {
      error.textContent = 'Elige un partido para empezar.';
    } else if (estado.temas.length === 0) {
      error.textContent = 'Marca al menos un tema.';
    } else if (!empezar()) {
      error.textContent = mensajeInsuficiente(datos, ajustes);
    } else {
      pintar('h1');
    }
  });

  // Atajos de teclado: 1 = Sí, 2 = No, 0 = No lo sé.
  const alPulsarTecla = (evento) => {
    if (!contenedor.isConnected) {
      document.removeEventListener('keydown', alPulsarTecla);
      return;
    }
    if (estado.fase !== 'pregunta' || evento.altKey || evento.ctrlKey || evento.metaKey) return;
    if (evento.target.closest?.('input:not([type="radio"]), textarea, select')) return;
    const respuesta = RESPUESTAS_CONOCES.find((r) => r.tecla === evento.key);
    if (respuesta && !estado.rondas[estado.indice].respuesta) {
      evento.preventDefault();
      responder(respuesta.id);
    }
  };
  document.addEventListener('keydown', alPulsarTecla);

  pintar();
}

// ---------- Lógica ----------

function leerAjustes(datos) {
  const config = datos.config?.conoces ?? {};
  return {
    preguntas: Array.isArray(config.preguntas) && config.preguntas.length ? config.preguntas : [10, 15, 20],
    proporcion: typeof config.proporcion_partido === 'number' ? config.proporcion_partido : 0.5,
    minimo: config.minimo_preguntas ?? 6,
  };
}

function leerFormulario(contenedor) {
  const formulario = new FormData(contenedor.querySelector('form'));
  estado.partido = formulario.get('partido');
  estado.total = Number(formulario.get('total')) || estado.total;
  estado.temas = formulario.getAll('tema');
}

function maximoPosible(datos, ajustes) {
  const { propias, ajenas } = propuestasDisponibles(datos.propuestas, estado.partido, estado.temas);
  return preguntasPosibles(propias.length, ajenas.length, ajustes.proporcion);
}

function mensajeInsuficiente(datos, ajustes) {
  const partido = datos.partidoPorId.get(estado.partido);
  const filtrado = estado.temas.length < datos.temas.length;
  return (
    `Todavía no hay suficientes propuestas de ${partido.nombre}${filtrado ? ' en los temas marcados' : ''} ` +
    `para un test con sentido (hacen falta al menos ${ajustes.minimo} preguntas). ` +
    (filtrado ? 'Prueba a marcar más temas.' : 'Prueba más adelante, cuando se añadan más propuestas.')
  );
}

function actualizarContador(contenedor, datos, ajustes) {
  leerFormulario(contenedor);
  const contador = contenedor.querySelector('[data-contador]');
  contenedor.querySelector('[data-error]').textContent = '';
  if (!estado.partido || estado.temas.length === 0) {
    contador.textContent = '';
    return;
  }
  const maximo = maximoPosible(datos, ajustes);
  if (maximo < ajustes.minimo) contador.textContent = mensajeInsuficiente(datos, ajustes);
  else if (maximo < estado.total) contador.textContent = `Con estos filtros hay propuestas para ${maximo} preguntas: el test tendrá ${maximo}.`;
  else contador.textContent = '';
}

// ---------- Vistas ----------

function htmlAviso() {
  return `
    <div class="aviso aviso--importante" role="note">
      <p><strong>Es un juego divulgativo basado en propuestas concretas; no es una recomendación de voto.</strong>
      El partido que elijas y tus respuestas no se guardan ni se envían a ningún sitio.</p>
    </div>`;
}

function htmlEleccion(datos, orden, ajustes) {
  const radiosPartidos = orden
    .map(
      (p) => `
      <label class="casilla">
        <input type="radio" name="partido" value="${escapar(p.id)}" ${p.id === estado.partido ? 'checked' : ''}>
        <span>${escapar(p.nombre)}${p.siglas && p.siglas !== p.nombre ? ` (${escapar(p.siglas)})` : ''}</span>
      </label>`,
    )
    .join('');

  const radiosTotal = ajustes.preguntas
    .map(
      (n) => `
      <label class="casilla">
        <input type="radio" name="total" value="${n}" ${n === estado.total ? 'checked' : ''}>
        <span>${n} preguntas</span>
      </label>`,
    )
    .join('');

  const marcados = new Set(estado.temas);
  const casillasTemas = datos.temas
    .map(
      (t) => `
      <label class="casilla">
        <input type="checkbox" name="tema" value="${escapar(t.id)}" ${marcados.has(t.id) ? 'checked' : ''}>
        <span>${escapar(t.nombre)}</span>
      </label>`,
    )
    .join('');

  return `
    <h1 tabindex="-1">¿Conoces a tu partido?</h1>
    ${htmlAviso()}
    <p class="entradilla bloque">
      Elige un partido: el que votas o el que quieras comprobar. Te mostraremos propuestas sin decir de quién son;
      unas serán de ese partido y otras de otros. En cada una, di si crees que es suya.
    </p>
    <form class="formulario" novalidate>
      <fieldset>
        <legend>Elige un partido</legend>
        <p class="ayuda">El orden de la lista es aleatorio.</p>
        <div class="casillas">${radiosPartidos}</div>
      </fieldset>
      <fieldset>
        <legend>Número de preguntas</legend>
        <div class="casillas">${radiosTotal}</div>
      </fieldset>
      <fieldset>
        <legend>Temas <span class="opcional">(opcional)</span></legend>
        <div class="marcar-todos">
          <button type="button" class="boton boton--texto boton--pequeno" data-accion="todos">Marcar todos<span class="sr-only"> los temas</span></button>
          <button type="button" class="boton boton--texto boton--pequeno" data-accion="ninguno">Ninguno<span class="sr-only"> de los temas</span></button>
        </div>
        <div class="casillas">${casillasTemas}</div>
      </fieldset>
      <p class="contador" data-contador aria-live="polite"></p>
      <p class="error-formulario" data-error role="alert"></p>
      <button type="submit" class="boton boton--primario">Empezar</button>
    </form>`;
}

function htmlPregunta(datos) {
  const { rondas, indice } = estado;
  const { propuesta, respuesta } = rondas[indice];
  const partido = datos.partidoPorId.get(estado.partido);
  const tema = datos.temaPorId.get(propuesta.tema);
  const respondida = respuesta !== null;
  const aciertos = rondas.filter((r) => r.respuesta && evaluarRespuesta(r.propuesta, estado.partido, r.respuesta) === 'acierto').length;
  const avance = ((indice + (respondida ? 1 : 0)) / rondas.length) * 100;

  const botones = RESPUESTAS_CONOCES.map((r) => {
    const elegida = r.id === respuesta;
    return `
      <button type="button" class="opcion opcion--centrada ${respondida && !elegida ? 'opcion--apagada' : ''} ${elegida ? 'opcion--elegida' : ''}"
        data-accion="responder" data-respuesta="${r.id}" aria-keyshortcuts="${r.tecla}" ${respondida ? 'disabled' : ''}>
        <span>${r.etiqueta}</span>${elegida ? '<span class="sr-only"> (tu respuesta)</span>' : ''}
      </button>`;
  }).join('');

  return `
    <div class="progreso">
      <h1 tabindex="-1">Pregunta ${indice + 1} de ${rondas.length}</h1>
      <span>Aciertos: ${aciertos}</span>
    </div>
    <div class="barra-progreso" aria-hidden="true"><span style="width: ${avance}%"></span></div>
    ${
      estado.reducido && indice === 0
        ? `<p class="aviso aviso--separado">Con los filtros elegidos solo hay propuestas suficientes para ${rondas.length} preguntas.</p>`
        : ''
    }

    <article class="tarjeta propuesta" aria-label="Propuesta">
      <div class="etiquetas">
        <span class="etiqueta">${escapar(tema.nombre)}</span>
        ${etiquetaEjemplo(propuesta)}
      </div>
      <blockquote class="propuesta__texto">${escapar(propuesta.mostrado)}</blockquote>
    </article>

    <fieldset class="opciones">
      <legend class="pregunta-titulo">¿Es una propuesta de ${escapar(partido.nombre)}?</legend>
      <div class="opciones__botones opciones__botones--tres">${botones}</div>
    </fieldset>

    ${respondida ? htmlRevelacion(datos, rondas[indice]) : ''}

    <div class="acciones">
      <button type="button" class="boton boton--texto" data-accion="salir">Salir y elegir otro partido</button>
    </div>
    <p class="atajos">Atajos de teclado: 1 = Sí, 2 = No, 0 = No lo sé.</p>`;
}

function htmlRevelacion(datos, { propuesta, respuesta }) {
  const real = datos.partidoPorId.get(propuesta.partido);
  const elegido = datos.partidoPorId.get(estado.partido);
  const resultado = evaluarRespuesta(propuesta, estado.partido, respuesta);
  const estadoTexto = { acierto: '✓ Has acertado', fallo: '✗ No has acertado', nose: 'Respondiste «No lo sé»' }[resultado];
  const clase = { acierto: 'revelacion--acierto', fallo: 'revelacion--fallo', nose: '' }[resultado];
  const esDelElegido = propuesta.partido === estado.partido;
  const ultima = estado.indice === estado.rondas.length - 1;
  const literalDistinto = propuesta.texto.trim() !== propuesta.mostrado;

  return `
    <section class="tarjeta revelacion ${clase}" aria-labelledby="titulo-revelacion">
      <h2 id="titulo-revelacion" tabindex="-1">
        <span class="revelacion__estado">${estadoTexto}</span>
        ${htmlPuntoPartido(real)}${
          esDelElegido
            ? `Sí, es una propuesta de ${escapar(real.nombre)}`
            : `Es una propuesta de ${escapar(real.nombre)}, no de ${escapar(elegido.nombre)}`
        }
      </h2>
      ${
        literalDistinto
          ? `<div class="literal"><p class="literal__etiqueta">Texto literal del programa</p><p>${escapar(propuesta.texto)}</p></div>`
          : ''
      }
      <p class="fuente">${enlaceFuente(propuesta, real)}</p>
      <div class="acciones">
        <button type="button" class="boton boton--primario" data-accion="siguiente">${ultima ? 'Ver mi resultado' : 'Siguiente pregunta'}</button>
      </div>
    </section>`;
}
