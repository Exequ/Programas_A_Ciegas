// Funciones de apoyo compartidas por toda la web.

/** Escapa texto para insertarlo de forma segura dentro de HTML. */
export function escapar(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Devuelve la URL solo si es http(s); evita enlaces peligrosos o vacíos. */
export function urlSegura(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}

/** Devuelve el color solo si es un color hexadecimal válido. */
export function colorSeguro(color, porDefecto = '#6b7280') {
  return typeof color === 'string' && /^#[0-9a-f]{3,8}$/i.test(color.trim()) ? color.trim() : porDefecto;
}

/** Copia barajada de una lista (Fisher–Yates). `azar` permite fijar el resultado en las pruebas. */
export function barajar(lista, azar = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Agrupa una lista en un Map según la clave que devuelve `clave(elemento)`. */
export function agruparPor(lista, clave) {
  const grupos = new Map();
  for (const elemento of lista) {
    const k = clave(elemento);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(elemento);
  }
  return grupos;
}

/** Toma un elemento de cada lista por turnos: [[a,b],[c]] → [a,c,b]. */
export function intercalar(listas) {
  const resultado = [];
  const maximo = Math.max(0, ...listas.map((l) => l.length));
  for (let i = 0; i < maximo; i++) {
    for (const lista of listas) if (i < lista.length) resultado.push(lista[i]);
  }
  return resultado;
}

/**
 * Elige `cantidad` propuestas al azar repartidas por igual entre partidos y,
 * dentro de cada partido, entre temas. Si `cantidad` es null, devuelve todas.
 * El orden final se baraja para que no haya patrones (p. ej. el mismo partido cada 4).
 */
export function seleccionEquilibrada(propuestas, cantidad = null) {
  const porPartido = [...agruparPor(propuestas, (p) => p.partido).values()].map((delPartido) =>
    intercalar(barajar([...agruparPor(delPartido, (p) => p.tema).values()]).map((grupo) => barajar(grupo))),
  );
  const ordenadas = intercalar(barajar(porPartido));
  const elegidas = cantidad == null ? ordenadas : ordenadas.slice(0, cantidad);
  return barajar(elegidas);
}

/** Formatea un porcentaje para mostrarlo: 66.7 → "67 %". */
export function formatoPorcentaje(valor) {
  return valor == null ? '—' : `${Math.round(valor)} %`;
}

/** Lee un valor de sessionStorage (memoria temporal de la pestaña). */
export function leerSesion(clave) {
  try {
    const valor = sessionStorage.getItem(clave);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

/** Guarda un valor en sessionStorage. Si el navegador no lo permite, no pasa nada. */
export function guardarSesion(clave, valor) {
  try {
    sessionStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* Navegación privada o almacenamiento bloqueado: se ignora. */
  }
}

/** URL del programa oficial de un partido, si es válida. */
export function urlPrograma(partido) {
  return urlSegura(partido?.programa?.url_oficial);
}

/** Enlace a la fuente de una propuesta (o aviso si no hay URL, como en los ejemplos). */
export function enlaceFuente(propuesta, partido) {
  const url = urlSegura(propuesta.url_fuente) ?? urlPrograma(partido);
  const pagina = propuesta.pagina ? `página ${escapar(propuesta.pagina)}` : 'página sin indicar';
  const nombre = escapar(partido?.nombre ?? propuesta.partido);
  if (propuesta.ejemplo) {
    return `<span>Programa de ${nombre} · ${pagina} · <em>propuesta ficticia de ejemplo, sin PDF</em></span>`;
  }
  const enlace = url
    ? ` · <a href="${escapar(url)}" target="_blank" rel="noopener noreferrer">Abrir el PDF oficial<span class="sr-only"> (se abre en una pestaña nueva)</span></a>`
    : '';
  return `<span>Programa de ${nombre} · ${pagina}${enlace}</span>`;
}

/** Etiqueta visible de propuesta ficticia. */
export function etiquetaEjemplo(propuesta) {
  return propuesta.ejemplo ? '<span class="etiqueta etiqueta--ejemplo">Ejemplo ficticio</span>' : '';
}

/** Lleva el foco a un título para que los lectores de pantalla anuncien el cambio de pantalla. */
export function enfocarTitulo(contenedor, selector = 'h1') {
  const titulo = contenedor.querySelector(selector);
  if (titulo) {
    if (!titulo.hasAttribute('tabindex')) titulo.setAttribute('tabindex', '-1');
    titulo.focus({ preventScroll: true });
  }
}

/** Mensaje para cuando no hay propuestas que mostrar (por ejemplo, si ningún partido está activo). */
export function htmlSinPropuestas(titulo) {
  return `
    <h1 tabindex="-1">${escapar(titulo)}</h1>
    <p class="aviso">Todavía no hay propuestas disponibles. Vuelve a visitarnos cuando se publiquen los programas electorales.</p>
    <div class="acciones"><a class="boton boton--secundario" href="#/">Volver al inicio</a></div>`;
}

/** Punto con el color del partido. Solo se usa al revelar el partido o en los resultados. */
export function htmlPuntoPartido(partido) {
  return `<span class="punto-partido" style="--color-partido: ${colorSeguro(partido?.color)}" aria-hidden="true"></span>`;
}
