// Provisional: el resultado se construye en la fase (c).
import { escapar } from './utilidades.js';

export function htmlResultadoConoces(estado, datos) {
  return `<h1 tabindex="-1">Tu resultado con ${escapar(datos.partidoPorId.get(estado.partido).nombre)}</h1>`;
}
