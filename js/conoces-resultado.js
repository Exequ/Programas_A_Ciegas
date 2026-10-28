// Resultado del modo «¿Conoces a tu partido?». Mismo texto y diseño para cualquier partido.
import { resumirResultado } from './conoces-logica.js';
import { htmlProgramas } from './paginas.js';
import { enlaceFuente, escapar, etiquetaEjemplo, htmlPuntoPartido } from './utilidades.js';

const ETIQUETAS = { si: 'Sí', no: 'No', nose: 'No lo sé' };

export function htmlResultadoConoces(estado, datos) {
  const partido = datos.partidoPorId.get(estado.partido);
  const nombre = escapar(partido.nombre);
  const r = resumirResultado(estado.rondas, estado.partido, datos.temas);

  const item = ({ propuesta, respuesta }) => {
    const real = datos.partidoPorId.get(propuesta.partido);
    return `
      <li class="item-propuesta">
        <p class="item-propuesta__texto">${escapar(propuesta.mostrado)}</p>
        <p class="item-propuesta__meta">
          ${escapar(datos.temaPorId.get(propuesta.tema).nombre)} ·
          Respondiste: <strong>${ETIQUETAS[respuesta]}</strong> ·
          Es de: ${htmlPuntoPartido(real)}<strong>${escapar(real.nombre)}</strong>
          ${etiquetaEjemplo(propuesta)}
        </p>
        <p class="item-propuesta__meta">${enlaceFuente(propuesta, real)}</p>
      </li>`;
  };
  const lista = (rondas, vacio) =>
    rondas.length ? `<ul class="lista-propuestas">${rondas.map(item).join('')}</ul>` : `<p class="sin-datos">${vacio}</p>`;

  const filasTemas = r.porTema
    .map((t) => {
      const respondidas = t.aciertos + t.fallos;
      return `
        <li class="fila-barra">
          <span>${escapar(t.tema.nombre)}</span>
          <span class="fila-barra__valor">${t.aciertos} de ${t.total}${t.nose ? ` · ${t.nose} «No lo sé»` : ''}</span>
          <span class="mini-barra" aria-hidden="true"><span style="width: ${respondidas ? (t.aciertos / t.total) * 100 : 0}%"></span></span>
        </li>`;
    })
    .join('');

  const programa = partido.ejemplo
    ? '<p><em>Es un partido ficticio de ejemplo: no tiene programa.</em></p>'
    : `<ul class="lista-programas">${htmlProgramas([partido])}</ul>`;

  return `
    <h1 tabindex="-1">Tu resultado con ${nombre}</h1>
    <div class="aviso aviso--importante" role="note">
      <p><strong>Es un juego divulgativo basado en propuestas concretas; no es una recomendación de voto.</strong>
      Tus respuestas no se han guardado ni enviado a ningún sitio.</p>
    </div>

    <div class="tarjeta marcador bloque">
      <span class="marcador__cifra">${r.aciertos} / ${r.total}</span>
      <p class="marcador__texto">aciertos${r.nose ? ` · ${r.nose} ${r.nose === 1 ? 'respuesta' : 'respuestas'} «No lo sé», que no cuentan como fallo` : ''}</p>
    </div>
    <p class="bloque">
      Los programas electorales son largos y tratan muchos temas: es normal que algunas propuestas sorprendan,
      también las del partido que mejor conocemos. Y muchas ideas aparecen en programas de partidos distintos.
    </p>

    <section class="bloque">
      <h2>Propuestas de ${nombre} que no esperabas</h2>
      <p>Son de ${nombre}, pero respondiste que no.</p>
      ${lista(r.noEsperabas, `Reconociste todas las propuestas de ${nombre} que aparecieron (o respondiste «No lo sé»).`)}
    </section>

    <section class="bloque">
      <h2>Propuestas que creías de ${nombre} y no lo son</h2>
      <p>Respondiste que sí, pero son de otros partidos.</p>
      ${lista(r.creiasSuyas, `No atribuiste a ${nombre} ninguna propuesta de otro partido.`)}
    </section>

    <section class="bloque">
      <h2>Lo que sí sabías</h2>
      ${
        r.sabias.length
          ? `<details class="desplegable"><summary>Ver ${r.sabias.length === 1 ? 'la propuesta acertada' : `las ${r.sabias.length} propuestas acertadas`}</summary>${lista(r.sabias, '')}</details>`
          : '<p class="sin-datos">Esta vez no hubo aciertos. ¡Cada propuesta descubierta cuenta!</p>'
      }
    </section>

    <section class="bloque">
      <h2>Por tema</h2>
      <ul class="lista-temas">${filasTemas}</ul>
    </section>

    <section class="cierre">
      <h2>Lee el programa de ${nombre}</h2>
      <p>
        Unas pocas propuestas no resumen un programa. Si quieres conocer a fondo lo que propone ${nombre},
        lo mejor es leer su programa oficial. También puedes consultar los de los demás partidos en
        <a href="#/metodologia">Metodología y fuentes</a>.
      </p>
      ${programa}
    </section>

    <div class="acciones">
      <button type="button" class="boton boton--primario" data-accion="repetir">Repetir con ${nombre}</button>
      <button type="button" class="boton boton--secundario" data-accion="otro-partido">Probar con otro partido</button>
      <a class="boton boton--texto" href="#/">Volver al inicio</a>
    </div>`;
}
