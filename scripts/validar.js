// Revisa los datos de /data antes de publicar: npm run validar
// Para revisar los datos de ejemplo en lugar de los reales: npm run validar -- --ejemplo
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const carpetaDatos = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const modoEjemplo = process.argv.includes('--ejemplo');

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

const CAMPOS_PARTIDO = ['id', 'nombre', 'siglas', 'color', 'url_programa', 'activo', 'lideres', 'ejemplo'];
const CAMPOS_TEMA = ['id', 'nombre'];
const CAMPOS_PROPUESTA = ['id', 'partido', 'tema', 'texto', 'texto_anonimo', 'pagina', 'url_fuente', 'peso', 'ejemplo', 'nota'];

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
    if (typeof p.activo !== 'boolean') error(`${donde}: "activo" debe ser true o false (sin comillas).`);
    if (!vacio(p.color) && !/^#[0-9a-f]{6}$/i.test(p.color)) aviso(`${donde}: el color "${p.color}" no tiene el formato #RRGGBB (por ejemplo "#1E73BE").`);
    if (p.lideres !== undefined && (!Array.isArray(p.lideres) || p.lideres.some((l) => typeof l !== 'string'))) {
      error(`${donde}: "lideres" debe ser una lista de nombres entre comillas, por ejemplo ["Nombre Apellido"].`);
    }
    if (p.activo === true && vacio(p.url_programa) && !p.ejemplo) aviso(`${donde}: está activo pero no tiene "url_programa" (enlace al programa oficial).`);
    if (!vacio(p.url_programa) && !/^https?:\/\//i.test(p.url_programa)) error(`${donde}: "url_programa" debe empezar por https://`);
    camposDesconocidos(p, CAMPOS_PARTIDO, donde);
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
      } else if (partido.activo !== true) {
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
    aviso(`Hay ${n} ${n === 1 ? 'propuesta' : 'propuestas'} del partido "${id}", que tiene "activo": false. No se mostrarán hasta que lo actives.`);
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
const activos = [...partidoPorId.values()].filter((p) => p.activo === true);
const etiqueta = (p) => p.siglas || p.nombre || p.id;
const cuenta = (filtro) => validas.filter(filtro).length;
let tabla = '';

if (activos.length && temaPorId.size && validas.length) {
  const conPropuestas = activos.filter((p) => validas.some((v) => v.partido === p.id));
  for (const p of activos) if (!conPropuestas.includes(p)) aviso(`El partido "${p.id}" está activo pero no tiene ninguna propuesta: no aparecerá en la web.`);
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

if (errores.length) {
  console.log(rojo(negrita('✖ Hay errores: corrígelos antes de publicar.')) + '\n');
  process.exitCode = 1;
} else if (avisos.length) {
  console.log(verde(negrita('✔ Sin errores.')) + ' Revisa los avisos: no impiden publicar, pero pueden afectar a la neutralidad.\n');
} else {
  console.log(verde(negrita('✔ Todo correcto.')) + '\n');
}
