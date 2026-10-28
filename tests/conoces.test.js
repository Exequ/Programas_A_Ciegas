// Pruebas del modo «¿Conoces a tu partido?»: npm test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  esValidaParaConoces,
  evaluarRespuesta,
  preguntasPosibles,
  resumirResultado,
  seleccionarPreguntas,
} from '../js/conoces-logica.js';

const PARTIDOS = ['a', 'b', 'c', 'd'];
const TEMAS = ['t1', 't2', 't3', 't4', 't5', 't6'];

/** Datos simétricos: cada partido tiene `porTema` propuestas en cada tema. */
function datosSimetricos(porTema = 4) {
  const propuestas = [];
  for (const partido of PARTIDOS) {
    for (const tema of TEMAS) {
      for (let i = 0; i < porTema; i++) propuestas.push({ id: `${partido}-${tema}-${i}`, partido, tema });
    }
  }
  return propuestas;
}

const contarPor = (lista, clave) => {
  const cuentas = {};
  for (const p of lista) cuentas[p[clave]] = (cuentas[p[clave]] ?? 0) + 1;
  return cuentas;
};
const diferencia = (cuentas) => Math.max(...Object.values(cuentas)) - Math.min(...Object.values(cuentas));
const REPETICIONES = 200;

describe('seleccionarPreguntas', () => {
  const datos = datosSimetricos();

  it('respeta la proporción de propuestas del partido elegido', () => {
    for (const [total, proporcion] of [[10, 0.5], [15, 0.5], [20, 0.5], [10, 0.3], [20, 0.7]]) {
      const { preguntas } = seleccionarPreguntas(datos, 'a', { total, proporcion });
      assert.equal(preguntas.length, total);
      assert.equal(preguntas.filter((p) => p.partido === 'a').length, Math.round(total * proporcion));
    }
  });

  it('no repite propuestas dentro de un test', () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const { preguntas } = seleccionarPreguntas(datos, 'b', { total: 20 });
      assert.equal(new Set(preguntas.map((p) => p.id)).size, preguntas.length);
    }
  });

  it('excluye las propuestas ambiguas y las compartidas', () => {
    const marcadas = datos.map((p, i) => {
      if (i % 3 === 0) return { ...p, ambigua: true };
      if (i % 3 === 1) return { ...p, compartida_con: ['z'] };
      return p;
    });
    for (let i = 0; i < REPETICIONES; i++) {
      const { preguntas } = seleccionarPreguntas(marcadas, 'c', { total: 20 });
      assert.ok(preguntas.length > 0);
      assert.ok(preguntas.every(esValidaParaConoces));
    }
  });

  it('las propuestas de otros partidos son de los temas del partido elegido y se reparten por igual', () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const { preguntas } = seleccionarPreguntas(datos, 'a', { total: 20 });
      const propias = preguntas.filter((p) => p.partido === 'a');
      const ajenas = preguntas.filter((p) => p.partido !== 'a');
      const temasPropios = new Set(propias.map((p) => p.tema));
      assert.ok(ajenas.every((p) => temasPropios.has(p.tema)));
      assert.ok(diferencia(contarPor(ajenas, 'partido')) <= 1);
    }
  });

  it('equilibra los temas de las propuestas del partido elegido', () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const { preguntas } = seleccionarPreguntas(datos, 'd', { total: 20 });
      const porTema = contarPor(preguntas.filter((p) => p.partido === 'd'), 'tema');
      assert.ok(diferencia(porTema) <= 1, JSON.stringify(porTema));
    }
  });

  it('el tema no delata la respuesta: cada tema tiene tantas propuestas propias como ajenas', () => {
    for (let i = 0; i < REPETICIONES; i++) {
      const { preguntas } = seleccionarPreguntas(datos, 'b', { total: 12 });
      const propias = contarPor(preguntas.filter((p) => p.partido === 'b'), 'tema');
      const ajenas = contarPor(preguntas.filter((p) => p.partido !== 'b'), 'tema');
      assert.deepEqual(ajenas, propias);
    }
  });

  it('trata igual a todos los partidos', () => {
    const resumen = (partido) => {
      const r = seleccionarPreguntas(datos, partido, { total: 15 });
      const propias = r.preguntas.filter((p) => p.partido === partido);
      return {
        maximo: r.maximo,
        total: r.preguntas.length,
        propias: propias.length,
        partidosAjenos: Object.keys(contarPor(r.preguntas.filter((p) => p.partido !== partido), 'partido')).length,
      };
    };
    const referencia = resumen('a');
    for (const partido of PARTIDOS) assert.deepEqual(resumen(partido), referencia);
  });

  it('cada partido tiene la misma probabilidad de salir como «otro partido»', () => {
    const apariciones = { a: 0, b: 0, c: 0, d: 0 };
    for (const elegido of PARTIDOS) {
      for (let i = 0; i < REPETICIONES; i++) {
        for (const p of seleccionarPreguntas(datos, elegido, { total: 10 }).preguntas) {
          if (p.partido !== elegido) apariciones[p.partido]++;
        }
      }
    }
    const media = Object.values(apariciones).reduce((a, b) => a + b) / 4;
    for (const n of Object.values(apariciones)) assert.ok(Math.abs(n - media) / media < 0.05, JSON.stringify(apariciones));
  });

  it('reduce el número de preguntas si no hay suficientes propuestas', () => {
    const pocas = datosSimetricos(1); // 6 propuestas por partido
    const r = seleccionarPreguntas(pocas, 'a', { total: 20 });
    assert.equal(r.preguntas.length, 12);
    assert.equal(r.reducido, true);
    assert.equal(r.preguntas.filter((p) => p.partido === 'a').length, 6);
  });

  it('avisa en lugar de hacer un test pobre', () => {
    const r = seleccionarPreguntas(datosSimetricos(1), 'a', { total: 10, temas: ['t1', 't2'] });
    assert.equal(r.insuficiente, true);
    assert.deepEqual(r.preguntas, []);
  });

  it('aplica el filtro de temas', () => {
    const { preguntas } = seleccionarPreguntas(datos, 'a', { total: 10, temas: ['t2', 't5'] });
    assert.ok(preguntas.every((p) => ['t2', 't5'].includes(p.tema)));
  });
});

describe('preguntasPosibles', () => {
  it('calcula el máximo que respeta la proporción', () => {
    assert.equal(preguntasPosibles(6, 18, 0.5), 12);
    assert.equal(preguntasPosibles(10, 3, 0.5), 7); // 4 del partido + 3 de otros
    assert.equal(preguntasPosibles(0, 10, 0.5), 0);
  });
});

describe('esValidaParaConoces', () => {
  it('acepta listas vacías y ambigua: false', () => {
    assert.equal(esValidaParaConoces({}), true);
    assert.equal(esValidaParaConoces({ compartida_con: [] }), true);
    assert.equal(esValidaParaConoces({ ambigua: false }), true);
    assert.equal(esValidaParaConoces({ ambigua: true }), false);
    assert.equal(esValidaParaConoces({ compartida_con: ['x'] }), false);
  });
});

describe('resultado', () => {
  const rondas = [
    { propuesta: { id: 1, partido: 'a', tema: 't1' }, respuesta: 'si' },
    { propuesta: { id: 2, partido: 'a', tema: 't1' }, respuesta: 'no' },
    { propuesta: { id: 3, partido: 'b', tema: 't2' }, respuesta: 'si' },
    { propuesta: { id: 4, partido: 'c', tema: 't2' }, respuesta: 'no' },
    { propuesta: { id: 5, partido: 'c', tema: 't2' }, respuesta: 'nose' },
  ];

  it('evalúa cada respuesta', () => {
    assert.deepEqual(rondas.map((r) => evaluarRespuesta(r.propuesta, 'a', r.respuesta)), ['acierto', 'fallo', 'fallo', 'acierto', 'nose']);
  });

  it('cuenta «No lo sé» aparte y clasifica las sorpresas', () => {
    const r = resumirResultado(rondas, 'a', [{ id: 't1' }, { id: 't2' }, { id: 't3' }]);
    assert.deepEqual([r.total, r.aciertos, r.fallos, r.nose], [5, 2, 2, 1]);
    assert.deepEqual(r.noEsperabas.map((x) => x.propuesta.id), [2]);
    assert.deepEqual(r.creiasSuyas.map((x) => x.propuesta.id), [3]);
    assert.deepEqual(r.sabias.map((x) => x.propuesta.id), [1, 4]);
    assert.deepEqual(r.porTema.map((t) => [t.tema.id, t.aciertos, t.fallos, t.nose]), [['t1', 1, 1, 0], ['t2', 1, 1, 1]]);
  });
});
