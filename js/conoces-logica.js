// Lógica del modo «¿Conoces a tu partido?». No depende del navegador: se prueba con `npm test`.
// Neutralidad: todas las funciones tratan igual a cualquier partido; ninguna rama depende de cuál sea.
import { agruparPor, barajar, intercalar } from './utilidades.js';

/** Respuestas posibles a «¿Es una propuesta de [partido]?». */
export const RESPUESTAS_CONOCES = [
  { id: 'si', etiqueta: 'Sí', tecla: '1' },
  { id: 'no', etiqueta: 'No', tecla: '2' },
  { id: 'nose', etiqueta: 'No lo sé', tecla: '0' },
];

/** Las propuestas compartidas con otros partidos o ambiguas no se usan en este modo. */
export function esValidaParaConoces(propuesta) {
  if (propuesta.ambigua === true) return false;
  const compartida = propuesta.compartida_con;
  if (Array.isArray(compartida)) return compartida.length === 0;
  return compartida === undefined || compartida === null;
}

/**
 * Mayor número de preguntas (sin pasar de `nPropias + nAjenas`) que respeta la proporción
 * con las propuestas disponibles. Las preguntas del partido son round(n · proporción).
 */
export function preguntasPosibles(nPropias, nAjenas, proporcion) {
  let maximo = 0;
  for (let n = 1; n <= nPropias + nAjenas; n++) {
    const propias = Math.round(n * proporcion);
    if (propias > nPropias || n - propias > nAjenas) break;
    maximo = n;
  }
  return maximo;
}

/** Propuestas disponibles para un partido: las suyas y las de otros partidos en esos mismos temas. */
export function propuestasDisponibles(propuestas, partidoId, temas = null) {
  const validas = propuestas.filter((p) => esValidaParaConoces(p) && (!temas || temas.includes(p.tema)));
  const propias = validas.filter((p) => p.partido === partidoId);
  const temasPropios = new Set(propias.map((p) => p.tema));
  const ajenas = validas.filter((p) => p.partido !== partidoId && temasPropios.has(p.tema));
  return { propias, ajenas };
}

/**
 * Elige las preguntas de un test.
 * - `total`: número de preguntas pedido. Si no hay propuestas suficientes, se reduce.
 * - `proporcion`: parte de preguntas del partido elegido (0,5 = la mitad).
 * - `temas`: lista de ids de tema para filtrar, o null para todos.
 * - `minimo`: por debajo de este número no se hace el test (`insuficiente: true`).
 */
export function seleccionarPreguntas(propuestas, partidoId, { total = 10, proporcion = 0.5, temas = null, minimo = 6 } = {}) {
  const { propias, ajenas } = propuestasDisponibles(propuestas, partidoId, temas);
  const maximo = preguntasPosibles(propias.length, ajenas.length, proporcion);
  const cantidad = Math.min(total, maximo);

  if (cantidad < minimo) {
    return { preguntas: [], solicitadas: total, maximo, insuficiente: true, reducido: false };
  }

  const nPropias = Math.round(cantidad * proporcion);
  // Del partido elegido: por turnos entre temas, para no cargar el test hacia uno solo.
  const elegidasPropias = intercalar(barajar([...agruparPor(propias, (p) => p.tema).values()]).map((grupo) => barajar(grupo))).slice(0, nPropias);
  const elegidasAjenas = elegirAjenas(ajenas, elegidasPropias.map((p) => p.tema), cantidad - nPropias);

  return {
    preguntas: barajar([...elegidasPropias, ...elegidasAjenas]),
    solicitadas: total,
    maximo,
    insuficiente: false,
    reducido: cantidad < total,
  };
}

/**
 * Propuestas de otros partidos: cada una del mismo tema que una propuesta elegida del partido
 * (así el tema no delata la respuesta) y del partido que lleve menos elegidas (reparto equilibrado).
 */
function elegirAjenas(ajenas, temasObjetivo, cantidad) {
  const disponibles = barajar(ajenas);
  const usadas = new Set();
  const recuento = new Map();
  const elegidas = [];
  const objetivos = barajar(temasObjetivo);

  const tomar = (candidatas) => {
    if (candidatas.length === 0) return false;
    const menor = Math.min(...candidatas.map((p) => recuento.get(p.partido) ?? 0));
    // `disponibles` está barajado: entre empatados, sale uno al azar.
    const elegida = candidatas.find((p) => (recuento.get(p.partido) ?? 0) === menor);
    usadas.add(elegida.id);
    recuento.set(elegida.partido, menor + 1);
    elegidas.push(elegida);
    return true;
  };

  for (let i = 0; i < cantidad; i++) {
    const libres = disponibles.filter((p) => !usadas.has(p.id));
    const tema = objetivos[i % objetivos.length];
    if (!tomar(libres.filter((p) => p.tema === tema))) tomar(libres);
  }
  return elegidas;
}

/** 'acierto', 'fallo' o 'nose' para una respuesta. */
export function evaluarRespuesta(propuesta, partidoId, respuesta) {
  if (respuesta === 'nose') return 'nose';
  const esDelPartido = propuesta.partido === partidoId;
  return (respuesta === 'si') === esDelPartido ? 'acierto' : 'fallo';
}

/**
 * Resumen del test. `rondas`: [{ propuesta, respuesta }] con respuesta 'si' | 'no' | 'nose'.
 * «No lo sé» no cuenta ni como acierto ni como fallo.
 */
export function resumirResultado(rondas, partidoId, temas) {
  const evaluadas = rondas.map((r) => ({ ...r, resultado: evaluarRespuesta(r.propuesta, partidoId, r.respuesta) }));
  const contar = (lista, resultado) => lista.filter((r) => r.resultado === resultado).length;

  return {
    total: evaluadas.length,
    aciertos: contar(evaluadas, 'acierto'),
    fallos: contar(evaluadas, 'fallo'),
    nose: contar(evaluadas, 'nose'),
    // Del partido, pero el usuario dijo que no.
    noEsperabas: evaluadas.filter((r) => r.propuesta.partido === partidoId && r.respuesta === 'no'),
    // De otro partido, pero el usuario dijo que sí.
    creiasSuyas: evaluadas.filter((r) => r.propuesta.partido !== partidoId && r.respuesta === 'si'),
    sabias: evaluadas.filter((r) => r.resultado === 'acierto'),
    porTema: temas
      .map((tema) => {
        const delTema = evaluadas.filter((r) => r.propuesta.tema === tema.id);
        return {
          tema,
          total: delTema.length,
          aciertos: contar(delTema, 'acierto'),
          fallos: contar(delTema, 'fallo'),
          nose: contar(delTema, 'nose'),
        };
      })
      .filter((t) => t.total > 0),
  };
}
