# Programas a ciegas

Juego y test para leer las propuestas de los programas electorales de las **elecciones generales
de España del 29 de noviembre de 2026** sin saber de qué partido es cada una.

- **Adivina el partido**: rondas de 10 propuestas anónimas; elige de qué partido es cada una.
- **Test de afinidad**: di qué te parece cada propuesta y descubre con qué partidos coincides
  (no es una recomendación de voto ni un sondeo).
- **¿Conoces a tu partido?**: elige un partido y di si cada propuesta anónima es suya o de otro.
- **Partidos y programas**: directorio de candidaturas con enlace a su programa y un resumen por temas.

Web estática, sin dependencias, sin cookies, sin analítica y sin servidor: todo ocurre en el navegador.

## Añadir propuestas

Lee **[docs/COMO_ANADIR_PROPUESTAS.md](docs/COMO_ANADIR_PROPUESTAS.md)** y, para el directorio de partidos,
**[docs/COMO_ANADIR_PROGRAMAS.md](docs/COMO_ANADIR_PROGRAMAS.md)**. Las tareas pendientes están en
**[docs/TAREAS_PENDIENTES.md](docs/TAREAS_PENDIENTES.md)**. En resumen: se editan los
archivos de `data/` y se comprueban con `npm run validar`.

## Órdenes útiles

Necesitas [Node.js](https://nodejs.org) 18 o superior. No hace falta `npm install`.

| Orden | Qué hace |
| --- | --- |
| `npm run dev` | Abre la web en tu ordenador: <http://localhost:5173> |
| `npm run validar` | Revisa los datos de `data/` |
| `npm run validar -- --ejemplo` | Revisa los datos de ejemplo |
| `npm test` | Pruebas del cálculo de afinidad y de la selección de preguntas |

## Estructura

```
index.html            Página única; los textos de Inicio, Metodología y Sobre están en sus <template>
css/estilos.css       Estilos (neutros; colores de partidos solo en resultados)
js/app.js             Navegación entre secciones (#/juego, #/test…)
js/datos.js           Carga de /data y modo demostración
js/juego.js           Modo «Adivina el partido»
js/test.js            Modo test de afinidad
js/resultados.js      Resultados del test
js/conoces*.js        Modo «¿Conoces a tu partido?» (lógica con pruebas en tests/)
js/partidos*.js       Directorio y fichas de partidos (lógica con pruebas en tests/)
programas/            Copias guardadas de los programas en PDF (opcional)
js/afinidad.js        Fórmula de afinidad (con pruebas en tests/)
js/utilidades.js      Funciones comunes (barajar, selección equilibrada…)
data/                 Datos: partidos, temas, propuestas, configuración y ejemplos
scripts/validar.js    Validador de datos
scripts/servidor.js   Servidor local para npm run dev
docs/                 Documentación para quien mantiene los datos
```

## Publicar

Guía paso a paso: **[docs/PUBLICAR_LA_WEB.md](docs/PUBLICAR_LA_WEB.md)**.

Al no tener paso de compilación, se publica la carpeta tal cual:

- **GitHub Pages**: *Settings → Pages → Deploy from a branch*, rama `main`, carpeta `/ (root)`.
- **Netlify / Vercel**: importar el repositorio, sin orden de compilación y con directorio de publicación `.` (raíz).
