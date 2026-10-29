// Revisa los datos de /data antes de publicar: npm run validar
// Para revisar los datos de ejemplo en lugar de los reales: npm run validar -- --ejemplo
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esValidaParaConoces, preguntasPosibles, propuestasDisponibles } from '../js/conoces-logica.js';

const carpetaDatos = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const raiz = path.resolve(carpetaDatos, '..');
const modoEjemplo = process.argv.includes('--ejemplo');
const comprobarUrls = process.argv.includes('--comprobar-urls');

const usarColor = process.stdout.isTTY && !process.env.NO_COLOR;
const color = (codigo) => (texto) => (usarColor ? `\x1b[${codigo}m${texto}\x1b[0m` : texto);
const rojo = color('31');
const amarillo = color('33');
const verde = color('32');
const gris = color('90');
const negrita = color('1');

const errores = [];
const avisos = [];
const error = (mensaje) => errores.push(mensaje);
const aviso = (mensaje) => avisos.push(mensaje);

const CAMPOS_PARTIDO = [
  'id', 'nombre', 'siglas', 'color', 'lideres', 'ejemplo', 'ambito', 'territorio', 'coalicion_de', 'candidato',
  'web_oficial', 'en_directorio', 'en_juego', 'verificar', 'programa', 'resumen', 'nota',
];
const CAMPOS_ANTIGUOS = { activo: 'en_juego', url_programa: 'programa.url_oficial' };
const CAMPOS_TEMA = ['id', 'nombre'];
const CAMPOS_PROPUESTA = [
  'id', 'partido', 'tema', 'texto', 'texto_anonimo', 'pagina', 'url_fuente', 'peso', 'ejemplo', 'nota', 'compartida_con', 'ambigua',
];

// ---------- Lectura ----------

async function leer(nombre) {
  let texto;
  try {
    texto = await readFile(path.join(carpetaDatos, nombre), 'utf8');
  } catch {
    error(`No se encuentra el archivo data/${nombre}.`);
    return null;
  }
  try {
    return JSON.parse(texto);
  } catch (e) {
    const posicion = Number(/position (\d+)/.exec(e.message)?.[1]);
    let donde = '';
    if (Number.isFinite(posicion)) {
      const antes = texto.slice(0, posicion).split('\n');
      donde = ` cerca de la línea ${antes.length}, columna ${antes.at(-1).length + 1}`;
    }
    error(
      `data/${nombre} no es un JSON válido${donde}.\n` +
        `    Suele deberse a una coma que falta o sobra, o a unas comillas sin cerrar.\n` +
        `    Detalle técnico: ${e.message}`,
    );
    return null;
  }
}

const vacio = (valor) => valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');

function camposDesconocidos(objeto, conocidos, donde) {
  for (const campo of Object.keys(objeto)) {
    if (!conocidos.includes(campo)) {
      aviso(`${donde}: el campo "${campo}" no se reconoce y se ignorará. ¿Está bien escrito? Campos válidos: ${conocidos.join(', ')}.`);
    }
  }
}

function idsDuplicados(lista, archivo) {
  const vistos = new Map();
  lista.forEach((elemento, i) => {
    if (vacio(elemento?.id)) return;
    if (vistos.has(elemento.id)) {
      error(`${archivo}: el id "${elemento.id}" está repetido (elementos nº ${vistos.get(elemento.id) + 1} y nº ${i + 1}). Cada id debe ser único.`);
    } else {
      vistos.set(elemento.id, i);
    }
  });
}

// ---------- Búsqueda de pistas en los textos anónimos ----------

const sinTildes = (texto) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '');
const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Busca un término como palabra completa, distinguiendo mayúsculas ("Podemos" sí, "podemos" no) y aceptando MAYÚSCULAS. */
function contieneTermino(texto, termino) {
  const normal = sinTildes(texto);
  return [termino, termino.toUpperCase()].some((variante) =>
    new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegex(sinTildes(variante))}(?![\\p{L}\\p{N}])`, 'u').test(normal),
  );
}

function contieneExpresion(texto, expresion) {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegex(sinTildes(expresion.toLowerCase()))}(?![\\p{L}\\p{N}])`, 'u').test(
    sinTildes(texto.toLowerCase()),
  );
}

// ---------- Programa principal ----------

const archivoPartidos = modoEjemplo ? 'partidos.ejemplo.json' : 'partidos.json';
const archivoPropuestas = modoEjemplo ? 'propuestas.ejemplo.json' : 'propuestas.json';

const [partidos, temas, propuestas, config, partidosReales] = await Promise.all([
  leer(archivoPartidos),
  leer('temas.json'),
  leer(archivoPropuestas),
  leer('config.json'),
  modoEjemplo ? leer('partidos.json') : null,
]);

const ajustes = config?.validador ?? {};
const minimoPorTema = ajustes.minimo_por_tema_y_partido ?? 2;
const tolerancia = ajustes.diferencia_maxima_entre_partidos ?? 0;
const expresiones = ajustes.expresiones_sospechosas ?? [];

console.log(`\n${negrita('Revisando los datos de Programas a ciegas')} ${gris(`(data/${archivoPropuestas})`)}\n`);

// --- Partidos ---
const partidoPorId = new Map();
if (Array.isArray(partidos)) {
  idsDuplicados(partidos, archivoPartidos);
  partidos.forEach((p, i) => {
    const donde = `${archivoPartidos}, partido nº ${i + 1}${vacio(p?.id) ? '' : ` ("${p.id}")`}`;
    for (const campo of ['id', 'nombre', 'siglas']) if (vacio(p[campo])) error(`${donde}: falta el campo "${campo}".`);
    for (const campo of ['en_juego', 'en_directorio', 'verificar']) {
      if (p[campo] !== undefined && typeof p[campo] !== 'boolean') error(`${donde}: "${campo}" debe ser true o false (sin comillas).`);
    }
    for (const [antiguo, nuevo] of Object.entries(CAMPOS_ANTIGUOS)) {
      if (p[antiguo] !== undefined) error(`${donde}: el campo "${antiguo}" ya no se usa; ahora se llama "${nuevo}".`);
    }
    if (!vacio(p.color) && !/^#[0-9a-f]{6}$/i.test(p.color)) aviso(`${donde}: el color "${p.color}" no tiene el formato #RRGGBB (por ejemplo "#1E73BE").`);
    if (p.lideres !== undefined && (!Array.isArray(p.lideres) || p.lideres.some((l) => typeof l !== 'string'))) {
      error(`${donde}: "lideres" debe ser una lista de nombres entre comillas, por ejemplo ["Nombre Apellido"].`);
    }
    const urlOficial = p.programa?.url_oficial;
    if (!vacio(urlOficial) && !/^https?:\/\//i.test(urlOficial)) error(`${donde}: "programa.url_oficial" debe empezar por https://`);
    if (!vacio(p.web_oficial) && !/^https?:\/\//i.test(p.web_oficial)) error(`${donde}: "web_oficial" debe empezar por https://`);
    camposDesconocidos(Object.fromEntries(Object.entries(p).filter(([campo]) => !(campo in CAMPOS_ANTIGUOS))), CAMPOS_PARTIDO, donde);
    if (!vacio(p.id)) partidoPorId.set(p.id, p);
  });
} else if (partidos !== null) {
  error(`${archivoPartidos} debe ser una lista: empieza por [ y termina por ].`);
}

// --- Temas ---
const temaPorId = new Map();
if (Array.isArray(temas)) {
  idsDuplicados(temas, 'temas.json');
  temas.forEach((t, i) => {
    const donde = `temas.json, tema nº ${i + 1}${vacio(t?.id) ? '' : ` ("${t.id}")`}`;
    for (const campo of ['id', 'nombre']) if (vacio(t[campo])) error(`${donde}: falta el campo "${campo}".`);
    camposDesconocidos(t, CAMPOS_TEMA, donde);
    if (!vacio(t.id)) temaPorId.set(t.id, t);
  });
} else if (temas !== null) {
  error('temas.json debe ser una lista: empieza por [ y termina por ].');
}

// --- Propuestas ---
const validas = [];
if (Array.isArray(propuestas)) {
  if (propuestas.length === 0) {
    aviso(`${archivoPropuestas} está vacío: la web se mostrará en modo demostración, con los datos de ejemplo y un banner.`);
  }
  idsDuplicados(propuestas, archivoPropuestas);

  // Términos que delatan a un partido: nombre, siglas y líderes de todos los partidos conocidos.
  const todosLosPartidos = [...(partidos ?? []), ...(partidosReales ?? [])].filter((p) => p && typeof p === 'object');
  const terminos = todosLosPartidos.flatMap((p) =>
    [p.nombre, p.siglas, ...(Array.isArray(p.lideres) ? p.lideres : [])]
      .filter((t) => typeof t === 'string' && t.trim().length > 1)
      .map((t) => ({ termino: t.trim(), partido: p.nombre ?? p.id })),
  );

  const inactivas = new Map();
  const textosVistos = new Map();
  let ejemplosPresentes = 0;

  propuestas.forEach((p, i) => {
    if (!p || typeof p !== 'object' || Array.isArray(p)) {
      error(`${archivoPropuestas}, propuesta nº ${i + 1}: no es una propuesta válida (debe ir entre llaves { }).`);
      return;
    }
    const donde = `Propuesta nº ${i + 1}${vacio(p.id) ? '' : ` ("${p.id}")`}`;
    let correcta = true;

    const obligatorios = ['id', 'partido', 'tema', 'texto', 'pagina', 'url_fuente'].filter((c) => !(c === 'url_fuente' && p.ejemplo === true));
    for (const campo of obligatorios) {
      if (vacio(p[campo])) {
        error(`${donde}: el campo "${campo}" está vacío o falta.`);
        correcta = false;
      }
    }
    if (!vacio(p.id) && /\s/.test(p.id)) aviso(`${donde}: el id contiene espacios; mejor usar guiones, por ejemplo "psoe-vivienda-01".`);

    if (!vacio(p.partido)) {
      const partido = partidoPorId.get(p.partido);
      if (!partido) {
        error(`${donde}: el partido "${p.partido}" no existe en ${archivoPartidos}. Ids válidos: ${[...partidoPorId.keys()].join(', ')}.`);
        correcta = false;
      } else if (partido.en_juego !== true) {
        inactivas.set(p.partido, (inactivas.get(p.partido) ?? 0) + 1);
        correcta = false;
      }
    }
    if (!vacio(p.tema) && !temaPorId.has(p.tema)) {
      error(`${donde}: el tema "${p.tema}" no existe en temas.json. Ids válidos: ${[...temaPorId.keys()].join(', ')}.`);
      correcta = false;
    }
    if (!vacio(p.pagina) && !(Number.isInteger(p.pagina) && p.pagina > 0)) {
      error(`${donde}: "pagina" debe ser un número entero sin comillas (por ejemplo 23), no "${p.pagina}".`);
    }
    if (!vacio(p.url_fuente) && !/^https?:\/\//i.test(p.url_fuente)) error(`${donde}: "url_fuente" debe empezar por https://`);
    if (p.peso !== undefined && !(typeof p.peso === 'number' && p.peso > 0)) error(`${donde}: "peso" debe ser un número mayor que 0 (por ejemplo 1 o 2).`);
    if (p.texto_anonimo !== undefined && vacio(p.texto_anonimo)) aviso(`${donde}: "texto_anonimo" está vacío; si no lo necesitas, borra la línea entera.`);
    if (p.ejemplo === true) ejemplosPresentes++;

    // Marcas para «¿Conoces a tu partido?»
    if (p.compartida_con !== undefined) {
      if (!Array.isArray(p.compartida_con) || p.compartida_con.some((id) => typeof id !== 'string')) {
        error(`${donde}: "compartida_con" debe ser una lista de ids de partido entre comillas, por ejemplo ["pp", "psoe"].`);
      } else {
        for (const id of p.compartida_con) {
          if (!partidoPorId.has(id)) error(`${donde}: "compartida_con" incluye el partido "${id}", que no existe en ${archivoPartidos}.`);
          else if (id === p.partido) aviso(`${donde}: "compartida_con" incluye a su propio partido ("${id}"); basta con poner los demás.`);
        }
        if (p.compartida_con.length === 0) aviso(`${donde}: "compartida_con" está vacío; si no es compartida, borra la línea entera.`);
      }
    }
    if (p.ambigua !== undefined && typeof p.ambigua !== 'boolean') {
      error(`${donde}: "ambigua" debe ser true o false (sin comillas).`);
    }
    camposDesconocidos(p, CAMPOS_PROPUESTA, donde);

    // Anonimato: se revisa el texto que se muestra (texto_anonimo si existe; si no, texto).
    const usaAnonimo = typeof p.texto_anonimo === 'string' && p.texto_anonimo.trim() !== '';
    const mostrado = usaAnonimo ? p.texto_anonimo : typeof p.texto === 'string' ? p.texto : '';
    const campoMostrado = usaAnonimo ? '"texto_anonimo"' : '"texto" (no tiene "texto_anonimo")';
    const pistas = new Set();
    for (const { termino, partido } of terminos) {
      if (contieneTermino(mostrado, termino)) pistas.add(`"${termino}" (${partido})`);
    }
    for (const expresion of expresiones) {
      if (contieneExpresion(mostrado, expresion)) pistas.add(`la expresión "${expresion}"`);
    }
    if (pistas.size) {
      aviso(
        `${donde}: el ${campoMostrado} contiene ${[...pistas].join(', ')}. ` +
          `Si delata el partido, escribe un "texto_anonimo" sin esa pista.`,
      );
    }

    if (typeof p.texto === 'string' && p.texto.trim()) {
      const clave = p.texto.trim().toLowerCase();
      if (textosVistos.has(clave)) aviso(`${donde}: tiene el mismo texto que la propuesta "${textosVistos.get(clave)}". ¿Está repetida?`);
      else textosVistos.set(clave, p.id ?? `nº ${i + 1}`);
    }

    if (correcta) validas.push(p);
  });

  for (const [id, n] of inactivas) {
    aviso(`Hay ${n} ${n === 1 ? 'propuesta' : 'propuestas'} del partido "${id}", que tiene "en_juego": false. No se mostrarán hasta que lo cambies a true.`);
  }
  if (ejemplosPresentes && !modoEjemplo) {
    error(
      `Hay ${ejemplosPresentes} ${ejemplosPresentes === 1 ? 'propuesta' : 'propuestas'} de EJEMPLO ("ejemplo": true) en ${archivoPropuestas}. ` +
        'Son ficticias: bórralas antes de publicar.',
    );
  }
} else if (propuestas !== null) {
  error(`${archivoPropuestas} debe ser una lista: empieza por [ y termina por ].`);
}

// --- Equilibrio ---
const activos = [...partidoPorId.values()].filter((p) => p.en_juego === true);
const etiqueta = (p) => p.siglas || p.nombre || p.id;
const cuenta = (filtro) => validas.filter(filtro).length;
let tabla = '';
let resumenConoces = '';

if (activos.length && temaPorId.size && validas.length) {
  const conPropuestas = activos.filter((p) => validas.some((v) => v.partido === p.id));
  for (const p of activos) if (!conPropuestas.includes(p)) aviso(`El partido "${p.id}" tiene "en_juego": true pero ninguna propuesta: no aparecerá en el juego ni en el test.`);
  if (conPropuestas.length < 2) aviso('Hay menos de 2 partidos con propuestas: el juego necesita al menos 2 (lo ideal son 4 o más).');

  // Totales por partido
  const totales = conPropuestas.map((p) => ({ p, n: cuenta((v) => v.partido === p.id) }));
  const max = Math.max(...totales.map((t) => t.n));
  const min = Math.min(...totales.map((t) => t.n));
  if (max - min > tolerancia) {
    aviso(`Desequilibrio entre partidos: ${totales.map((t) => `${etiqueta(t.p)} ${t.n}`).join(', ')}. Lo ideal es el mismo número para todos.`);
  }

  // Por tema
  const temasUsados = [...temaPorId.values()].filter((t) => validas.some((v) => v.tema === t.id));
  const temasVacios = [...temaPorId.values()].filter((t) => !temasUsados.includes(t));
  if (temasVacios.length) aviso(`Temas sin ninguna propuesta todavía: ${temasVacios.map((t) => t.nombre).join(', ')}.`);

  for (const tema of temasUsados) {
    const porPartido = conPropuestas.map((p) => ({ p, n: cuenta((v) => v.partido === p.id && v.tema === tema.id) }));
    const maxT = Math.max(...porPartido.map((x) => x.n));
    const minT = Math.min(...porPartido.map((x) => x.n));
    if (maxT - minT > tolerancia) {
      aviso(`Desequilibrio en el tema "${tema.nombre}": ${porPartido.map((x) => `${etiqueta(x.p)} ${x.n}`).join(', ')}.`);
    }
  }

  for (const p of conPropuestas) {
    const cortos = temasUsados
      .map((t) => ({ t, n: cuenta((v) => v.partido === p.id && v.tema === t.id) }))
      .filter((x) => x.n < minimoPorTema);
    if (cortos.length) {
      aviso(
        `${etiqueta(p)} tiene menos de ${minimoPorTema} propuestas en: ${cortos.map((x) => `${x.t.nombre} (${x.n})`).join(', ')}.`,
      );
    }
  }

  // Tabla resumen: temas × partidos
  const anchoTema = Math.max(5, ...temasUsados.map((t) => t.nombre.length)) + 2;
  const columnas = conPropuestas.map((p) => Math.max(4, etiqueta(p).length) + 2);
  const fila = (primera, celdas, total) =>
    '  ' + primera.padEnd(anchoTema) + celdas.map((c, i) => String(c).padStart(columnas[i])).join('') + String(total).padStart(8);
  const lineas = [fila('Tema', conPropuestas.map(etiqueta), 'Total')];
  for (const t of temasUsados) {
    const celdas = conPropuestas.map((p) => cuenta((v) => v.partido === p.id && v.tema === t.id));
    lineas.push(fila(t.nombre, celdas, cuenta((v) => v.tema === t.id)));
  }
  lineas.push(fila('TOTAL', totales.map((t) => t.n), validas.length));
  tabla = lineas.join('\n');

  // «¿Conoces a tu partido?»: propuestas válidas para el modo y máximo de preguntas por partido.
  const conoces = config?.conoces ?? {};
  const proporcion = typeof conoces.proporcion_partido === 'number' ? conoces.proporcion_partido : 0.5;
  const minimoPreguntas = conoces.minimo_preguntas ?? 6;
  const mayorTest = Math.max(...(Array.isArray(conoces.preguntas) && conoces.preguntas.length ? conoces.preguntas : [20]));
  const minimoConoces = ajustes.conoces_minimo_por_partido ?? 10;
  const minimoConocesTema = ajustes.conoces_minimo_por_tema ?? 2;
  const aptas = validas.filter(esValidaParaConoces);
  const excluidas = validas.length - aptas.length;

  const porPartido = conPropuestas.map((p) => {
    const { propias, ajenas } = propuestasDisponibles(validas, p.id);
    return { p, propias: propias.length, maximo: preguntasPosibles(propias.length, ajenas.length, proporcion) };
  });

  for (const { p, propias, maximo } of porPartido) {
    if (propias < minimoConoces) {
      aviso(`¿Conoces a tu partido?: ${etiqueta(p)} solo tiene ${propias} propuestas válidas para este modo (sin contar compartidas ni ambiguas); se recomiendan al menos ${minimoConoces}.`);
    }
    if (maximo < minimoPreguntas) {
      aviso(`¿Conoces a tu partido?: con ${etiqueta(p)} no se puede jugar todavía (harían falta propuestas para al menos ${minimoPreguntas} preguntas).`);
    }
    const temasCortos = temasUsados
      .map((t) => ({ t, n: aptas.filter((v) => v.partido === p.id && v.tema === t.id).length }))
      .filter((x) => x.n < minimoConocesTema);
    if (temasCortos.length) {
      aviso(`¿Conoces a tu partido?: ${etiqueta(p)} tiene menos de ${minimoConocesTema} propuestas válidas en: ${temasCortos.map((x) => `${x.t.nombre} (${x.n})`).join(', ')}.`);
    }
  }

  const maximos = porPartido.map((x) => x.maximo);
  const propiasPorPartido = porPartido.map((x) => x.propias);
  if (Math.max(...maximos) !== Math.min(...maximos) || Math.max(...propiasPorPartido) - Math.min(...propiasPorPartido) > tolerancia) {
    aviso(
      '¿Conoces a tu partido?: el test no es igual para todos los partidos (unos tendrían más preguntas o más propuestas ' +
        `distintas entre las que elegir, y el test sería más fácil o difícil según el partido): ` +
        porPartido.map((x) => `${etiqueta(x.p)} ${x.propias} propuestas válidas, máximo ${x.maximo} preguntas`).join('; ') + '.',
    );
  }

  resumenConoces =
    `  Máximo de preguntas posible por partido (el test más largo es de ${mayorTest}): ` +
    porPartido.map((x) => `${etiqueta(x.p)} ${x.maximo}`).join(' · ') +
    (excluidas ? `\n  Propuestas marcadas como compartidas o ambiguas (no se usan en este modo): ${excluidas}` : '');
}

// --- Directorio «Partidos y programas» ---
const AMBITOS = ['estatal', 'territorial', 'coalicion'];
const ESTADOS = ['pendiente', 'publicado'];
const CAMPOS_PROGRAMA = ['estado', 'url_oficial', 'archivo_local', 'sha256', 'fecha_publicacion', 'fecha_comprobacion', 'version', 'paginas'];
const CAMPOS_RESUMEN = ['partido', 'ejemplo', 'autor', 'fecha_elaboracion', 'revisado', 'introduccion', 'temas'];
const esFecha = (valor) => typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor);
const rutaLocal = (ruta) => path.join(raiz, String(ruta).trim().replace(/^\.?\/+/, ''));
const palabrasValorativas = ajustes.palabras_valorativas ?? [];
const diferenciaResumenes = ajustes.resumen_diferencia_maxima ?? 1.5;
const minimoEnJuego = ajustes.en_juego_minimo_propuestas ?? 10;
const urlsAComprobar = [];
const extensiones = [];

if (Array.isArray(partidos)) {
  const sinWeb = [];
  const porVerificar = [];

  for (const [i, p] of partidos.entries()) {
    if (!p || typeof p !== 'object') continue;
    const donde = `${archivoPartidos}, partido nº ${i + 1}${vacio(p.id) ? '' : ` ("${p.id}")`}`;

    if (p.ambito !== undefined && !AMBITOS.includes(p.ambito)) error(`${donde}: "ambito" debe ser "estatal", "territorial" o "coalicion".`);
    if (p.territorio !== undefined && (!Array.isArray(p.territorio) || p.territorio.some((t) => typeof t !== 'string'))) {
      error(`${donde}: "territorio" debe ser una lista entre corchetes, por ejemplo ["Cataluña"].`);
    }
    if (p.coalicion_de !== undefined) {
      if (!Array.isArray(p.coalicion_de)) {
        error(`${donde}: "coalicion_de" debe ser una lista de ids de partido, por ejemplo ["iu", "mas-madrid"].`);
      } else {
        for (const id of p.coalicion_de) {
          if (!partidoPorId.has(id)) error(`${donde}: "coalicion_de" cita el partido "${id}", que no existe en ${archivoPartidos}. Añádelo (puede llevar "en_directorio": false).`);
          else if (id === p.id) error(`${donde}: "coalicion_de" se incluye a sí mismo.`);
        }
      }
    }
    if (p.en_directorio === true && p.ambito === 'coalicion' && !(Array.isArray(p.coalicion_de) && p.coalicion_de.length)) {
      aviso(`${donde}: es una coalición pero "coalicion_de" está vacío; su ficha no mostrará los integrantes.`);
    }

    if (p.en_directorio === true && !p.ejemplo) {
      if (vacio(p.web_oficial)) sinWeb.push(p.id);
      if (p.verificar === true) porVerificar.push(p.id);
      if (!vacio(p.web_oficial)) urlsAComprobar.push({ donde, campo: 'web_oficial', url: p.web_oficial });
    }

    // Programa
    const programa = p.programa;
    if (programa !== undefined) {
      if (typeof programa !== 'object' || Array.isArray(programa) || programa === null) {
        error(`${donde}: "programa" debe ir entre llaves { }.`);
      } else {
        camposDesconocidos(programa, CAMPOS_PROGRAMA, `${donde}, programa`);
        if (!ESTADOS.includes(programa.estado)) error(`${donde}: "programa.estado" debe ser "pendiente" o "publicado".`);
        if (programa.estado === 'publicado' && vacio(programa.url_oficial) && !p.ejemplo) {
          aviso(`${donde}: el programa está "publicado" pero falta "url_oficial" (enlace al PDF en la web del partido).`);
        }
        if (!vacio(programa.url_oficial)) urlsAComprobar.push({ donde, campo: 'programa.url_oficial', url: programa.url_oficial });
        for (const campo of ['fecha_publicacion', 'fecha_comprobacion']) {
          if (!vacio(programa[campo]) && !esFecha(programa[campo])) aviso(`${donde}: "programa.${campo}" debe tener el formato AAAA-MM-DD, por ejemplo "2026-11-10".`);
        }
        if (programa.paginas !== undefined && !(Number.isInteger(programa.paginas) && programa.paginas > 0)) {
          aviso(`${donde}: "programa.paginas" debe ser un número entero sin comillas.`);
        }
        if (!vacio(programa.archivo_local)) {
          let contenido = null;
          try {
            contenido = await readFile(rutaLocal(programa.archivo_local));
          } catch {
            error(`${donde}: no se encuentra la copia guardada "${programa.archivo_local}". ¿Has subido el PDF a la carpeta programas/?`);
          }
          if (contenido) {
            const huella = createHash('sha256').update(contenido).digest('hex');
            if (vacio(programa.sha256)) {
              aviso(`${donde}: la copia guardada no tiene "sha256". Añade: "sha256": "${huella}"`);
            } else if (programa.sha256.trim().toLowerCase() !== huella) {
              error(`${donde}: la huella "sha256" no coincide con el archivo ${programa.archivo_local}: el PDF ha cambiado. ` +
                `Si es una versión nueva, actualiza "sha256" a "${huella}" y la fecha de comprobación.`);
            }
            if (vacio(programa.fecha_comprobacion)) aviso(`${donde}: falta "programa.fecha_comprobacion" (fecha en que descargaste la copia).`);
          }
        }
      }
    }

    // Resumen
    if (!vacio(p.resumen)) {
      let texto = null;
      try {
        texto = await readFile(rutaLocal(p.resumen), 'utf8');
      } catch {
        error(`${donde}: no se encuentra el resumen "${p.resumen}".`);
      }
      let resumen = null;
      if (texto !== null) {
        try {
          resumen = JSON.parse(texto);
        } catch (e) {
          error(`${donde}: el resumen "${p.resumen}" no es un JSON válido. Detalle: ${e.message}`);
        }
      }
      if (resumen) {
        const dondeR = `Resumen ${p.resumen}`;
        camposDesconocidos(resumen, CAMPOS_RESUMEN, dondeR);
        if (resumen.partido !== p.id) error(`${dondeR}: "partido" es "${resumen.partido}" pero el archivo está enlazado desde "${p.id}".`);
        if (resumen.ejemplo === true && !modoEjemplo) error(`${dondeR}: es un resumen de EJEMPLO ("ejemplo": true). Es ficticio: no lo enlaces desde un partido real.`);
        if (typeof resumen.revisado !== 'boolean') aviso(`${dondeR}: falta "revisado": true o false.`);
        if (resumen.revisado === false && !resumen.ejemplo) aviso(`${dondeR}: está pendiente de revisión ("revisado": false).`);
        const lista = Array.isArray(resumen.temas) ? resumen.temas : [];
        if (!Array.isArray(resumen.temas)) error(`${dondeR}: "temas" debe ser una lista.`);
        const presentes = new Set(lista.map((t) => t?.tema));
        for (const t of lista) {
          if (!temaPorId.has(t?.tema)) error(`${dondeR}: el tema "${t?.tema}" no existe en temas.json.`);
        }
        const faltan = [...temaPorId.keys()].filter((id) => !presentes.has(id));
        if (faltan.length) aviso(`${dondeR}: faltan temas (${faltan.join(', ')}). Todos los resúmenes deben tener los mismos temas; si el programa no trata uno, pon "puntos": [].`);

        let caracteres = 0;
        let puntos = 0;
        const textos = [resumen.introduccion ?? ''];
        for (const t of lista) {
          for (const [j, punto] of (Array.isArray(t?.puntos) ? t.puntos : []).entries()) {
            puntos++;
            caracteres += String(punto?.texto ?? '').length;
            textos.push(String(punto?.texto ?? ''));
            if (vacio(punto?.texto)) error(`${dondeR}, tema "${t.tema}", punto ${j + 1}: el texto está vacío.`);
            if (!(Number.isInteger(punto?.pagina) && punto.pagina > 0)) aviso(`${dondeR}, tema "${t.tema}", punto ${j + 1}: falta la página del programa (número sin comillas).`);
          }
        }
        const valorativas = palabrasValorativas.filter((palabra) => textos.some((x) => contieneExpresion(x, palabra)));
        if (valorativas.length) aviso(`${dondeR}: contiene palabras valorativas (${valorativas.join(', ')}). Los resúmenes deben describir, no valorar.`);
        if (!resumen.ejemplo || modoEjemplo) extensiones.push({ id: p.id, puntos, caracteres });
      }
    }

    // En el juego sin propuestas suficientes
    if (p.en_juego === true) {
      const n = validas.filter((v) => v.partido === p.id).length;
      if (n > 0 && n < minimoEnJuego) aviso(`${donde}: tiene "en_juego": true pero solo ${n} propuestas válidas (se recomiendan al menos ${minimoEnJuego}).`);
    }
  }

  if (sinWeb.length) aviso(`Directorio: ${sinWeb.length} ${sinWeb.length === 1 ? 'partido' : 'partidos'} sin "web_oficial": ${sinWeb.join(', ')}.`);
  if (porVerificar.length) aviso(`Directorio: ${porVerificar.length} ${porVerificar.length === 1 ? 'partido' : 'partidos'} con "verificar": true (datos por confirmar): ${porVerificar.join(', ')}.`);

  if (extensiones.length > 1) {
    const max = Math.max(...extensiones.map((e) => e.caracteres));
    const min = Math.min(...extensiones.map((e) => e.caracteres));
    if (min === 0 || max / min > diferenciaResumenes) {
      aviso(
        `Resúmenes con extensión muy desigual (más de ${diferenciaResumenes} veces de diferencia): ` +
          extensiones.map((e) => `${e.id} ${e.puntos} puntos y ${e.caracteres} caracteres`).join('; ') + '.',
      );
    }
  }
}

if (comprobarUrls && urlsAComprobar.length) {
  console.log(gris(`Comprobando ${urlsAComprobar.length} enlaces…`));
  await Promise.all(
    urlsAComprobar.map(async ({ donde, campo, url }) => {
      try {
        let respuesta = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
        if (respuesta.status === 405 || respuesta.status === 403) {
          respuesta = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
        }
        if (!respuesta.ok) aviso(`${donde}: "${campo}" (${url}) responde con error ${respuesta.status}.`);
      } catch {
        aviso(`${donde}: "${campo}" (${url}) no responde. Puede ser un problema puntual; vuelve a comprobarlo.`);
      }
    }),
  );
}

// ---------- Informe ----------

if (errores.length) {
  console.log(rojo(negrita(`✖ ERRORES (${errores.length}) — hay que corregirlos:`)));
  for (const e of errores) console.log(rojo('  • ') + e);
  console.log();
}
if (avisos.length) {
  console.log(amarillo(negrita(`⚠ AVISOS (${avisos.length}) — conviene revisarlos:`)));
  for (const a of avisos) console.log(amarillo('  • ') + a);
  console.log();
}
if (tabla) {
  console.log(negrita('Propuestas válidas por tema y partido:'));
  console.log(tabla);
  console.log();
}
if (resumenConoces) {
  console.log(negrita('«¿Conoces a tu partido?»:'));
  console.log(resumenConoces);
  console.log();
}

if (errores.length) {
  console.log(rojo(negrita('✖ Hay errores: corrígelos antes de publicar.')) + '\n');
  process.exitCode = 1;
} else if (avisos.length) {
  console.log(verde(negrita('✔ Sin errores.')) + ' Revisa los avisos: no impiden publicar, pero pueden afectar a la neutralidad.\n');
} else {
  console.log(verde(negrita('✔ Todo correcto.')) + '\n');
}
