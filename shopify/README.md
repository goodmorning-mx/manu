# Widget de Shopify para Manu

Esta carpeta contiene una extensión de tema de Shopify con un bloque visual de
reseñas de producto. El cliente podrá añadirlo, moverlo, configurarlo y
previsualizarlo en el editor de temas. La puntuación y cantidad se leen de los
metafields estándar de Shopify `reviews.rating` y `reviews.rating_count`, que
Judge.me puede mantener actualizados. La cita y el autor opcionales se escriben
manualmente; muestra solo reseñas auténticas con permiso. El bloque no consulta
pedidos, no llama al backend de Manu y no altera carrito ni checkout.

## Estado de la app

La app `Manu Social Proof` está registrada en el Dev Dashboard de
`goodmorning.mx`, vinculada a este proyecto y seleccionada para la tienda de
desarrollo `tienda-dev-pruebas.myshopify.com`. Sus permisos de API están vacíos.
La extensión compila con Shopify CLI. Se creó la versión
`manu-social-proof-2` con `--no-release`, sin publicarla a comercios. Shopify
CLI ya instaló la app en la tienda de desarrollo y mantiene activo el preview
local de la extensión. La versión está disponible en el
[Dev Dashboard](https://dev.shopify.com/dashboard/246659644/apps/446459576321/versions/1227236671489).

## Probar en la tienda de desarrollo

El preview del CLI está activo para el tema de desarrollo
`App Ext. Host (17bbe5-not-pc)`, ID `186859847757`. La plantilla de producto usa
JSON y su sección principal admite bloques `@app`. El bloque **Social proof**
ya está añadido y guardado una vez, debajo del título del producto. Para
conservar el preview local, deja activo el proceso `shopify app dev`.

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

Si la tienda usa un tema vintage, este bloque insertable puede no aparecer en
las secciones. En ese caso se necesitaría una variante *app embed* compatible,
que se activa en **Configuración del tema → App embeds**.

## Configuración del bloque

En el editor se pueden configurar el título, una reseña destacada, el autor, el
enlace y los colores. La puntuación y cantidad se leen automáticamente desde los
metafields del producto; el resumen no aparece si el producto no tiene esos
datos. Shopify documenta estos campos
estándar en <https://shopify.dev/docs/apps/build/metafields/list-of-standard-definitions>;
Judge.me explica la sincronización en
<https://judge.me/help/en/articles/8394936-displaying-product-ratings-and-review-counts-with-judge-me-metafields>.
