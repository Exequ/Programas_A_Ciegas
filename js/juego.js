// Modo juego «Adivina el partido».
import { htmlProgramas } from './paginas.js';
import {
  barajar,
  colorSeguro,
  enfocarTitulo,
  enlaceFuente,
  escapar,
  etiquetaEjemplo,
  guardarSesion,
  htmlSinPropuestas,
  seleccionEquilibrada,
} from './utilidades.js';

// El estado se conserva mientras la pestaña esté abierta: si vas a otra sección y vuelves, sigues donde estabas.
let estado = null;
// Propuestas ya vistas en esta visita, para no repetirlas en rondas siguientes mientras queden otras.
const vistas = new Set();

export function pintarJuego(contenedor, datos) {
  if (datos.partidos.length < 2) {
    contenedor.innerHTML = htmlSinPropuestas('Adivina el partido');
    return;
  }
  estado ??= {
    fase: 'config',
    temas: datos.temas.map((t) => t.id),
    partidos: datos.partidos.map((p) => p.id),
  };

  const pintar = (enfocar) => {
    const html = { config: htmlConfig, pregunta: htmlPregunta, final: htmlFinal }[estado.fase](datos);
    contenedor.innerHTML = html;
    if (estado.fase === 'config') actualizarContador(contenedor, datos);
    if (enfocar) {
      if (enfocar === 'h1') window.scrollTo(0, 0);
      enfocarTitulo(contenedor, enfocar);
    }
  };

  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const accion = boton.dataset.accion;

    if (accion === 'todos' || accion === 'ninguno') {
      for (const casilla of contenedor.querySelectorAll(`input[name="${boton.dataset.grupo}"]`)) {
        casilla.checked = accion === 'todos';
      }
      actualizarContador(contenedor, datos);
    } else if (accion === 'elegir') {
      const actual = estado.ronda[estado.indice];
      if (actual.eleccion) return;
      actual.eleccion = boton.dataset.partido;
      vistas.add(actual.propuesta.id);
      pintar('#titulo-revelacion');
    } else if (accion === 'siguiente') {
      if (estado.indice < estado.ronda.length - 1) {
        estado.indice++;
      } else {
        estado.fase = 'final';
        guardarResumen();
      }
      pintar('h1');
    } else if (accion === 'otra-ronda') {
      if (iniciarRonda(datos)) pintar('h1');
    } else if (accion === 'configurar' || accion === 'abandonar') {
      estado.fase = 'config';
      pintar('h1');
    }
  });

  contenedor.addEventListener('change', () => {
    if (estado.fase === 'config') actualizarContador(contenedor, datos);
  });

  contenedor.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const error = contenedor.querySelector('[data-error]');
    leerFiltros(contenedor);
    if (estado.partidos.length < 2) {
      error.textContent = 'Marca al menos 2 partidos para poder jugar.';
    } else if (estado.temas.length === 0) {
      error.textContent = 'Marca al menos un tema.';
    } else if (!iniciarRonda(datos)) {
      error.textContent = 'No hay propuestas con estos filtros. Prueba a marcar más temas o partidos.';
    } else {
      pintar('h1');
    }
  });

  pintar();
}

// ---------- Lógica ----------

function propuestasDisponibles(datos) {
  const temas = new Set(estado.temas);
  const partidos = new Set(estado.partidos);
  return datos.propuestas.filter((p) => temas.has(p.tema) && partidos.has(p.partido));
}

function iniciarRonda(datos) {
  const disponibles = propuestasDisponibles(datos);
  if (disponibles.length === 0) return false;

  const porRonda = datos.config?.juego?.propuestas_por_ronda ?? 10;
  const numOpciones = datos.config?.juego?.opciones_por_pregunta ?? 4;

  let candidatas = disponibles.filter((p) => !vistas.has(p.id));
  if (candidatas.length < Math.min(porRonda, disponibles.length)) {
    // Ya has visto casi todas: se vuelve a empezar con todas las disponibles.
    for (const p of disponibles) vistas.delete(p.id);
    candidatas = disponibles;
  }

  const elegidas = seleccionEquilibrada(candidatas, porRonda);
  estado.ronda = elegidas.map((propuesta) => {
    const otros = barajar(estado.partidos.filter((id) => id !== propuesta.partido)).slice(0, numOpciones - 1);
    const opciones = [propuesta.partido, ...otros]
      .map((id) => datos.partidoPorId.get(id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map((p) => p.id);
    return { propuesta, opciones, eleccion: null };
  });
  estado.indice = 0;
  estado.fase = 'pregunta';
  return true;
}

function leerFiltros(contenedor) {
  const marcados = (nombre) => [...contenedor.querySelectorAll(`input[name="${nombre}"]:checked`)].map((c) => c.value);
  estado.temas = marcados('tema');
  estado.partidos = marcados('partido');
}

function actualizarContador(contenedor, datos) {
  leerFiltros(contenedor);
  const n = propuestasDisponibles(datos).length;
  const porRonda = datos.config?.juego?.propuestas_por_ronda ?? 10;
  const contador = contenedor.querySelector('[data-contador]');
  contador.textContent =
    n === 0
      ? 'Con esta selección no hay propuestas disponibles.'
      : `Con esta selección hay ${n} ${n === 1 ? 'propuesta disponible' : 'propuestas disponibles'}` +
        (n < porRonda ? `: la ronda tendrá ${n}.` : '.');
  contenedor.querySelector('[data-error]').textContent = '';
}

function aciertos() {
  return estado.ronda.filter((r) => r.eleccion === r.propuesta.partido).length;
}

function guardarResumen() {
  guardarSesion('pac-juego', { aciertos: aciertos(), total: estado.ronda.length, fecha: new Date().toISOString() });
}

// ---------- Vistas ----------

function nombrePartido(partido) {
  return partido.siglas && partido.siglas !== partido.nombre
    ? `${escapar(partido.siglas)} <span class="opcion__nombre-largo">· ${escapar(partido.nombre)}</span>`
    : escapar(partido.nombre);
}

function puntoPartido(partido) {
  return `<span class="punto-partido" style="--color-partido: ${colorSeguro(partido.color)}" aria-hidden="true"></span>`;
}

function htmlCasillas(nombre, elementos, marcados) {
  const marcadosSet = new Set(marcados);
  return elementos
    .map(
      (e) => `
      <label class="casilla">
        <input type="checkbox" name="${nombre}" value="${escapar(e.id)}" ${marcadosSet.has(e.id) ? 'checked' : ''}>
        <span>${escapar(e.nombre)}</span>
      </label>`,
    )
    .join('');
}

function htmlBotonesMarcar(grupo, etiqueta) {
  return `
    <div class="marcar-todos">
      <button type="button" class="boton boton--texto boton--pequeno" data-accion="todos" data-grupo="${grupo}">Marcar todos<span class="sr-only"> los ${etiqueta}</span></button>
      <button type="button" class="boton boton--texto boton--pequeno" data-accion="ninguno" data-grupo="${grupo}">Ninguno<span class="sr-only"> de los ${etiqueta}</span></button>
    </div>`;
}

function htmlConfig(datos) {
  const porRonda = datos.config?.juego?.propuestas_por_ronda ?? 10;
  return `
    <h1 tabindex="-1">Adivina el partido</h1>
    <p class="entradilla">
      Te mostraremos ${porRonda} propuestas de los programas electorales sin decirte de quién son.
      En cada una, elige el partido que crees que la propone.
    </p>
    <form class="formulario" novalidate>
      <fieldset>
        <legend>Temas</legend>
        ${htmlBotonesMarcar('tema', 'temas')}
        <div class="casillas">${htmlCasillas('tema', datos.temas, estado.temas)}</div>
      </fieldset>
      <fieldset>
        <legend>Partidos</legend>
        <p class="ayuda">Las propuestas y las opciones de respuesta saldrán solo de los partidos marcados (mínimo 2).</p>
        ${htmlBotonesMarcar('partido', 'partidos')}
        <div class="casillas">${htmlCasillas('partido', datos.partidos, estado.partidos)}</div>
      </fieldset>
      <p class="contador" data-contador aria-live="polite"></p>
      <p class="error-formulario" data-error role="alert"></p>
      <button type="submit" class="boton boton--primario">Empezar a jugar</button>
    </form>`;
}

function htmlPregunta(datos) {
  const { ronda, indice } = estado;
  const actual = ronda[indice];
  const { propuesta, eleccion } = actual;
  const tema = datos.temaPorId.get(propuesta.tema);
  const respondida = eleccion !== null;
  const avance = ((indice + (respondida ? 1 : 0)) / ronda.length) * 100;

  const botones = actual.opciones
    .map((id) => {
      const partido = datos.partidoPorId.get(id);
      let clase = '';
      let marca = '';
      if (respondida) {
        if (id === propuesta.partido) {
          clase = 'opcion--correcta';
          marca = '<span class="opcion__marca">✓ Correcta</span>';
        } else if (id === eleccion) {
          clase = 'opcion--incorrecta';
          marca = '<span class="opcion__marca">✗ Tu respuesta</span>';
        } else {
          clase = 'opcion--apagada';
        }
      }
      return `
        <button type="button" class="opcion ${clase}" data-accion="elegir" data-partido="${escapar(id)}" ${respondida ? 'disabled' : ''}>
          <span>${nombrePartido(partido)}</span>${marca}
        </button>`;
    })
    .join('');

  return `
    <div class="progreso">
      <h1 tabindex="-1">Propuesta ${indice + 1} de ${ronda.length}</h1>
      <span>Aciertos: ${aciertos()}</span>
    </div>
    <div class="barra-progreso" aria-hidden="true"><span style="width: ${avance}%"></span></div>

    <article class="tarjeta propuesta" aria-label="Propuesta">
      <div class="etiquetas">
        <span class="etiqueta">${escapar(tema.nombre)}</span>
        ${etiquetaEjemplo(propuesta)}
      </div>
      <blockquote class="propuesta__texto">${escapar(propuesta.mostrado)}</blockquote>
    </article>

    <fieldset class="opciones">
      <legend class="pregunta-titulo">¿Qué partido lo propone?</legend>
      <div class="opciones__botones">${botones}</div>
    </fieldset>

    ${respondida ? htmlRevelacion(datos, actual) : ''}

    <div class="acciones">
      <button type="button" class="boton boton--texto" data-accion="abandonar">Salir y cambiar filtros</button>
    </div>`;
}

function htmlRevelacion(datos, { propuesta, eleccion }) {
  const partido = datos.partidoPorId.get(propuesta.partido);
  const acierto = eleccion === propuesta.partido;
  const ultima = estado.indice === estado.ronda.length - 1;
  const literalDistinto = propuesta.texto.trim() !== propuesta.mostrado;

  return `
    <section class="tarjeta revelacion ${acierto ? 'revelacion--acierto' : 'revelacion--fallo'}" aria-labelledby="titulo-revelacion">
      <h2 id="titulo-revelacion" tabindex="-1">
        <span class="revelacion__estado">${acierto ? '✓ ¡Has acertado!' : '✗ No has acertado'}</span>
        Es una propuesta de ${escapar(partido.nombre)}
      </h2>
      ${
        literalDistinto
          ? `<div class="literal"><p class="literal__etiqueta">Texto literal del programa</p><p>${escapar(propuesta.texto)}</p></div>`
          : ''
      }
      <p class="fuente">${enlaceFuente(propuesta, partido)}</p>
      <div class="acciones">
        <button type="button" class="boton boton--primario" data-accion="siguiente">${ultima ? 'Ver mi resultado' : 'Siguiente propuesta'}</button>
      </div>
    </section>`;
}

function htmlFinal(datos) {
  const { ronda } = estado;
  const total = ronda.length;
  const buenos = aciertos();

  // Aciertos por tema, en el orden de temas.json.
  const porTema = datos.temas
    .map((tema) => {
      const deTema = ronda.filter((r) => r.propuesta.tema === tema.id);
      return { tema, total: deTema.length, aciertos: deTema.filter((r) => r.eleccion === r.propuesta.partido).length };
    })
    .filter((t) => t.total > 0);

  const filasTemas = porTema
    .map(
      (t) => `
      <li class="fila-barra">
        <span>${escapar(t.tema.nombre)}</span>
        <span class="fila-barra__valor">${t.aciertos} de ${t.total}</span>
        <span class="mini-barra" aria-hidden="true"><span style="width: ${(t.aciertos / t.total) * 100}%"></span></span>
      </li>`,
    )
    .join('');

  const falladas = ronda.filter((r) => r.eleccion !== r.propuesta.partido);
  const htmlFalladas = falladas.length
    ? `<p>Son las propuestas en las que no acertaste el partido.</p>
       <ul class="lista-propuestas">
         ${falladas
           .map(({ propuesta, eleccion }) => {
             const real = datos.partidoPorId.get(propuesta.partido);
             const elegido = datos.partidoPorId.get(eleccion);
             return `
               <li class="item-propuesta">
                 <p class="item-propuesta__texto">${escapar(propuesta.mostrado)}</p>
                 <p class="item-propuesta__meta">
                   ${escapar(datos.temaPorId.get(propuesta.tema).nombre)} ·
                   Elegiste: ${puntoPartido(elegido)}${escapar(elegido.nombre)} ·
                   <strong>Era de: ${puntoPartido(real)}${escapar(real.nombre)}</strong>
                 </p>
                 <p class="item-propuesta__meta">${enlaceFuente(propuesta, real)}</p>
               </li>`;
           })
           .join('')}
       </ul>`
    : '<p>Has acertado todas. Prueba con otros temas o con más partidos.</p>';

  return `
    <h1 tabindex="-1">Tu resultado</h1>
    <div class="tarjeta marcador">
      <span class="marcador__cifra">${buenos} / ${total}</span>
      <p class="marcador__texto">propuestas acertadas</p>
    </div>
    <p class="bloque">
      Adivinar el partido a partir de una propuesta es más difícil de lo que parece: muchas ideas aparecen en programas
      de partidos muy distintos, y cada programa trata muchos más temas de los que solemos asociar con él.
    </p>

    <section class="bloque">
      <h2>Aciertos por tema</h2>
      <ul class="lista-temas">${filasTemas}</ul>
    </section>

    <section class="bloque">
      <h2>Las que más te sorprendieron</h2>
      ${htmlFalladas}
    </section>

    <section class="cierre">
      <h2>Lee los programas completos</h2>
      <p>
        Unas pocas propuestas no resumen un programa. Si quieres saber qué defiende cada partido,
        lo mejor es leer sus programas: aquí tienes los enlaces oficiales.
      </p>
      <ul class="lista-programas">${htmlProgramas(datos.partidosOficiales)}</ul>
    </section>

    <div class="acciones">
      <button type="button" class="boton boton--primario" data-accion="otra-ronda">Jugar otra ronda</button>
      <button type="button" class="boton boton--secundario" data-accion="configurar">Cambiar temas o partidos</button>
      <a class="boton boton--texto" href="#/test">Hacer el test de afinidad</a>
    </div>`;
}
