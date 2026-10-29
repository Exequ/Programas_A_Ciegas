# Tareas pendientes

Lista de seguimiento del proyecto. Para marcar una tarea como hecha, cambia `[ ]` por `[x]`
(se puede hacer directamente desde GitHub con el lápiz ✏️). Claude la actualiza también cuando
termina algo.

**Quién:** 🙋 = tú · 🤖 = Claude · 🤝 = juntos

---

## 📅 Antes y después de la proclamación de candidaturas (3 de noviembre)

- [ ] 🤝 **3-N: revisar `data/partidos.json` con la proclamación oficial.** Hay un recordatorio programado
  para ese día a las 18:00 (hora peninsular).
  - Confirmar qué partidos concurren y dónde. Sin confirmar todavía: Junts, BNG y Coalición Canaria.
  - Ajustar `en_directorio` y quitar `verificar: true` a los partidos confirmados.
  - Rellenar `coalicion_de` de **Unidad del Pueblo Canario**, **Ara Més-Front Ampli** y **Compromís-Front Valencià**
    (cada integrante necesita su propia entrada en `partidos.json`).
  - Confirmar si **CHA** forma parte de Frente Amplio y en qué circunscripciones va **Podemos** con lista propia.
  - Confirmar el nombre exacto de **Iustitia Europa** (en la lista inicial figuraba como «Iusticia») y qué
    formación falangista concurre.
- [x] 🙋 **Revisar las webs oficiales** que propuso Claude. Comprobadas el 29-10-2026 (las 18 son las oficiales).
- [ ] 🙋 **Rellenar las webs que no se encontraron:** Frente Amplio, Democracia para el Siglo 21 (y Democracia 21,
  UCIN), Falange, Iustitia Europa, Unidad del Pueblo Canario, Ara Més-Front Ampli y Nuevo Extremeñismo.
- [ ] 🙋 **Rellenar el `color` oficial** (`#RRGGBB`) de las 11 candidaturas que aún no lo tienen: Frente Obrero, PCTE,
  Falange, Partido Humanista, Iustitia Europa, Por un Mundo Más Justo, Unidad del Pueblo Canario, Compromís,
  Ara Més-Front Ampli, Adelante Andalucía y NEX. El marco de color del directorio aparecerá cuando estén todas.
  Las otras 14 se copiaron de politicaelectoral.com el 29-10-2026 (anotado en cada `nota`). Ver `docs/COMO_ANADIR_PROGRAMAS.md`.
- [ ] 🙋 Decidir si se añaden más partidos de los 61 que se presentan (el criterio es `en_directorio: true`).
- [ ] 🙋 Rellenar `candidato` (cabeza de lista) con fuente oficial, y `lideres` para que el validador detecte
  nombres en los textos anónimos.

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
