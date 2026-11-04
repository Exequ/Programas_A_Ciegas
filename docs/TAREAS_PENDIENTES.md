# Tareas pendientes

Lista de seguimiento del proyecto. Para marcar una tarea como hecha, cambia `[ ]` por `[x]`
(se puede hacer directamente desde GitHub con el lápiz ✏️). Claude la actualiza también cuando
termina algo.

**Quién:** 🙋 = tú · 🤖 = Claude · 🤝 = juntos

---

## 📅 Antes y después de la proclamación de candidaturas (3 de noviembre)

- [x] 🤝 **3-N: revisar `data/partidos.json` con la proclamación oficial** (BOE-A-2026-23103, 3-11-2026).
  Las 25 candidaturas del directorio están proclamadas; se quitó `verificar`, se anotó en cuántas circunscripciones
  concurre cada una y se completaron las coaliciones (Unidad del Pueblo Canario, AraMés-Front Ampli y Compromís).
- [ ] 🤝 **12-N: comprobar si algún recurso ha cambiado las candidaturas** (recursos ante las juntas el 4 y 5 de
  noviembre y ante el Tribunal Constitucional hasta el 12). Hay un recordatorio programado ese día a las 18:00.
- [x] 🙋 **Acuerdos de Frente Amplio por comunidad** (4-11-2026): Más Madrid confirmado (Emilio Delgado encabeza Madrid),
  Ara Més = Més per Mallorca + Més per Menorca + Ara Eivissa, y socios regionales añadidos (Iniciativa del Pueblo
  Andaluz, Verdes Equo, Partido Verde, Recortes Cero, Izquierda Asturiana, Somos Asturies y Batzarre).
- [ ] 🙋 **AraMés-Front Ampli: ¿Esquerra Unida o Esquerra Republicana de les Illes Balears?** Según el responsable, la
  coalición incluye a ERC de las Islas Baleares, pero sus siglas en el BOE son «ARAMÉS-EU-MS» (EU = Esquerra Unida).
  De momento los datos siguen el BOE (IU); confirmar cuál es correcto.
- [x] 🙋 **Otras candidaturas proclamadas** (4-11-2026): se añade solo Escaños en Blanco (13 circunscripciones). El resto
  no se añade (criterio del responsable: no hace falta incluir candidaturas con una estimación de 0 escaños).
- [ ] 🙋 **Escaños en Blanco:** confirmar su color (ahora un gris provisional, `#8C8C8C`) y su web oficial (no se encontró).
- [x] 🙋 **Revisar las webs oficiales** que propuso Claude. Comprobadas el 29-10-2026 (las 18 son las oficiales).
- [x] 🤖 **Webs que faltaban** (4-11-2026): Frente Amplio, Democracia21, Falange, Iustitia Europa, Unidad del Pueblo
  Canario, AraMés-Front Ampli y NEX, más los integrantes Democracia 21, UCIN y NC-BC. Claude comprobó que cada dirección
  responde y que su título corresponde al partido; revisadas también por el responsable.
- [x] 🙋 **Colores de las 25 candidaturas** (29-10-2026): 14 copiados de politicaelectoral.com y 11 aportados
  por el responsable. Revisados y dados por buenos por el responsable (4-11-2026).
- [x] 🤖 `candidato`: cabezas de lista según el BOE (circunscripción con más escaños de cada candidatura), también
  añadidos a `lideres`.
- [x] 🤖 Formas cortas de los nombres de los cabezas de lista en `lideres` (y Ada Colau en Frente Amplio).
- [x] 🤖 Otros líderes conocidos en `lideres` (Puigdemont, Junqueras, Otegi, Belarra, Yolanda Díaz, Clavijo, Baldoví…),
  asignados a su partido o al integrante de la coalición al que pertenecen. Si surge algún nombre nuevo durante la
  campaña, se puede añadir en el mismo campo.

## 📄 Cuando cada partido publique su programa

- [ ] 🙋 En su ficha de `partidos.json`: `programa.estado: "publicado"`, `url_oficial`, `fecha_publicacion`,
  `fecha_comprobacion` y `paginas`. Ver `docs/COMO_ANADIR_PROGRAMAS.md`.
- [ ] 🙋 (Opcional) Guardar una copia del PDF en `programas/` con su `sha256`.
- [ ] 🤝 Elaborar el resumen en `data/resumenes/{id}.json`, contrastarlo con el programa y marcar `revisado: true`.
- [ ] 🤝 Elegir propuestas para `data/propuestas.json` (mismo número por partido y tema), marcar las compartidas
  o ambiguas y poner `en_juego: true` en los partidos con propuestas suficientes.
- [ ] 🙋 Ejecutar el validador (o mirar la pestaña **Actions** de GitHub) y corregir errores y avisos.

## 🚀 Antes del inicio de la campaña (13 de noviembre)

- [x] 🙋 Revisar los textos de Inicio, Metodología y Sobre el proyecto (`index.html`).
- [ ] 🙋 Añadir en «Sobre el proyecto» una forma de contacto para avisar de errores.
- [ ] 🤝 **La web no funciona en el móvil del responsable** (4-11-2026): averiguar qué falla (qué se ve, qué móvil y
  navegador, qué dirección se usa) y corregirlo. Después, volver a probar juego, test, «¿Conoces a tu partido?» y directorio.
- [ ] 🙋 Comprobar que el banner de «Modo demostración» ha desaparecido.

## 🛠️ Desarrollo: sección «Partidos y programas»

- [x] 🤖 Actualizar `CLAUDE.md` con la sección y sus reglas.
- [x] 🤖 (a) Modelo de datos y lista inicial de partidos.
- [x] 🤖 (b) Directorio y ficha de partido.
- [x] 🤖 (c) Resúmenes y estados del programa.
- [x] 🤖 (d) Validador y `docs/COMO_ANADIR_PROGRAMAS.md`.
- [x] 🤖 (e) Accesibilidad y pruebas en móvil.

## ✅ Hecho

- [x] Juego «Adivina el partido», test de afinidad, validador y guía para añadir propuestas.
- [x] Publicación en GitHub Pages.
- [x] Modo «¿Conoces a tu partido?».
