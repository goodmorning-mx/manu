# Widget de Shopify para Manu

Esta carpeta contiene una extensión de tema de Shopify con dos elementos
visuales: un bloque de reseñas de producto y una barra de avance para envío
gratis en el carrito desplegable. La puntuación y cantidad de reseñas se leen de
los metafields estándar `reviews.rating` y `reviews.rating_count`, que Judge.me
puede mantener actualizados. La barra solo informa cuánto falta para alcanzar
el mínimo configurado. No consulta tarifas ni cambia el carrito, checkout o
backend de Manu.

## Estado de la app

La app `Manu Social Proof` está registrada en el Dev Dashboard de
`goodmorning.mx`, vinculada a este proyecto y seleccionada para la tienda de
desarrollo `tienda-dev-pruebas.myshopify.com`. Sus permisos de API están vacíos.
La extensión compila con Shopify CLI. La versión
`manu-social-proof-3` se creó con `--no-release` y no se publicó a comercios.
Shopify CLI mantiene el preview local conectado a la tienda de desarrollo. La
versión está disponible en el
[Dev Dashboard](https://dev.shopify.com/dashboard/246659644/apps/446459576321/versions/1235058196481).

## Probar en la tienda de desarrollo

El preview del CLI está activo para el tema de desarrollo
`App Ext. Host (17bbe5-not-pc)`, ID `186859847757`. La plantilla de producto usa
JSON y su sección principal admite bloques `@app`. El bloque **Social proof**
ya está añadido y guardado una vez, debajo del título del producto. La barra debe activarse en App embeds y el bloque movible se añade desde Encabezado. Para conservar el preview
local, deja activo el proceso `shopify app dev`.

Abre el [editor del tema de desarrollo](https://tienda-dev-pruebas.myshopify.com/admin/themes/186859847757/editor?template=product) para ajustar la posición o los colores. La vista previa de la tienda usa
<https://tienda-dev-pruebas.myshopify.com/?preview_theme_id=186859847757>.

Para validar la puntuación y el conteo, revisa un producto que tenga los
metafields de reseñas de Shopify (`reviews.rating` y `reviews.rating_count`).
La vista previa del producto de muestra responde HTTP 200 y carga el bloque y
su CSS. Ese producto no tiene datos de reseñas, así que ahora muestra el
encabezado y omite la puntuación y el conteo. Si esos datos faltan, el widget
los omite; agrega solo reseñas auténticas con permiso para mostrarlas.

Después de validar el preview, la app debe distribuirse a la tienda real de
Manu (por ejemplo, mediante distribución personalizada) para que él la instale.
Una vez instalada, Manu podrá añadir y configurar el bloque desde el editor de
temas.

Si el tema de la tienda real usa otra estructura de carrito, ajusta los
selectores del app embed en el editor del tema.

## Configuración del bloque

En el editor se pueden configurar el título, una reseña destacada, el autor, el
enlace y los colores. La puntuación y cantidad se leen automáticamente desde los
metafields del producto; el resumen no aparece si el producto no tiene esos
datos. Shopify documenta estos campos
estándar en <https://shopify.dev/docs/apps/build/metafields/list-of-standard-definitions>;
Judge.me explica la sincronización en
<https://judge.me/help/en/articles/8394936-displaying-product-ratings-and-review-counts-with-judge-me-metafields>.

## Barra de envío gratis

La barra tiene dos ubicaciones. Para que aparezca automáticamente dentro del
carrito desplegable, activa el app embed **Free shipping progress** desde el
[editor del tema](https://tienda-dev-pruebas.myshopify.com/admin/themes/186859847757/editor?context=apps&activateAppId=10e8dcca2468623e7bd1dc083cb9b7c7%2Ffree-shipping-progress) y guarda. Para ponerla arriba o en otra sección compatible, abre el [editor del tema](https://tienda-dev-pruebas.myshopify.com/admin/themes/186859847757/editor), selecciona **Encabezado** y usa **Agregar bloque de aplicación → Shipping progress bar**. Puedes moverla entre las secciones que Shopify permita para bloques de apps. Shopify no permite colocarla dentro de cualquier contenedor arbitrario; la sección debe admitir bloques `@app`.

Configura el mínimo, texto y colores por separado en cada ubicación. El mínimo inicial es `100` en la moneda del carrito, solo como valor de demo. Ambos elementos leen el carrito mediante `GET /cart.js`, calculan el progreso con el subtotal después de descuentos y usan la moneda de presentación. No escriben en el carrito ni requieren permisos de Admin API. En el tema Dawn de desarrollo, el embed detecta el drawer; los selectores pueden ajustarse si el tema de Manu tiene otra estructura.

Antes de instalarla en la tienda real, hay que definir los mínimos por mercado y moneda que use Manu y distribuir la versión de la app a esa tienda. El umbral `100` es solo el valor inicial de la demo.
