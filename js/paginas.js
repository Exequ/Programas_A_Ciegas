// Páginas de texto (Inicio, Metodología, Sobre): se copian de los <template> de index.html
// y se rellenan los huecos marcados con data-dato / data-lista.
import { escapar, urlSegura } from './utilidades.js';

export function pintarPagina(idPlantilla, contenedor, datos) {
  const plantilla = document.getElementById(idPlantilla);
  contenedor.append(plantilla.content.cloneNode(true));

  const resumen = contenedor.querySelector('[data-dato="resumen"]');
  if (resumen) {
    const n = datos.propuestas.length;
    resumen.textContent = datos.modoEjemplo
      ? `Ahora mismo hay ${n} propuestas ficticias de ejemplo. Las reales se añadirán cuando se publiquen los programas.`
      : `${n} propuestas de ${datos.partidos.length} partidos sobre ${datos.temas.length} temas.`;
  }

  const listaProgramas = contenedor.querySelector('[data-lista="programas"]');
  if (listaProgramas) listaProgramas.innerHTML = htmlProgramas(datos.partidosOficiales);
}

/** Lista de enlaces a los programas oficiales (se usa también al final del juego y del test). */
export function htmlProgramas(partidos) {
  if (!partidos.length) {
    return '<li>Los enlaces a los programas oficiales se añadirán cuando los partidos los publiquen.</li>';
  }
  return [...partidos]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map((p) => {
      const url = urlSegura(p.url_programa);
      const nombre = `${escapar(p.nombre)}${p.siglas && p.siglas !== p.nombre ? ` (${escapar(p.siglas)})` : ''}`;
      return url
        ? `<li><a href="${escapar(url)}" target="_blank" rel="noopener noreferrer">${nombre}<span class="sr-only"> (PDF, se abre en una pestaña nueva)</span></a></li>`
        : `<li>${nombre}: programa pendiente de publicación</li>`;
    })
    .join('');
}
