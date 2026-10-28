// Páginas de texto (Inicio, Metodología, Sobre): se copian de los <template> de index.html
// y se rellenan los huecos marcados con data-dato / data-lista.
import { escapar, urlPrograma } from './utilidades.js';

export function pintarPagina(idPlantilla, contenedor, datos) {
  const plantilla = document.getElementById(idPlantilla);
  contenedor.append(plantilla.content.cloneNode(true));

  const resumen = contenedor.querySelector('[data-dato="resumen"]');
  if (resumen) {
    const n = datos.propuestas.length;
    if (datos.modoEjemplo) {
      resumen.textContent = `Ahora mismo hay ${n} propuestas ficticias de ejemplo. Las reales se añadirán cuando se publiquen los programas.`;
    } else if (n === 0) {
      resumen.textContent = 'Las propuestas se añadirán cuando se publiquen los programas electorales.';
    } else {
      resumen.textContent = `${n} propuestas de ${datos.partidos.length} partidos sobre ${datos.temas.length} temas.`;
    }
  }

  const listaProgramas = contenedor.querySelector('[data-lista="programas"]');
  if (listaProgramas) listaProgramas.innerHTML = htmlProgramas(datos.partidosOficiales);
}

/** Lista de enlaces a los programas oficiales (se usa también al final del juego y del test). */
// Los programas publicados se enlazan uno a uno; los pendientes se resumen en una línea que lleva al directorio.
export function htmlProgramas(partidos) {
  const directorio = '<a href="#/partidos">directorio de partidos</a>';
  if (!partidos.length) {
    return `<li>Los enlaces a los programas oficiales se añadirán cuando los partidos los publiquen. Consulta el ${directorio}.</li>`;
  }
  const publicados = [...partidos]
    .filter((p) => urlPrograma(p))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map((p) => {
      const nombre = `${escapar(p.nombre)}${p.siglas && p.siglas !== p.nombre ? ` (${escapar(p.siglas)})` : ''}`;
      return `<li><a href="${escapar(urlPrograma(p))}" target="_blank" rel="noopener noreferrer">${nombre}<span class="sr-only"> (PDF, se abre en una pestaña nueva)</span></a></li>`;
    });
  const pendientes = partidos.length - publicados.length;
  if (pendientes) {
    publicados.push(
      `<li>${publicados.length ? `Otras ${pendientes}` : pendientes === 1 ? 'Una' : `Las ${pendientes}`} ` +
        `${pendientes === 1 ? 'candidatura aún no ha publicado su programa' : 'candidaturas aún no han publicado su programa'}: ` +
        `puedes seguir su estado en el ${directorio}.</li>`,
    );
  }
  return publicados.join('');
}
