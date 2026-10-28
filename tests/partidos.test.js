// Pruebas de la sección «Partidos y programas»: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  filtrarPartidos,
  htmlDatosPartido,
  htmlProgramaPartido,
  htmlTarjetaPartido,
  ordenarPartidos,
  partidosDelDirectorio,
  rutaRelativa,
} from '../js/partidos-logica.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(`../${ruta}`, import.meta.url), 'utf8'));
const reales = leer('data/partidos.json');
const ejemplos = leer('data/partidos.ejemplo.json');

/** Estructura de etiquetas y clases, sin textos ni enlaces concretos. */
const esqueleto = (html) =>
  html
    .replace(/>[^<]*</g, '><')
    .replace(/href="[^"]*"/g, 'href=""')
    .replace(/estado-programa--\w+/g, 'estado-programa--X')
    .replace(/\s+/g, ' ')
    .trim();

describe('directorio: mismo formato para todos', () => {
  it('todas las tarjetas tienen exactamente la misma estructura', () => {
    const tarjetas = partidosDelDirectorio([...reales, ...ejemplos]).map(htmlTarjetaPartido);
    assert.ok(tarjetas.length > 20);
    const referencia = esqueleto(tarjetas[0]);
    for (const tarjeta of tarjetas) assert.equal(esqueleto(tarjeta), referencia);
  });

  it('las tarjetas no usan colores, logos ni imágenes', () => {
    for (const partido of partidosDelDirectorio(reales)) {
      const html = htmlTarjetaPartido(partido);
      assert.doesNotMatch(html, /style=|<img|<svg|color/i);
    }
  });

  it('solo aparecen los partidos con en_directorio: true', () => {
    const ids = partidosDelDirectorio(reales).map((p) => p.id);
    assert.ok(ids.length > 0);
    for (const p of reales) assert.equal(ids.includes(p.id), p.en_directorio === true);
  });
});

describe('orden del directorio', () => {
  const partidos = partidosDelDirectorio(reales);

  it('el orden alfabético no depende del tamaño ni del orden del archivo', () => {
    const referencia = ordenarPartidos(partidos).map((p) => p.id);
    // Datos de «tamaño» que nunca deben influir, y el archivo en otro orden.
    const conTamano = [...partidos].reverse().map((p, i) => ({ ...p, escanos: i * 7, votos: 1e6 - i, orden: i }));
    assert.deepEqual(ordenarPartidos(conTamano).map((p) => p.id), referencia);
    const nombres = ordenarPartidos(partidos).map((p) => p.nombre);
    assert.deepEqual(nombres, [...nombres].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })));
  });

  it('el orden aleatorio depende solo del azar', () => {
    let semilla = 1;
    const azar = () => ((semilla = (semilla * 16807) % 2147483647) - 1) / 2147483646;
    const a = ordenarPartidos(partidos, 'aleatorio', azar).map((p) => p.id);
    semilla = 1;
    const conTamano = partidos.map((p, i) => ({ ...p, escanos: 350 - i }));
    const b = ordenarPartidos(conTamano, 'aleatorio', azar).map((p) => p.id);
    assert.deepEqual(a, b);
    assert.equal(new Set(a).size, partidos.length);
  });
});

describe('búsqueda y filtros', () => {
  const partidos = partidosDelDirectorio(reales);
  it('busca sin tildes ni mayúsculas en nombre, siglas y territorio', () => {
    assert.ok(filtrarPartidos(partidos, { texto: 'CATALUNA' }).length > 0);
    assert.ok(filtrarPartidos(partidos, { texto: 'pp' }).some((p) => p.id === 'pp'));
  });
  it('filtra por ámbito', () => {
    for (const p of filtrarPartidos(partidos, { ambito: 'coalicion' })) assert.equal(p.ambito, 'coalicion');
  });
});

describe('estado del programa', () => {
  const base = { id: 'x', nombre: 'Partido X', siglas: 'PX', ambito: 'estatal', en_directorio: true };

  it('pendiente: mensaje neutro, enlace a la web si existe y sin botón de PDF', () => {
    const html = htmlProgramaPartido({ ...base, web_oficial: 'https://ejemplo.org', programa: { estado: 'pendiente' } });
    assert.match(html, /Programa aún no publicado/);
    assert.match(html, /href="https:\/\/ejemplo\.org"/);
    assert.doesNotMatch(html, /Ver programa oficial/);
    assert.match(htmlTarjetaPartido({ ...base, programa: { estado: 'pendiente' } }), /Programa aún no publicado/);
  });

  it('sin datos de programa cuenta como pendiente', () => {
    assert.match(htmlProgramaPartido(base), /Programa aún no publicado/);
  });

  it('publicado: botón al PDF oficial y copia guardada solo si existe', () => {
    const publicado = { estado: 'publicado', url_oficial: 'https://ejemplo.org/p.pdf', fecha_comprobacion: '2026-11-10' };
    const sinCopia = htmlProgramaPartido({ ...base, programa: publicado });
    assert.match(sinCopia, /Ver programa oficial \(PDF\)/);
    assert.doesNotMatch(sinCopia, /copia guardada/i);
    const conCopia = htmlProgramaPartido({ ...base, programa: { ...publicado, archivo_local: '/programas/x-2026.pdf' } });
    assert.match(conCopia, /Descargar copia guardada \(10 de noviembre de 2026\)/);
    assert.match(conCopia, /href="programas\/x-2026\.pdf"/);
    assert.match(conCopia, /versión oficial es siempre la publicada por el partido/);
  });

  it('las rutas con barra inicial funcionan también en GitHub Pages', () => {
    assert.equal(rutaRelativa('/data/resumenes/psoe.json'), 'data/resumenes/psoe.json');
    assert.equal(rutaRelativa(''), null);
  });
});

describe('coaliciones', () => {
  it('la ficha muestra los integrantes y, en un integrante, la coalición', () => {
    const coalicion = { id: 'c', nombre: 'Coalición C', siglas: 'C', ambito: 'coalicion', en_directorio: true, coalicion_de: ['a'] };
    const integrante = { id: 'a', nombre: 'Partido A', siglas: 'A', ambito: 'estatal', en_directorio: true };
    const todos = [coalicion, integrante];
    assert.match(htmlDatosPartido(coalicion, todos), /Coalición formada por.*Partido A/s);
    assert.match(htmlDatosPartido(integrante, todos), /Forma parte de.*Coalición C/s);
  });
});
