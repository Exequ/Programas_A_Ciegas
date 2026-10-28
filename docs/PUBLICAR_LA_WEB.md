# Cómo publicar la web

La web no necesita servidor ni base de datos: son archivos que cualquier alojamiento gratuito puede servir.
Basta con hacerlo **una vez**; después, cada cambio que subas a GitHub se publica solo.

> Antes de nada: el trabajo está en una rama del repositorio. Para publicar, esos cambios tienen que estar
> en la rama principal (`main`). En GitHub, abre el *pull request* de la rama y pulsa **Merge**.

## Opción 1: GitHub Pages (recomendada, el código ya está en GitHub)

1. Entra en el repositorio en GitHub y pulsa **Settings** (Configuración).
2. En el menú de la izquierda, pulsa **Pages**.
3. En *Build and deployment → Source*, elige **Deploy from a branch**.
4. En *Branch*, elige **main** y la carpeta **/ (root)**. Pulsa **Save**.
5. Espera uno o dos minutos y recarga la página: arriba aparecerá la dirección de tu web,
   del tipo `https://tu-usuario.github.io/Programas_A_Ciegas/`.

> GitHub Pages es gratuito para repositorios públicos. Si el repositorio es privado, necesitas una cuenta de pago
> o usar la opción 2.

## Opción 2: Vercel o Netlify

1. Crea una cuenta gratuita en <https://vercel.com> o <https://netlify.com> entrando con tu cuenta de GitHub.
2. Pulsa **Add New → Project** (Vercel) o **Add new site → Import an existing project** (Netlify).
3. Elige el repositorio `Programas_A_Ciegas`.
4. Deja **vacía** la orden de compilación (*Build command*) y pon `.` (un punto) como carpeta de publicación
   (*Output / Publish directory*). En Vercel, elige *Framework Preset: Other*.
5. Pulsa **Deploy**. En un minuto te dará una dirección del tipo `https://programas-a-ciegas.vercel.app`.

## Dominio propio (opcional)

Si compras un dominio (por ejemplo `programasaciegas.es`), las tres opciones permiten conectarlo desde su
configuración (*Custom domain*). Siguen sus instrucciones: normalmente consiste en copiar unos datos en la web
donde compraste el dominio.

## Comprobar antes de publicar propuestas reales

- `npm run validar` sin errores (o la marca verde en la pestaña **Actions** de GitHub).
- El banner de «Modo demostración» ha desaparecido.
- Has probado una partida y un test completos.
