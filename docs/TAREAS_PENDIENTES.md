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
- [ ] 🙋 Confirmar que **Más Madrid** sigue en Frente Amplio (el BOE no lo nombra en ninguna lista) y qué formaciones
  agrupa **Ara Més** (integrante de AraMés-Front Ampli).
- [ ] 🙋 Decidir si se añaden al directorio otras candidaturas proclamadas que no están: Escaños en Blanco
  (13 circunscripciones), Partido Autónomos (4), Alhora (4), PREPAL (3), Juntos por Extremadura, Liberación Canaria,
  Drago Canarias, Feministas al Congreso (2 cada una), Geroa Bai, Teruel Existe, Soria ¡Ya! y otras de una sola provincia.
- [x] 🙋 **Revisar las webs oficiales** que propuso Claude. Comprobadas el 29-10-2026 (las 18 son las oficiales).
- [ ] 🙋 **Rellenar las webs que no se encontraron:** Frente Amplio, Democracia para el Siglo 21 (y Democracia 21,
  UCIN), Falange, Iustitia Europa, Unidad del Pueblo Canario, Ara Més-Front Ampli y Nuevo Extremeñismo.
- [x] 🙋 **Colores de las 25 candidaturas** (29-10-2026): 14 copiados de politicaelectoral.com y 11 aportados
  por el responsable. Varios son estimados (lo indica la `nota` de cada partido): conviene confirmarlos con
  la web o el manual de identidad de cada partido cuando sea posible.
- [x] 🤖 `candidato`: cabezas de lista según el BOE (circunscripción con más escaños de cada candidatura), también
  añadidos a `lideres`.
- [x] 🤖 Formas cortas de los nombres de los cabezas de lista en `lideres` (y Ada Colau en Frente Amplio).
- [ ] 🙋 (Opcional) Añadir a `lideres` otros líderes conocidos que no encabezan lista (presidentes o secretarios
  generales de cada partido), para que el validador también los detecte.

## 📄 Cuando cada partido publique su programa

- [ ] 🙋 En su ficha de `partidos.json`: `programa.estado: "publicado"`, `url_oficial`, `fecha_publicacion`,
  `fecha_comprobacion` y `paginas`. Ver `docs/COMO_ANADIR_PROGRAMAS.md`.
- [ ] 🙋 (Opcional) Guardar una copia del PDF en `programas/` con su `sha256`.
- [ ] 🤝 Elaborar el resumen en `data/resumenes/{id}.json`, contrastarlo con el programa y marcar `revisado: true`.
- [ ] 🤝 Elegir propuestas para `data/propuestas.json` (mismo número por partido y tema), marcar las compartidas
  o ambiguas y poner `en_juego: true` en los partidos con propuestas suficientes.
- [ ] 🙋 Ejecutar el validador (o mirar la pestaña **Actions** de GitHub) y corregir errores y avisos.

## 🚀 Antes del inicio de la campaña (13 de noviembre)

- [ ] 🙋 Revisar los textos de Inicio, Metodología y Sobre el proyecto (`index.html`).
- [ ] 🙋 Añadir en «Sobre el proyecto» una forma de contacto para avisar de errores.
- [ ] 🙋 Probar la web en un móvil real (juego, test, «¿Conoces a tu partido?» y directorio).
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
