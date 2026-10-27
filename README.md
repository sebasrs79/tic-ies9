# Profesorado TIC — IES N.º 9 «Juana Azurduy»

Landing page **estática**, interactiva y preparada para GitHub Pages. Prioriza celulares y no utiliza panel administrativo, base de datos, frameworks ni servicios de pago.

## Publicación en GitHub Pages

1. Crear un repositorio de GitHub (por ejemplo, `profesorado-tic`).
2. Subir **todos los archivos de esta carpeta** manteniendo `index.html`, `styles.css`, `script.js`, `assets/` y `documentos/` en las mismas posiciones.
3. En GitHub, abrir **Settings → Pages**, elegir **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guardar.
4. GitHub mostrará la URL de publicación, habitualmente `https://USUARIO.github.io/profesorado-tic/`.
5. Abrir desde un celular y probar especialmente los filtros, la búsqueda y las correlatividades.

No es necesario instalar npm, Node.js, Python ni configurar servidores para usar el sitio. Se puede previsualizar abriendo `index.html` directamente. El plan curricular se carga desde `assets/materias.js` y por eso también funciona desde `file://`.

## Ediciones habituales

- **Textos, datos de contacto y secciones**: editar `index.html`.
- **Colores, tamaños, animaciones y adaptación móvil**: editar `styles.css`.
- **Interacciones**: editar `script.js`.
- **Materias y correlatividades**: `assets/materias.js` contiene los 31 registros extraídos del HTML original que compartiste. Se incluye además `assets/materias.json` como respaldo legible. Los requisitos `cA` (aprobadas para cursar), `cR` (regulares para cursar), y `rA` (aprobadas para rendir/promocionar) conservan los datos originales. Antes de modificar el plan oficial, verificar las normas institucionales vigentes.
- **Imágenes**: están optimizadas en `assets/`; los originales no se modificaron.
- **Resolución curricular**: `documentos/diseno-curricular-tic-res-13962-E.pdf`.

## Canal de WhatsApp y QR (pendientes)

El canal todavía no está creado: se dejó explícitamente como **«Próximamente»**, sin enlaces inventados ni códigos QR que no lleven a un destino real. Una vez creado, se puede reemplazar ese aviso en `index.html` por un enlace al canal. El QR puede generarse entonces para la URL definitiva publicada o para una URL del portal que redirija al canal. No se requiere base de datos.

## Diseño y accesibilidad

- Responsive mobile-first: menús táctiles, tarjetas de correlatividades, pestañas por año, búsqueda sin dependencias y galería con pantalla completa.
- Animaciones suaves usando CSS e IntersectionObserver, con soporte para `prefers-reduced-motion`.
- Imágenes WebP comprimidas y carga diferida fuera de la primera pantalla.
- El contenido académico deriva de la **Resolución N.º 13962-E/2019** (duración, título, horas y unidades curriculares) y de la planilla HTML original (correlatividades). La lista de documentación de inscripción proviene del tríptico entregado, confirmado por el solicitante como vigente.
- Los perfiles de futuros estudiantes son ejemplos orientativos, no requisitos de admisión.

## Consideraciones

Los horarios se muestran tal como fueron proporcionados: **13:30–18:15**, sin inventar días de la semana. La dirección indicada es **Av. Dr. Carlos Undiano y Silvester (Barrio Bernacchi), San Pedro de Jujuy**, y el teléfono **(03888) 423336**.

La optimización móvil fue implementada a nivel de estructura y estilos. Para validar el desempeño de publicación con métricas reales, usar Lighthouse/PageSpeed Insights sobre la URL publicada y revisar la experiencia en Android/iOS.

**Vista previa de enlaces sociales:** cuando conozcas la dirección pública definitiva, reemplazá `og:image` en `index.html` por la URL absoluta de la imagen para que las aplicaciones de mensajería muestren correctamente la miniatura.

## Ajustes y pruebas móviles (27/10/2026)

Se mantuvieron **sin cambios** las secciones, contenidos, logotipos y estética de la versión inicial. Se hicieron únicamente mejoras específicas de usabilidad:

- Los **cinco filtros** de la planilla (1.º a 4.º y Todas) están siempre a la vista en celulares, sin desplazamiento horizontal oculto.
- El buscador utiliza un tamaño que evita el zoom automático de Safari al enfocarlo.
- Las tarjetas y correlatividades tienen textos ajustables y botones de al menos 44 píxeles en dispositivos táctiles; las correlativas aprovechan todo el ancho del celular.
- Al seguir una correlativa a otra materia, aparece un botón para **volver a la materia de origen**.
- El visor de imágenes permite avanzar y retroceder con gestos horizontales; también conserva sus botones de navegación.
- Se eliminó el desbordamiento horizontal de la banda animada.
- Se añadieron ajustes para pantallas plegables muy estrechas y controles táctiles de contacto y navegación.

**Pruebas automáticas de diseño:** 280, 320, 360, 375, 390, 430, 570, 768, 1024 y 1440 px de ancho; sin errores de JavaScript ni desbordamiento horizontal detectados. **Pruebas funcionales:** 64 comprobaciones superadas, incluyendo filtros por año, búsqueda, consulta y navegación de correlativas, galería, menú y lista de inscripción. Se efectuaron con Chromium de escritorio emulando tamaños y entrada táctil; **no sustituyen la validación en teléfonos físicos Android/iOS** ni una auditoría Lighthouse sobre el sitio publicado.
