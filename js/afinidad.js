// Cálculo de la afinidad del test. No depende del navegador: se prueba con `npm test`.

/** Respuestas posibles con su valor y la tecla de atajo. */
export const RESPUESTAS = [
  { valor: 2, etiqueta: 'Muy a favor', tecla: '1' },
  { valor: 1, etiqueta: 'A favor', tecla: '2' },
  { valor: 0, etiqueta: 'Me da igual / neutral', tecla: '3' },
  { valor: -1, etiqueta: 'En contra', tecla: '4' },
  { valor: -2, etiqueta: 'Muy en contra', tecla: '5' },
];

/** «No tengo criterio suficiente»: la propuesta no cuenta para el cálculo. */
export const SIN_CRITERIO = { valor: null, etiqueta: 'No tengo criterio suficiente', tecla: '0' };

export function etiquetaRespuesta(valor) {
  return (RESPUESTAS.find((r) => r.valor === valor) ?? SIN_CRITERIO).etiqueta;
}

const respondida = (item) => typeof item.valor === 'number';

/**
 * Afinidad % = ((Σ valor·peso / (2 · Σ peso)) + 1) / 2 · 100
 * Solo cuenta las respuestas con valor (no las «sin criterio»). Devuelve null si no hay ninguna.
 */
export function porcentajeAfinidad(items) {
  let suma = 0;
  let pesos = 0;
  for (const item of items) {
    if (!respondida(item)) continue;
    const peso = item.peso ?? 1;
    suma += item.valor * peso;
    pesos += peso;
  }
  if (pesos <= 0) return null;
  return (suma / (2 * pesos) + 1) / 2 * 100;
}

/**
 * Resultados por partido, ordenados de mayor a menor afinidad.
 * `items`: propuestas mostradas en el test, cada una con { partido, tema, valor (número o null), peso }.
 */
export function calcularResultados(items, partidos, temas, { destacadas = 3 } = {}) {
  const resultados = partidos.map((partido) => {
    const suyas = items.filter((i) => i.partido === partido.id);
    const respondidas = suyas.filter(respondida);
    const conAporte = respondidas.map((i) => ({ ...i, aporte: i.valor * (i.peso ?? 1) }));

    return {
      partido,
      afinidad: porcentajeAfinidad(respondidas),
      respondidas: respondidas.length,
      sinCriterio: suyas.length - respondidas.length,
      porTema: temas
        .map((tema) => {
          const delTema = respondidas.filter((i) => i.tema === tema.id);
          return { tema, respondidas: delTema.length, afinidad: porcentajeAfinidad(delTema) };
        })
        .filter((t) => t.respondidas > 0),
      acercan: conAporte.filter((i) => i.aporte > 0).sort((a, b) => b.aporte - a.aporte).slice(0, destacadas),
      alejan: conAporte.filter((i) => i.aporte < 0).sort((a, b) => a.aporte - b.aporte).slice(0, destacadas),
    };
  });

  resultados.sort(
    (a, b) =>
      (a.afinidad === null) - (b.afinidad === null) ||
      (b.afinidad ?? 0) - (a.afinidad ?? 0) ||
      b.respondidas - a.respondidas ||
      a.partido.nombre.localeCompare(b.partido.nombre, 'es'),
  );

  // Los empates (mismo % redondeado) comparten puesto.
  for (const r of resultados) {
    r.puesto =
      r.afinidad === null
        ? null
        : 1 + resultados.filter((o) => o.afinidad !== null && Math.round(o.afinidad) > Math.round(r.afinidad)).length;
  }
  return resultados;
}
