// Página de resultados del test de afinidad (y resumen de la última partida del juego).
// Es la única pantalla, junto al final del juego, donde se usan los colores de los partidos.
import { calcularResultados, etiquetaRespuesta } from './afinidad.js';
import { htmlProgramas } from './paginas.js';
import {
  colorSeguro,
  enlaceFuente,
  escapar,
  etiquetaEjemplo,
  formatoPorcentaje,
  htmlPuntoPartido,
  leerSesion,
} from './utilidades.js';

export function pintarResultados(contenedor, datos) {
  const test = leerSesion('pac-test');
  const juego = leerSesion('pac-juego');
  contenedor.innerHTML = test?.items?.length ? htmlTest(test, juego, datos) : htmlVacio(juego);
}

function htmlJuego(juego) {
  return juego
    ? `<p>En tu última partida de «Adivina el partido» acertaste <strong>${juego.aciertos} de ${juego.total}</strong> propuestas.</p>`
    : '';
}

function htmlVacio(juego) {
  return `
    <h1 tabindex="-1">Resultados</h1>
    <p>Aún no has hecho el test de afinidad en esta pestaña. Tus resultados aparecerán aquí al terminarlo.</p>
    ${htmlJuego(juego)}
    <div class="acciones">
      <a class="boton boton--primario" href="#/test">Hacer el test de afinidad</a>
      <a class="boton boton--secundario" href="#/juego">Jugar a adivinar el partido</a>
    </div>`;
}

const estiloPartido = (partido) => `style="--color-partido: ${colorSeguro(partido?.color)}"`;

function htmlItem(item, partidoPorId, temaPorId, { mostrarPartido }) {
  const partido = partidoPorId.get(item.partido);
  const literal = item.texto && item.texto.trim() !== item.mostrado
    ? `<p class="item-propuesta__meta">Texto literal: «${escapar(item.texto)}»</p>`
    : '';
  return `
    <li class="item-propuesta">
      <p class="item-propuesta__texto">${escapar(item.mostrado)}</p>
      <p class="item-propuesta__meta">
        ${escapar(temaPorId.get(item.tema)?.nombre ?? item.tema)}
        ${mostrarPartido ? ` · ${htmlPuntoPartido(partido)}<strong>${escapar(partido?.nombre ?? item.partido)}</strong>` : ''}
        · Tu respuesta: <strong>${etiquetaRespuesta(item.valor)}</strong>
        ${etiquetaEjemplo(item)}
      </p>
      ${literal}
      <p class="item-propuesta__meta">${enlaceFuente(item, partido)}</p>
    </li>`;
}

function htmlTest(test, juego, datos) {
  const partidoPorId = new Map(test.partidos.map((p) => [p.id, p]));
  const temaPorId = new Map(test.temas.map((t) => [t.id, t]));
  const resultados = calcularResultados(test.items, test.partidos, test.temas);
  const minimo = datos.config?.test?.minimo_respuestas_fiable ?? 5;

  const total = test.items.length;
  const sinCriterio = test.items.filter((i) => typeof i.valor !== 'number').length;
  const ctx = { mostrarPartido: false };

  const tarjetas = resultados
    .map((r) => {
      const { partido } = r;
      const siglas = partido.siglas && partido.siglas !== partido.nombre ? `<span class="partido-resultado__siglas">${escapar(partido.siglas)}</span>` : '';
      if (r.afinidad === null) {
        return `
          <li class="partido-resultado" ${estiloPartido(partido)}>
            <div class="partido-resultado__cabecera">
              <span class="partido-resultado__posicion"><span class="sr-only">Sin puesto</span><span aria-hidden="true">–</span></span>
              <h3>${escapar(partido.nombre)}${siglas}</h3>
              <span class="partido-resultado__pct">—</span>
            </div>
            <p class="sin-datos">No has respondido ninguna propuesta de este partido, así que no se puede calcular.</p>
          </li>`;
      }

      const filasTema = r.porTema
        .map(
          (t) => `
          <li class="fila-barra">
            <span>${escapar(t.tema.nombre)}</span>
            <span class="fila-barra__valor">${formatoPorcentaje(t.afinidad)} · ${t.respondidas} ${t.respondidas === 1 ? 'propuesta' : 'propuestas'}</span>
            <span class="mini-barra" aria-hidden="true"><span style="width: ${t.afinidad}%"></span></span>
          </li>`,
        )
        .join('');

      const lista = (items, vacio) =>
        items.length
          ? `<ul class="lista-propuestas">${items.map((i) => htmlItem(i, partidoPorId, temaPorId, ctx)).join('')}</ul>`
          : `<p class="sin-datos">${vacio}</p>`;

      return `
        <li class="partido-resultado" ${estiloPartido(partido)}>
          <div class="partido-resultado__cabecera">
            <span class="partido-resultado__posicion"><span class="sr-only">Puesto </span>${r.puesto}</span>
            <h3>${escapar(partido.nombre)}${siglas}</h3>
            <span class="partido-resultado__pct">${formatoPorcentaje(r.afinidad)}</span>
          </div>
          <div class="barra-afinidad" aria-hidden="true"><span style="width: ${r.afinidad}%"></span></div>
          <p class="partido-resultado__detalle">
            Calculado con ${r.respondidas} ${r.respondidas === 1 ? 'propuesta respondida' : 'propuestas respondidas'} de este partido${
              r.sinCriterio ? ` (y ${r.sinCriterio} sin criterio, que no cuentan)` : ''
            }.
          </p>
          ${r.respondidas < minimo ? `<p class="poco-fiable">⚠ Pocas respuestas: resultado poco fiable</p>` : ''}
          <details>
            <summary>Ver el desglose<span class="sr-only"> de ${escapar(partido.nombre)}</span></summary>
            <h4>Por tema</h4>
            <ul class="lista-temas">${filasTema}</ul>
            <h4>Lo que más te acercó</h4>
            ${lista(r.acercan, 'Ninguna propuesta de este partido te acercó.')}
            <h4>Lo que más te alejó</h4>
            ${lista(r.alejan, 'Ninguna propuesta de este partido te alejó.')}
          </details>
        </li>`;
    })
    .join('');

  const todas = [...test.items]
    .sort(
      (a, b) =>
        (partidoPorId.get(a.partido)?.nombre ?? '').localeCompare(partidoPorId.get(b.partido)?.nombre ?? '', 'es') ||
        (temaPorId.get(a.tema)?.nombre ?? '').localeCompare(temaPorId.get(b.tema)?.nombre ?? '', 'es'),
    )
    .map((i) => htmlItem(i, partidoPorId, temaPorId, { mostrarPartido: true }))
    .join('');

  return `
    <h1 tabindex="-1">Tus resultados del test</h1>
    <div class="aviso aviso--importante" role="note">
      <p><strong>Esto no es una recomendación de voto ni un sondeo.</strong>
      Indica cuánto coinciden tus respuestas con una selección de propuestas concretas de cada programa.
      Votar depende de muchas más cosas. <a href="#/metodologia">Cómo se calcula</a>.</p>
    </div>
    ${
      test.modoEjemplo
        ? '<p class="aviso aviso--importante bloque"><strong>Datos de ejemplo:</strong> estos resultados se han calculado con propuestas y partidos ficticios.</p>'
        : ''
    }
    <p class="bloque">
      Has respondido ${total - sinCriterio} de ${total} propuestas${
        sinCriterio ? ` (en ${sinCriterio} elegiste «No tengo criterio suficiente»)` : ''
      }.
    </p>
    ${htmlJuego(juego)}

    <section class="bloque">
      <h2>Afinidad por partido</h2>
      <ol class="ranking">${tarjetas}</ol>
    </section>

    <section class="bloque">
      <h2>De quién era cada propuesta</h2>
      <details class="desplegable">
        <summary>Ver las ${total} propuestas con su partido</summary>
        <ul class="lista-propuestas">${todas}</ul>
      </details>
    </section>

    <section class="cierre">
      <h2>Lee los programas completos</h2>
      <p>
        Este test solo recoge una parte de cada programa. Antes de decidir tu voto, merece la pena leer los programas
        completos: aquí tienes los enlaces oficiales.
      </p>
      <ul class="lista-programas">${htmlProgramas(test.programas ?? [])}</ul>
    </section>

    <div class="acciones">
      <a class="boton boton--primario" href="#/test">Repetir el test</a>
      <a class="boton boton--secundario" href="#/juego">Jugar a adivinar el partido</a>
    </div>`;
}
