# Cómo añadir programas y resúmenes

Esta guía explica, paso a paso y sin dar nada por sabido, cómo mantener la sección **«Partidos y programas»**:
qué partidos aparecen, el enlace a su programa, la copia guardada del PDF y el resumen por temas.
**No hace falta tocar el código**: todo se hace en archivos de la carpeta `data` (y, si quieres guardar PDF,
en la carpeta `programas`).

Si no has usado nunca archivos JSON, lee antes el apartado 1 de `docs/COMO_ANADIR_PROPUESTAS.md`
(comillas, comas y llaves).

---

## 1. Dónde está cada cosa

| Archivo o carpeta | Para qué sirve |
| --- | --- |
| `data/partidos.json` | Una ficha por partido: nombre, ámbito, web, estado del programa… |
| `data/resumenes/{id}.json` | El resumen del programa de cada partido (uno por partido). |
| `programas/` | Copias guardadas de los PDF (opcional). |
| `data/config.json` | Ajustes: orden del directorio (`"alfabetico"` o `"aleatorio"`), palabras valorativas que vigila el validador… |

---

## 2. La ficha de un partido (`data/partidos.json`)

Así es una ficha completa (los valores son de ejemplo):

```json
{
  "id": "erc",
  "nombre": "Esquerra Republicana de Catalunya",
  "siglas": "ERC",
  "ambito": "territorial",
  "territorio": ["Cataluña"],
  "web_oficial": "https://www.esquerra.cat",
  "candidato": "",
  "color": "#F5B100",
  "en_directorio": true,
  "en_juego": false,
  "verificar": true,
  "programa": {
    "estado": "pendiente",
    "url_oficial": ""
  },
  "resumen": "",
  "lideres": [],
  "nota": "Texto libre para ti: qué falta comprobar, de dónde sale un dato…"
}
```

| Campo | Qué poner |
| --- | --- |
| `id` | Nombre corto, en minúsculas, sin espacios ni tildes (`erc`, `eh-bildu`…). No lo cambies una vez publicado. |
| `nombre` y `siglas` | Tal como aparecen en la candidatura oficial. Si no tiene siglas, repite el nombre. |
| `ambito` | `"estatal"`, `"territorial"` o `"coalicion"`. |
| `territorio` | Comunidades o circunscripciones donde se presenta: `["Madrid", "Barcelona"]`. Déjalo fuera si se presenta en toda España. |
| `web_oficial` | Dirección de la web del partido, empezando por `https://`. |
| `candidato` | Cabeza de lista, solo si está confirmado en una fuente oficial. |
| `color` | Color oficial en formato `#RRGGBB`. Se usa en los resultados del juego y los tests y, **solo cuando todas las candidaturas del directorio tienen color**, como marco fino de su tarjeta. Ver más abajo cómo obtenerlo. |
| `en_directorio` | `true` = aparece en el directorio. **Lo decides tú**, con el mismo criterio para todos. |
| `en_juego` | `true` = sus propuestas salen en el juego y los tests. Es independiente del anterior. |
| `verificar` | `true` mientras haya datos sin confirmar. En la ficha aparece un aviso discreto. Quítalo (o pon `false`) cuando esté todo comprobado. |
| `programa` | Estado del programa electoral (ver apartado 4). |
| `resumen` | Ruta del archivo de resumen, por ejemplo `"data/resumenes/erc.json"` (ver apartado 6). |
| `lideres` | Nombres para que el validador detecte pistas en las propuestas anónimas. No se muestran. |
| `nota` | Apuntes para ti. No se muestran. |

### El color de cada partido

El marco de color de las tarjetas funciona con la regla «todos o ninguno»: mientras falte el color de alguna
candidatura del directorio, no se muestra en ninguna (el validador te dice cuáles faltan). Para obtenerlo:

1. Busca el color en la web oficial del partido (a veces lo publican en su «manual de identidad» o «kit de prensa»).
2. Si no lo encuentras, abre su logo y usa un cuentagotas de color (por ejemplo, el de la herramienta de capturas
   o cualquier web de «color picker») para copiar el código que empieza por `#`.
3. Escríbelo así: `"color": "#E1001A"`.

### Añadir un partido nuevo

Copia la ficha de arriba, pégala dentro de la lista (con una coma después de la llave `}` del partido anterior)
y rellénala. El orden dentro del archivo da igual: la web ordena sola (alfabéticamente o al azar).

---

## 3. Coaliciones

Una coalición es una ficha con `"ambito": "coalicion"` y la lista de sus integrantes en `coalicion_de`:

```json
  "ambito": "coalicion",
  "coalicion_de": ["iu", "movimiento-sumar", "comuns", "mas-madrid"],
```

- **Cada integrante necesita su propia ficha** en `partidos.json` (aunque sea mínima), para que la web pueda
  mostrar su nombre. Si no debe aparecer en el directorio, ponle `"en_directorio": false`.
- La ficha de la coalición muestra «Coalición formada por…», y la de cada integrante con ficha, «Forma parte de…».
- Las coaliciones que solo se presentan al Senado no necesitan ficha.

---

## 4. Cuando un partido publique su programa

1. Busca el PDF en la web oficial del partido y ábrelo en el navegador.
2. Copia la dirección de la barra del navegador (debe empezar por `https://`).
3. En la ficha del partido, rellena `programa`:

```json
  "programa": {
    "estado": "publicado",
    "url_oficial": "https://www.partido.es/programa-2026.pdf",
    "fecha_publicacion": "2026-11-10",
    "fecha_comprobacion": "2026-11-11",
    "version": "1",
    "paginas": 120
  },
```

- `estado`: `"pendiente"` mientras no haya programa (la web muestra «Programa aún no publicado» y, si existe,
  un enlace a la web del partido) o `"publicado"`.
- Las fechas, siempre con el formato `AAAA-MM-DD`. `fecha_comprobacion` es el día en que comprobaste el enlace.
- `version`: útil si el partido publica una versión corregida. `paginas`: número sin comillas.

---

## 5. (Opcional) Guardar una copia del PDF

La versión oficial es siempre la del partido. La copia sirve por si el enlace cambia o desaparece.

1. Descarga el PDF y renómbralo así: `{id}-2026.pdf` (por ejemplo, `erc-2026.pdf`).
2. Súbelo a la carpeta `programas/` del repositorio. Desde la web de GitHub: entra en la carpeta `programas`,
   pulsa **Add file → Upload files**, arrastra el PDF y pulsa **Commit changes**. (Con GitHub Desktop, copia el
   archivo dentro de esa carpeta en tu ordenador.)
3. En `programa`, añade:

```json
    "archivo_local": "programas/erc-2026.pdf",
    "sha256": "",
```

4. Ejecuta el validador: te dirá la huella `sha256` del archivo. Cópiala entre las comillas. A partir de ahí, si
   alguien cambia el PDF por error, el validador lo detectará.

La ficha mostrará el botón «Descargar copia guardada (fecha)» con un aviso de que la versión oficial es la del
partido. **Límite de GitHub: 100 MB por archivo.** Si los PDF son muy grandes, mejor no guardar copias.

---

## 6. El resumen del programa

### Reglas (obligatorias)

- Cada punto es una **paráfrasis fiel y comprobable** de lo que dice el programa, con su **página**.
- **Sin adjetivos valorativos ni interpretaciones** («ambicioso», «polémico», «radical»…). Describe, no valores.
  El validador vigila una lista de palabras (en `data/config.json`, `palabras_valorativas`; puedes ampliarla).
- **Mismo formato, mismos temas y extensión parecida** para todos los partidos. El validador avisa si un resumen
  es mucho más largo que otro.
- Si el programa no trata un tema, deja `"puntos": []`: la web mostrará «No aborda este tema en su programa».
- La web añade siempre el aviso «Resumen elaborado por este proyecto; no sustituye al programa oficial».

### Paso a paso

1. Crea el archivo `data/resumenes/{id}.json` (por ejemplo `data/resumenes/erc.json`) con esta plantilla,
   que ya tiene los 14 temas:

```json
{
  "partido": "id-del-partido",
  "autor": "Elaborado por este proyecto",
  "fecha_elaboracion": "2026-11-15",
  "revisado": false,
  "introduccion": "",
  "temas": [
    { "tema": "economia", "puntos": [] },
    { "tema": "vivienda", "puntos": [] },
    { "tema": "sanidad", "puntos": [] },
    { "tema": "educacion", "puntos": [] },
    { "tema": "inmigracion", "puntos": [] },
    { "tema": "seguridad-justicia", "puntos": [] },
    { "tema": "medio-ambiente-energia", "puntos": [] },
    { "tema": "impuestos", "puntos": [] },
    { "tema": "pensiones", "puntos": [] },
    { "tema": "politica-territorial", "puntos": [] },
    { "tema": "exterior-defensa", "puntos": [] },
    { "tema": "igualdad-derechos", "puntos": [] },
    { "tema": "agricultura-rural", "puntos": [] },
    { "tema": "cultura-ciencia", "puntos": [] }
  ]
}
```

2. Cambia `"partido"` por el `id` del partido y pon la fecha.
3. Escribe en `introduccion` 2 o 3 frases neutras (por ejemplo, cuántas páginas tiene el programa y cómo se organiza).
4. En cada tema, añade los puntos así:

```json
    { "tema": "vivienda", "puntos": [
        { "texto": "Construir 50.000 viviendas públicas de alquiler en cuatro años.", "pagina": 34 },
        { "texto": "Limitar la subida anual del alquiler en zonas tensionadas.", "pagina": 36 }
    ] },
```

   (Textos inventados, solo para ver el formato.)

5. En la ficha del partido, enlaza el resumen: `"resumen": "data/resumenes/erc.json"`.
6. **Contrasta cada punto con el programa** (abre el PDF en la página indicada). Solo entonces cambia
   `"revisado": false` por `"revisado": true`. La ficha muestra «Revisado y contrastado con el programa» o
   «Pendiente de revisión».

### Con ayuda de Claude

Puedes pedirle a Claude que prepare un borrador a partir del PDF («resume este programa con la plantilla de
`data/resumenes`, un máximo de N puntos por tema, con página y sin adjetivos valorativos»). El borrador
**siempre** debe revisarse punto por punto contra el PDF antes de marcarlo como revisado.

---

## 7. Comprobar con el validador

Igual que con las propuestas: en la pestaña **Actions** de GitHub (se ejecuta solo con cada cambio) o en tu
ordenador:

```bash
npm run validar
```

Para el directorio avisa de: partidos sin web oficial o con `verificar: true`, programas «publicados» sin
enlace, copias guardadas que no existen o cuya huella no coincide, resúmenes sin página, sin todos los temas,
con palabras valorativas o con extensión muy desigual, coaliciones que citan partidos inexistentes y partidos
`en_juego` con pocas propuestas.

**Comprobar que los enlaces funcionan** (opcional, tarda un poco): en GitHub, pestaña **Actions → Comprobar
enlaces → Run workflow**. O en tu ordenador:

```bash
npm run validar -- --comprobar-urls
```

---

## 8. Publicar los cambios

Igual que en `docs/COMO_ANADIR_PROPUESTAS.md`, apartado 7: editando directamente en GitHub (lápiz ✏️ y
**Commit changes**) o desde tu ordenador:

```bash
git add data/ programas/
```

```bash
git commit -m "Añade el programa y el resumen de ERC"
```

```bash
git push
```

La web se actualiza sola en uno o dos minutos.

---

## 9. Problemas frecuentes

- **La ficha dice «Partido no encontrado»**: comprueba que el `id` de la dirección coincide con el de
  `partidos.json` y que tiene `"en_directorio": true`.
- **«No se ha podido cargar el resumen»**: revisa que la ruta de `resumen` es correcta (por ejemplo
  `data/resumenes/erc.json`) y que el archivo es un JSON válido (el validador te dirá dónde está el fallo).
- **Un tema sale como «Tema aún no resumido»**: falta en el archivo de resumen. Añádelo con sus puntos o con
  `"puntos": []` si el programa no lo trata.
