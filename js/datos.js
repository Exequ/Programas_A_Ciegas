// Carga los archivos de /data y los deja listos para usar.
// Si /data/propuestas.json está vacío, se usan los datos de ejemplo (modo demostración).

const CARPETA = 'data/';

async function leerJSON(nombre) {
  let respuesta;
  try {
    respuesta = await fetch(CARPETA + nombre, { cache: 'no-cache' });
  } catch {
    throw new Error(`No se pudo cargar data/${nombre}. Si abres la web desde tu ordenador, usa "npm run dev".`);
  }
  if (!respuesta.ok) throw new Error(`No se pudo cargar data/${nombre} (error ${respuesta.status}).`);
  try {
    return await respuesta.json();
  } catch {
    throw new Error(`El archivo data/${nombre} tiene un error de formato. Ejecuta "npm run validar" para localizarlo.`);
  }
}

let promesaDatos = null;

/** Devuelve (una sola vez) todos los datos de la web. */
export function cargarDatos() {
  promesaDatos ??= cargar();
  return promesaDatos;
}

async function cargar() {
  const [partidosReales, temas, propuestasReales, config] = await Promise.all([
    leerJSON('partidos.json'),
    leerJSON('temas.json'),
    leerJSON('propuestas.json'),
    leerJSON('config.json'),
  ]);

  let partidos = partidosReales;
  let propuestas = Array.isArray(propuestasReales) ? propuestasReales : [];
  if (propuestas.length === 0) {
    [partidos, propuestas] = await Promise.all([leerJSON('partidos.ejemplo.json'), leerJSON('propuestas.ejemplo.json')]);
  }

  const partidosActivos = partidos.filter((p) => p.activo === true);
  const partidoPorId = new Map(partidosActivos.map((p) => [p.id, p]));
  const temaPorId = new Map(temas.map((t) => [t.id, t]));

  const propuestasValidas = propuestas
    .filter((p) => partidoPorId.has(p.partido) && temaPorId.has(p.tema) && typeof p.texto === 'string' && p.texto.trim())
    .map((p) => ({
      ...p,
      peso: Number(p.peso) > 0 ? Number(p.peso) : 1,
      mostrado: (typeof p.texto_anonimo === 'string' && p.texto_anonimo.trim()) || p.texto.trim(),
    }));

  // Solo partidos y temas que tienen alguna propuesta.
  const conPropuestas = new Set(propuestasValidas.map((p) => p.partido));
  const temasUsados = new Set(propuestasValidas.map((p) => p.tema));

  return {
    config,
    modoEjemplo: propuestasValidas.some((p) => p.ejemplo === true) || partidosActivos.some((p) => p.ejemplo === true),
    partidos: partidosActivos.filter((p) => conPropuestas.has(p.id)),
    // Partidos reales activos, para la lista de programas oficiales.
    partidosOficiales: partidosReales.filter((p) => p.activo === true),
    temas: temas.filter((t) => temasUsados.has(t.id)),
    propuestas: propuestasValidas,
    partidoPorId,
    temaPorId,
  };
}
