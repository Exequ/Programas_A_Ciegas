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
5. **Diseño neutro:** sin colores corporativos de partidos salvo en la pantalla de resultados.
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

## Tecnología

- Web estática (HTML, CSS, JS). Sin backend ni base de datos. Desplegable en Vercel,
  Netlify o GitHub Pages.
- Mobile first, responsive, accesible (contraste AA, teclado, ARIA), en español.
- El código solo lee datos de `/data/*.json`.
- Mínimas dependencias.

## Datos (`/data`)

- `partidos.json`: `id`, `nombre`, `siglas`, `color`, `url_programa`, `activo` (bool).
- `temas.json`: `id`, `nombre`.
- `propuestas.json`: `id` (único), `partido`, `tema`, `texto` (literal), `texto_anonimo`
  (opcional, lo que se muestra), `pagina`, `url_fuente`, `peso` (opcional, por defecto 1).
- `propuestas.ejemplo.json`: ~12 propuestas FICTICIAS con `ejemplo: true`.

## Herramientas

- `npm run validar`: revisa campos obligatorios, ids duplicados, referencias a partidos/temas
  inexistentes, desequilibrios, nombres/siglas/líderes en textos anónimos, temas con pocas
  propuestas por partido (umbral configurable) y propuestas de ejemplo todavía presentes.
- `/docs/COMO_ANADIR_PROPUESTAS.md`: guía no técnica en español.

## Forma de trabajar

- Construir por fases: (a) estructura y datos, (b) juego, (c) test, (d) validador y docs,
  (e) pulido y accesibilidad.
- Commits pequeños con mensajes claros en español.
- Explicar en lenguaje sencillo cualquier paso que deba hacer el responsable.
