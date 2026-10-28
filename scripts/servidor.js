// Servidor local para ver la web en tu ordenador: npm run dev
// No hace falta para publicar la web; solo sirve los archivos tal cual.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const puerto = Number(process.env.PORT) || 5173;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/plain; charset=utf-8',
};

const servidor = http.createServer(async (peticion, respuesta) => {
  try {
    let ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = path.join(raiz, ruta);
    const oculto = ruta.split('/').some((parte) => parte.startsWith('.'));
    if (!archivo.startsWith(raiz + path.sep) || oculto) {
      respuesta.writeHead(403).end();
      return;
    }
    const contenido = await readFile(archivo);
    respuesta.writeHead(200, {
      'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    respuesta.end(contenido);
  } catch {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
});

servidor.listen(puerto, () => {
  console.log(`\n  Programas a ciegas funcionando en: http://localhost:${puerto}\n  (Pulsa Ctrl+C para pararlo)\n`);
});
