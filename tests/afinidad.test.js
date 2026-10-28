// Pruebas del cálculo de afinidad y del reparto de propuestas: npm test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcularResultados, porcentajeAfinidad } from '../js/afinidad.js';
import { seleccionEquilibrada } from '../js/utilidades.js';

const casi = (real, esperado) => assert.ok(Math.abs(real - esperado) < 1e-9, `${real} ≠ ${esperado}`);

describe('porcentajeAfinidad', () => {
  it('todo «muy a favor» da 100 %, todo «muy en contra» 0 % y todo neutral 50 %', () => {
    casi(porcentajeAfinidad([{ valor: 2 }, { valor: 2 }]), 100);
    casi(porcentajeAfinidad([{ valor: -2 }, { valor: -2 }]), 0);
    casi(porcentajeAfinidad([{ valor: 0 }]), 50);
  });

  it('reproduce el ejemplo de la metodología (+2, +1, −1 → 66,7 %)', () => {
    casi(porcentajeAfinidad([{ valor: 2 }, { valor: 1 }, { valor: -1 }]), ((2 / 6 + 1) / 2) * 100);
  });

  it('las respuestas «sin criterio» no cuentan', () => {
    casi(porcentajeAfinidad([{ valor: 2 }, { valor: null }]), 100);
    assert.equal(porcentajeAfinidad([{ valor: null }]), null);
    assert.equal(porcentajeAfinidad([]), null);
  });

  it('aplica los pesos', () => {
    // (2·2 + (−2)·1) / (2·3) = 1/3 → ((1/3) + 1) / 2 · 100
    casi(porcentajeAfinidad([{ valor: 2, peso: 2 }, { valor: -2, peso: 1 }]), ((1 / 3 + 1) / 2) * 100);
    casi(porcentajeAfinidad([{ valor: 2, peso: 0.5 }, { valor: -2, peso: 0.5 }]), 50);
  });
});

describe('calcularResultados', () => {
  const partidos = [
    { id: 'a', nombre: 'A' },
    { id: 'b', nombre: 'B' },
    { id: 'c', nombre: 'C' },
  ];
  const temas = [{ id: 't1', nombre: 'Tema 1' }, { id: 't2', nombre: 'Tema 2' }];
  const items = [
    { id: 1, partido: 'a', tema: 't1', valor: 2, peso: 1 },
    { id: 2, partido: 'a', tema: 't2', valor: -1, peso: 1 },
    { id: 3, partido: 'b', tema: 't1', valor: 2, peso: 1 },
    { id: 4, partido: 'b', tema: 't2', valor: null, peso: 1 },
    { id: 5, partido: 'c', tema: 't1', valor: null, peso: 1 },
  ];
  const resultados = calcularResultados(items, partidos, temas);

  it('ordena de mayor a menor y deja al final los partidos sin respuestas', () => {
    assert.deepEqual(resultados.map((r) => r.partido.id), ['b', 'a', 'c']);
    assert.deepEqual(resultados.map((r) => r.puesto), [1, 2, null]);
    assert.equal(resultados[2].afinidad, null);
  });

  it('cuenta respondidas y sin criterio por partido', () => {
    const b = resultados.find((r) => r.partido.id === 'b');
    assert.equal(b.respondidas, 1);
    assert.equal(b.sinCriterio, 1);
  });

  it('desglosa por tema y señala lo que más acerca y aleja', () => {
    const a = resultados.find((r) => r.partido.id === 'a');
    assert.deepEqual(a.porTema.map((t) => [t.tema.id, t.afinidad]), [['t1', 100], ['t2', 25]]);
    assert.deepEqual(a.acercan.map((i) => i.id), [1]);
    assert.deepEqual(a.alejan.map((i) => i.id), [2]);
  });

  it('los empates comparten puesto', () => {
    const empate = calcularResultados(
      [{ partido: 'a', tema: 't1', valor: 1 }, { partido: 'b', tema: 't1', valor: 1 }],
      partidos.slice(0, 2),
      temas,
    );
    assert.deepEqual(empate.map((r) => r.puesto), [1, 1]);
  });
});

describe('seleccionEquilibrada', () => {
  const propuestas = [];
  for (const partido of ['a', 'b', 'c', 'd']) {
    for (let i = 0; i < 10; i++) propuestas.push({ id: `${partido}${i}`, partido, tema: `t${i % 5}` });
  }

  it('reparte por igual entre partidos y no repite', () => {
    for (let intento = 0; intento < 50; intento++) {
      const elegidas = seleccionEquilibrada(propuestas, 12);
      assert.equal(elegidas.length, 12);
      assert.equal(new Set(elegidas.map((p) => p.id)).size, 12);
      for (const partido of ['a', 'b', 'c', 'd']) {
        assert.equal(elegidas.filter((p) => p.partido === partido).length, 3);
      }
    }
  });

  it('dentro de cada partido reparte entre temas', () => {
    const elegidas = seleccionEquilibrada(propuestas, 20);
    for (const partido of ['a', 'b', 'c', 'd']) {
      const temas = new Set(elegidas.filter((p) => p.partido === partido).map((p) => p.tema));
      assert.equal(temas.size, 5);
    }
  });

  it('sin cantidad devuelve todas', () => {
    assert.equal(seleccionEquilibrada(propuestas).length, propuestas.length);
  });
});
