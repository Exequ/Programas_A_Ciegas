# Cómo añadir propuestas

Esta guía explica, paso a paso y sin dar nada por sabido, cómo añadir las propuestas de los
programas electorales a la web. **No hace falta tocar el código**: todo se hace en unos archivos
de texto de la carpeta `data`.

---

## 1. Los archivos que vas a usar

| Archivo | Para qué sirve |
| --- | --- |
| `data/propuestas.json` | **Las propuestas.** Es el archivo que más vas a editar. Empieza vacío: `[]`. |
| `data/partidos.json` | Los partidos: nombre, siglas, color, enlace al programa y si se muestran o no. |
| `data/temas.json` | La lista de temas (Vivienda, Sanidad…). |
| `data/config.json` | Ajustes: propuestas por ronda, duración del test, umbrales del validador… |
| `data/*.ejemplo.json` | Datos ficticios para probar el diseño. **No los toques**: dejan de usarse solos. |

> **Modo demostración:** mientras `propuestas.json` esté vacío, la web enseña los datos de ejemplo
> con un banner que avisa de que son ficticios. En cuanto añadas la primera propuesta real,
> el modo demostración desaparece solo.

Estos archivos están en formato **JSON**. Es texto normal con unas reglas muy estrictas:

- Los textos van **entre comillas dobles**: `"Vivienda"`. Nunca comillas tipográficas (“ ”).
- Los números van **sin comillas**: `"pagina": 23`.
- `true` y `false` van **sin comillas**.
- Entre un elemento y el siguiente va **una coma**. Después del último elemento, **ninguna**.
- Si dentro de un texto necesitas comillas dobles, escríbelas así: `\"`. Las comillas
  angulares « » y las simples ' ' se pueden usar sin problema.

No te preocupes si se te escapa algo: el validador (paso 6) te dirá en qué línea está el fallo.

---

## 2. Antes de empezar: pon los partidos «en juego»

Abre `data/partidos.json`. Cada partido tiene muchos datos (la mayoría son para el directorio
«Partidos y programas», que se explica en `docs/COMO_ANADIR_PROGRAMAS.md`). Para el juego y los tests
importan estos:

```json
{
  "id": "pp",
  "nombre": "Partido Popular",
  "siglas": "PP",
  "color": "#1E73BE",
  "en_juego": false,
  "lideres": [],
  ...
}
```

Cuando tengas propuestas suficientes de un partido:

1. Cambia `"en_juego": false` por `"en_juego": true`. **Solo los partidos con `en_juego: true` aparecen en el
   juego, el test de afinidad y «¿Conoces a tu partido?».** (Que aparezca o no en el directorio lo decide otro
   dato, `en_directorio`.)
2. Comprueba que tiene un `color` en formato `#RRGGBB`. Solo se usa en las pantallas de resultados.
3. En `lideres`, escribe los nombres de sus líderes y candidatos, entre comillas y separados por comas:
   `"lideres": ["Nombre Apellido", "Otro Nombre"]`. No se muestran en ningún sitio: sirven para que el
   validador te avise si alguno aparece en una propuesta (y delataría al partido).

El enlace al programa oficial se pone en `programa.url_oficial` (ver `docs/COMO_ANADIR_PROGRAMAS.md`).
Si una propuesta no tiene su propio `url_fuente`, se usará ese enlace.

Para añadir un partido nuevo, sigue también `docs/COMO_ANADIR_PROGRAMAS.md`.

---

## 3. La plantilla de una propuesta

Copia esta plantilla cada vez que quieras añadir una propuesta:

```json
  {
    "id": "",
    "partido": "",
    "tema": "",
    "texto": "",
    "texto_anonimo": "",
    "pagina": 0,
    "url_fuente": ""
  }
```

Qué va en cada campo:

| Campo | Obligatorio | Qué poner |
| --- | --- | --- |
| `id` | Sí | Un identificador único. Te recomiendo `partido-tema-número`: `pp-vivienda-01`, `pp-vivienda-02`… |
| `partido` | Sí | El `id` del partido, tal como está en `partidos.json`: `psoe`, `pp`, `vox`, `frente-amplio`, `podemos`, `erc`… |
| `tema` | Sí | El `id` del tema, tal como está en `temas.json` (lista abajo). |
| `texto` | Sí | **El texto literal del programa**, copiado tal cual. |
| `texto_anonimo` | No | Solo si el texto literal da pistas del partido (ver paso 5). Si no hace falta, **borra la línea entera**. |
| `pagina` | Sí | El número de página del programa donde aparece, **sin comillas**. |
| `url_fuente` | Sí | El enlace al PDF oficial del programa. |
| `peso` | No | Por defecto 1. Pon `"peso": 2` solo si hay un motivo justificado para que cuente el doble en el test. |
| `nota` | No | Un apunte para ti (no se muestra en la web). Por ejemplo, de qué apartado lo sacaste. |
| `compartida_con` | No | Si otros partidos proponen casi lo mismo, la lista de sus ids. Ver «Propuestas compartidas o ambiguas» en el paso 5. |
| `ambigua` | No | `true` si la propuesta es tan genérica que no tiene sentido atribuirla a un partido. Ver el paso 5. |

Ids de los temas:

| id | Tema |
| --- | --- |
| `economia` | Economía y empleo |
| `vivienda` | Vivienda |
| `sanidad` | Sanidad |
| `educacion` | Educación |
| `inmigracion` | Inmigración |
| `seguridad-justicia` | Seguridad y justicia |
| `medio-ambiente-energia` | Medio ambiente y energía |
| `impuestos` | Impuestos |
| `pensiones` | Pensiones |
| `politica-territorial` | Política territorial |
| `exterior-defensa` | Política exterior y defensa |
| `igualdad-derechos` | Igualdad y derechos |
| `agricultura-rural` | Agricultura y medio rural |
| `cultura-ciencia` | Cultura y ciencia |

---

## 4. Ejemplo: añadir una propuesta paso a paso

> El ejemplo usa un texto **inventado** y un enlace falso, solo para que veas el formato.
> No corresponde a ningún programa real.

Imagina que en la página 47 del programa del partido con id `pp` lees:

> *Desde nuestro partido impulsaremos un plan para rehabilitar 100.000 viviendas al año.*

**Antes**, `data/propuestas.json` está vacío:

```json
[]
```

**Después** de añadir la primera propuesta:

```json
[
  {
    "id": "pp-vivienda-01",
    "partido": "pp",
    "tema": "vivienda",
    "texto": "Desde nuestro partido impulsaremos un plan para rehabilitar 100.000 viviendas al año.",
    "texto_anonimo": "Impulsar un plan para rehabilitar 100.000 viviendas al año.",
    "pagina": 47,
    "url_fuente": "https://www.ejemplo.es/programa.pdf"
  }
]
```

Para añadir **una segunda propuesta**, pon una coma después de la llave `}` de la primera y pega la plantilla:

```json
[
  {
    "id": "pp-vivienda-01",
    ...
    "url_fuente": "https://www.ejemplo.es/programa.pdf"
  },
  {
    "id": "psoe-vivienda-01",
    "partido": "psoe",
    "tema": "vivienda",
    "texto": "Texto literal de la propuesta…",
    "pagina": 32,
    "url_fuente": "https://www.ejemplo.es/otro-programa.pdf"
  }
]
```

Fíjate en que la segunda propuesta no lleva `texto_anonimo` porque su texto no da pistas.

---

## 5. Reglas para elegir y anonimizar propuestas

Son las que hacen que la web sea neutral. Merece la pena tenerlas delante:

**Al elegir propuestas**
- Copia siempre el **texto literal**, con su página y su enlace. No inventes, no mezcles frases de sitios distintos.
- Busca el **mismo número de propuestas por partido y por tema**. El validador te enseña una tabla para comprobarlo.
- No elijas solo las propuestas llamativas o sorprendentes, ni las que dejen en mejor o peor lugar a un partido.
  Elige propuestas **concretas y representativas** de lo que dice cada programa sobre ese tema.
- Evita frases vagas sin contenido («apostaremos por una sanidad de calidad»): no permiten opinar ni adivinar.

**Al escribir el `texto_anonimo`**
- Úsalo **solo** para quitar pistas: nombres del partido, siglas, líderes, «nuestro partido», «como hicimos cuando
  gobernamos», referencias a leyes o gobiernos propios, eslóganes conocidos…
- **No cambies el sentido ni el tono.** No añadas ni quites matices, no suavices ni endurezcas.
- Es buena práctica empezar con un verbo en infinitivo («Crear…», «Reducir…»), igual para todos los partidos.
- El texto literal se mostrará siempre al revelar el partido, así que cualquiera podrá compararlos.

### Propuestas compartidas o ambiguas

En el modo **«¿Conoces a tu partido?»** se pregunta «¿Es una propuesta de este partido?». Si la misma idea aparece en
varios programas, o es tan general que podría ser de cualquiera, la respuesta «correcta» sería injusta. Para evitarlo,
puedes marcar esas propuestas y ese modo **no las usará**. En el juego y en el test de afinidad siguen saliendo con
normalidad.

**Compartida:** otro partido (o varios) propone prácticamente lo mismo. Añade la línea `compartida_con` con los ids
de esos otros partidos (no hace falta poner el propio):

```json
  {
    "id": "pp-vivienda-03",
    "partido": "pp",
    "tema": "vivienda",
    "texto": "Texto literal…",
    "pagina": 51,
    "url_fuente": "https://...",
    "compartida_con": ["psoe", "frente-amplio"]
  }
```

**Ambigua:** el texto es tan genérico que no ayuda a reconocer a nadie («mejorar la sanidad rural»). Añade la línea
`"ambigua": true` (sin comillas en `true`):

```json
    "url_fuente": "https://...",
    "ambigua": true
  }
```

Recuerda la coma al final de la línea anterior. El validador te avisará si en `compartida_con` pones un partido que no
existe, o si marcas tantas propuestas de un partido que su test quedaría más corto o más fácil que el de los demás.

> Consejo: si una propuesta es ambigua, plantéate si merece estar en la web. Lo ideal son propuestas concretas.

---

## 6. Comprobar los datos con el validador

El validador revisa todo y te avisa de los problemas. Hay dos formas de usarlo:

### Opción A: sin instalar nada (en GitHub)

Cada vez que subas cambios a GitHub, el validador se ejecuta solo. En la página del repositorio, pestaña
**Actions**, verás un círculo verde (✔ todo bien) o una cruz roja (✖ hay errores). Pulsa sobre él y luego sobre
**validar** para leer el informe.

### Opción B: en tu ordenador

1. Instala **Node.js** (versión «LTS») desde <https://nodejs.org>. Solo hay que hacerlo una vez.
2. Abre una terminal en la carpeta del proyecto:
   - **Windows:** abre la carpeta en el Explorador, escribe `cmd` en la barra de direcciones y pulsa Intro.
   - **Mac:** clic derecho sobre la carpeta → *Servicios* → *Nuevo terminal en la carpeta*.
3. Escribe esto y pulsa Intro:

   ```bash
   npm run validar
   ```

El informe tiene tres partes:

- **✖ ERRORES** (en rojo): hay que corregirlos. Por ejemplo, un id repetido, un partido que no existe o una coma que falta.
  El mensaje dice en qué propuesta (o en qué línea) está el problema.
- **⚠ AVISOS** (en amarillo): no rompen nada, pero conviene revisarlos. Por ejemplo, un texto que menciona unas siglas,
  un partido con menos propuestas que otro o un tema con pocas propuestas.
  - Ojo: el validador busca palabras como «Podemos» o «Sumar». Si el aviso salta porque la palabra se usa como verbo
    («Podemos mejorar…»), decide tú si delata al partido; a veces basta con escribir un `texto_anonimo`.
- **Tabla de propuestas por tema y partido**: para ver de un vistazo si hay equilibrio.

### Ver la web en tu ordenador antes de publicar

```bash
npm run dev
```

Abre en el navegador la dirección que aparece (normalmente <http://localhost:5173>). Para pararlo, pulsa `Ctrl + C`
en la terminal.

---

## 7. Publicar los cambios

### Opción A: directamente en la web de GitHub (la más sencilla)

1. Entra en el repositorio en GitHub y abre `data/propuestas.json`.
2. Pulsa el icono del lápiz (✏️ *Edit this file*).
3. Pega tus propuestas y pulsa **Commit changes…**. Escribe una frase que explique el cambio
   (por ejemplo, «Añade 10 propuestas de vivienda») y confirma.
4. Mira la pestaña **Actions** para ver si el validador da el visto bueno.

### Opción B: desde tu ordenador con git

En la terminal, dentro de la carpeta del proyecto, escribe estas órdenes una a una:

```bash
npm run validar
```

```bash
git add data/
```

```bash
git commit -m "Añade propuestas de vivienda"
```

```bash
git push
```

- `git add` prepara los archivos que has cambiado.
- `git commit` guarda una «foto» de los cambios con un mensaje que los describe.
- `git push` los sube a GitHub. Si la web está conectada a Vercel, Netlify o GitHub Pages, se actualiza sola en uno o dos minutos.

> Si `git push` te pide usuario y contraseña, GitHub ya no acepta la contraseña normal: usa la aplicación
> **GitHub Desktop**, que hace lo mismo con botones (*Commit* y *Push origin*), o la opción A.

---

## 8. Ajustes (`data/config.json`)

| Ajuste | Qué hace | Valor inicial |
| --- | --- | --- |
| `juego.propuestas_por_ronda` | Propuestas por partida del juego | 10 |
| `juego.opciones_por_pregunta` | Partidos entre los que elegir | 4 |
| `test.duraciones` | Duraciones del test que se ofrecen (`null` = todas las propuestas) | 20, 40 y todas |
| `test.minimo_respuestas_fiable` | Por debajo de este nº de respuestas de un partido, se avisa de que el resultado es poco fiable | 5 |
| `test.peso_tema_importante` / `peso_tema_poco_importante` | Cuánto cuentan los temas marcados como importantes o poco importantes | 2 y 0,5 |
| `validador.minimo_por_tema_y_partido` | El validador avisa si un partido tiene menos propuestas que esto en un tema | 2 |
| `validador.diferencia_maxima_entre_partidos` | Diferencia de nº de propuestas entre partidos que se tolera sin avisar | 0 |
| `validador.expresiones_sospechosas` | Expresiones que delatan el origen («nuestro partido»…). Puedes añadir más | — |
| `conoces.preguntas` | Números de preguntas que se ofrecen en «¿Conoces a tu partido?» | 10, 15 y 20 |
| `conoces.proporcion_partido` | Parte de las preguntas que son del partido elegido (0,5 = la mitad) | 0,5 |
| `conoces.minimo_preguntas` | Por debajo de este número de preguntas no se hace el test y se muestra un aviso | 6 |
| `validador.conoces_minimo_por_partido` | El validador avisa si un partido tiene menos propuestas válidas para ese modo | 10 |
| `validador.conoces_minimo_por_tema` | Ídem, por tema | 2 |

---

## 9. Problemas frecuentes

- **«no es un JSON válido cerca de la línea X»**: casi siempre es una coma. Mira la línea anterior: ¿falta una coma entre
  dos propuestas? ¿Sobra una después de la última?
- **No aparecen mis propuestas en la web**: ¿está el partido con `"en_juego": true`? ¿Has esperado a que se publique el cambio?
  Prueba a recargar la página con `Ctrl + F5` (o `Cmd + Shift + R` en Mac).
- **Sigue saliendo el banner de demostración**: alguna propuesta tiene `"ejemplo": true`, o `propuestas.json` sigue vacío.
- **Quiero cambiar el texto de las páginas** (Inicio, Metodología, Sobre el proyecto): están en `index.html`, dentro de
  los bloques `<template>`. Puedes cambiar las frases con cuidado de no borrar las etiquetas `< >`.
