# Programas A Ciegas

Web estática para que la gente conozca lo que proponen realmente los partidos en las
elecciones generales de España del **29 de noviembre de 2026** (campaña: 13–27 de noviembre),
viendo las propuestas **sin saber de quién son**.

Los programas definitivos aún no están publicados. La web se construye ahora y queda lista
para que el responsable del proyecto (persona sin experiencia técnica) solo tenga que añadir
propuestas en `/data/propuestas.json`, sin tocar el código.

## Reglas de neutralidad (OBLIGATORIAS, prevalecen sobre cualquier otra consideración)

1. **Nunca inventar propuestas reales.** Solo texto literal o resumen fiel de los programas
   oficiales, siempre con partido, página y URL del PDF oficial.
2. **No reformular con sesgo.** `texto` es el literal del programa; `texto_anonimo` (opcional)
   solo elimina pistas sobre el origen, sin cambiar el sentido ni el tono.
3. **Anonimato:** lo que se muestra no puede contener nombres de partidos, siglas, líderes
   ni referencias que delaten el origen. El partido solo se revela tras responder (juego) o
   al final (test).
4. **Equilibrio:** mismo número de propuestas por partido y por tema siempre que sea posible.
   No elegir solo las propuestas "sorprendentes".
5. **Diseño neutro:** sin colores corporativos de partidos salvo en la pantalla de resultados (y, en el
   directorio, un marco fino con el color de cada candidatura solo si todas tienen color).
   Tono divulgativo, nunca partidista. Sin adjetivos valorativos sobre las propuestas.
6. **Privacidad:** sin publicidad, sin cookies de seguimiento, sin analítica, sin registro,
   sin enviar respuestas a ningún servidor. Todo ocurre en el navegador.
7. **Datos de ejemplo:** las propuestas ficticias llevan `ejemplo: true` y mientras existan se
   muestra un banner visible. Nunca se presentan como reales.
8. El test de afinidad **no es una recomendación de voto ni un sondeo**; debe decirse de forma visible.

## Modos

### Juego "Adivina el partido"
- Propuesta anónima + su tema + 4 opciones de partido (1 correcta + 3 al azar entre los demás).
- Rondas de 10 propuestas al azar, sin repetir.
- Tras responder: partido correcto, texto literal, página y enlace al PDF.
- Final: puntuación, aciertos por tema, propuestas falladas ("las que más sorprendieron"),
  mensaje invitando a leer los programas.
- Filtros: por tema y por subconjunto de partidos.

### Test de afinidad
- Propuestas una a una, sin partido. Respuestas: Muy a favor (+2), A favor (+1),
  Neutral (0), En contra (−1), Muy en contra (−2), No tengo criterio suficiente (se salta).
- Opcional: marcar temas como "importante" (peso 2) o "poco importante".
- Por partido, solo propuestas respondidas (no saltadas) de ese partido:
  `afinidad % = ((Σ valor·peso / (2 · Σ peso)) + 1) / 2 · 100`
- Final: ranking con %, desglose por tema, propuestas que más acercaron/alejaron de cada
  partido, nº de propuestas respondidas por partido y aviso si son pocas.

### Modo "¿Conoces a tu partido?"
- El usuario elige un partido activo y responde, para cada propuesta anónima (con su tema):
  "¿Es una propuesta de [partido]?" → Sí / No / No lo sé. Tras cada respuesta se revela el partido,
  el texto literal, la página y el PDF.
- Selección de partido: todos con el mismo formato, orden aleatorio o alfabético (nunca por tamaño
  o escaños), sin destacar ninguno. Opciones: 10, 15 o 20 preguntas y filtro opcional por temas.
- Selección de propuestas: ~50 % del partido elegido y ~50 % de otros (proporción configurable),
  en orden aleatorio, sin repetir. Las de otros partidos se reparten por igual entre los demás
  partidos activos y son de temas en los que también hay propuestas del partido elegido (el tema
  no debe delatar la respuesta). Temas equilibrados. Si no hay propuestas suficientes, se reduce
  el número de preguntas o se muestra un mensaje claro.
- Se excluyen las propuestas con `compartida_con: ["id_partido", ...]` o `ambigua: true`.
- Resultado: aciertos sobre el total ("No lo sé" aparte, sin penalizar más los fallos), bloques
  "Propuestas de [partido] que no esperabas", "Propuestas que creías de [partido] y no lo son"
  (indicando su partido) y "Lo que sí sabías", desglose por temas, invitación a leer el programa
  oficial y aviso de que no es una recomendación de voto. Tono amable, nunca humillante.
- Neutralidad: misma lógica, diseño y tono para cualquier partido; ninguna rama del código trata a
  un partido de forma especial. Colores de partido solo al revelar o en resultados. No se guarda ni
  envía qué partido se elige ni las respuestas. Sin rankings ni comparativas entre partidos sobre el
  "nivel de conocimiento" de sus votantes.

### Sección "Partidos y programas"
- Directorio (`#/partidos`) de los partidos que concurren a las generales del 29-N-2026 y ficha de cada
  uno (`#/partidos/:id`): datos básicos, estado del programa, enlace al PDF oficial, copia guardada
  opcional (con fecha y aviso de que la versión oficial es la del partido) y resumen por temas.
- Qué partidos aparecen lo decide un dato (`en_directorio: true`), nunca el código. `en_directorio` y
  `en_juego` son independientes. Lista provisional hasta la proclamación del 3 de noviembre:
  los no confirmados llevan `verificar: true`. Las coaliciones solo para el Senado no tienen ficha.
- Todas las tarjetas y fichas con el mismo formato: sin logos ni símbolos, solo nombre y siglas. Las tarjetas
  pueden llevar un marco fino con el color del partido, con la regla «todos o ninguno»: solo si todas las
  candidaturas del directorio tienen `color` válido.
  Orden alfabético o aleatorio, nunca por tamaño o escaños. Filtros por ámbito y buscador.
- Programa "pendiente": mensaje neutro "Programa aún no publicado" y, si existe, enlace a la web oficial.
- Coaliciones: mostrar sus integrantes; en la ficha de un integrante, indicar la coalición.
- Las fichas solo se enlazan desde el juego, el test y "¿Conoces a tu partido?" en sus pantallas de
  resultados (nunca durante las preguntas).
- Resúmenes (`/data/resumenes/{id}.json`): cada punto es una paráfrasis fiel y verificable con su
  página; sin adjetivos valorativos ni interpretaciones. Mismo formato, mismos temas y extensión
  similar para todos; si un tema no aparece en el programa: "No aborda este tema en su programa".
  Aviso visible: "Resumen elaborado por este proyecto; no sustituye al programa oficial", con enlace
  al PDF. Un resumen ficticio de prueba lleva `ejemplo: true` y banner; nunca se presenta como real.
- No se registra qué partidos se consultan.

## Tecnología

- Web estática (HTML, CSS, JS). Sin backend ni base de datos. Desplegable en Vercel,
  Netlify o GitHub Pages.
- Mobile first, responsive, accesible (contraste AA, teclado, ARIA), en español.
- El código solo lee datos de `/data/*.json`.
- Mínimas dependencias.

## Datos (`/data`)

- `partidos.json`: `id`, `nombre`, `siglas`, `color`, `en_juego` (bool: participa en juego y tests) y
  `programa.url_oficial` (enlace al PDF). Los antiguos `activo` y `url_programa` ya no se usan.
- `temas.json`: `id`, `nombre`.
- `propuestas.json`: `id` (único), `partido`, `tema`, `texto` (literal), `texto_anonimo`
  (opcional, lo que se muestra), `pagina`, `url_fuente`, `peso` (opcional, por defecto 1).
- `propuestas.json` admite además `compartida_con` (lista de ids de partido) y `ambigua` (bool):
  esas propuestas no se usan en "¿Conoces a tu partido?".
- `partidos.json` incluye además los datos del directorio: `ambito`, `territorio`, `coalicion_de`,
  `candidato`, `web_oficial`, `en_directorio`, `en_juego`, `verificar`, `programa` (estado, URLs,
  copia local con `sha256`, fechas) y `resumen` (ruta al archivo de resumen).
- `resumenes/{id}.json`: resumen por temas de cada programa.
- `config.json`: ajustes de juego, test, "¿Conoces a tu partido?", directorio y validador.
- `propuestas.ejemplo.json`: propuestas FICTICIAS con `ejemplo: true`.

## Herramientas

- `npm run validar`: revisa campos obligatorios, ids duplicados, referencias a partidos/temas
  inexistentes, desequilibrios, nombres/siglas/líderes en textos anónimos, temas con pocas
  propuestas por partido (umbral configurable) y propuestas de ejemplo todavía presentes.
  También, para "¿Conoces a tu partido?": partidos con pocas propuestas válidas, `compartida_con`
  o `ambigua` mal definidos y desequilibrios que harían el test más fácil o difícil según el partido.
  Y para el directorio: partidos sin web oficial o por verificar, programas publicados sin URL (o que no
  responden, comprobación opcional), copias locales cuyo `sha256` no coincide, resúmenes sin página,
  con extensión muy desigual o con palabras valorativas (lista configurable), coaliciones con
  integrantes inexistentes y partidos con `en_juego: true` sin propuestas suficientes.
- `/docs/COMO_ANADIR_PROPUESTAS.md` y `/docs/COMO_ANADIR_PROGRAMAS.md`: guías no técnicas en español.

## Forma de trabajar

- Construir por fases: (a) estructura y datos, (b) juego, (c) test, (d) validador y docs,
  (e) pulido y accesibilidad.
- Commits pequeños con mensajes claros en español.
- Explicar en lenguaje sencillo cualquier paso que deba hacer el responsable.
