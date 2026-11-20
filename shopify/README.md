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
`manu-social-proof-5` se creó con `--no-release` y no se publicó a comercios.
Shopify CLI mantiene el preview local conectado a la tienda de desarrollo. La
versión está disponible en el
[Dev Dashboard](https://dev.shopify.com/dashboard/246659644/apps/446459576321/versions/1259428347905).

## Probar en la tienda de desarrollo

El preview del CLI está activo para el tema de desarrollo
`App Ext. Host (17bbe5-not-pc)`, ID `186859847757`. La plantilla de producto usa
JSON y su sección principal admite bloques `@app`. El bloque **Social proof**
ya está añadido debajo del título. El embed de envío gratis está activo y la
barra movible ya está colocada en la franja superior del encabezado. El carrito
del tema está configurado como drawer. Para conservar el preview local, deja
activo el proceso `shopify app dev`.

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

La barra tiene dos ubicaciones y ambas ya están configuradas en el tema de
prueba: el app embed **Free shipping progress** aparece en el carrito drawer y
el app block **Shipping progress bar** se muestra en una franja de ancho completo
sobre los controles del encabezado. Abre la [vista previa del tema](https://tienda-dev-pruebas.myshopify.com/?preview_theme_id=186859847757), agrega un producto y abre el carrito para ver el progreso.

En esta demo, las dos barras tienen un mínimo de `1000` en la moneda del carrito
para que el producto de muestra de `949.95` muestre avance. Cámbialo al mínimo
real de Manu antes de instalar en su tienda. Los textos y colores se configuran
por separado en cada ubicación desde el
[editor del tema](https://tienda-dev-pruebas.myshopify.com/admin/themes/186859847757/editor).
Ambos elementos leen `GET /cart.js`, usan la moneda de presentación y no
escriben en el carrito ni requieren permisos de Admin API. Shopify solo deja
colocar app blocks en secciones que acepten bloques `@app`; la posición precisa
del encabezado se ajustó en este tema de desarrollo.

### Mínimos por país

Cada barra tiene un campo **Mínimos por país (JSON)**. Usa códigos ISO de dos
letras y valores numéricos, por ejemplo `{"US": 1000, "MX": 1500}`. El código
se toma del país activo de Shopify (`localization.country.iso_code`); si no hay
una regla para ese país, la barra usa el mínimo general. Los montos de las
reglas deben expresarse en la moneda de presentación del mercado activo, que es
la moneda devuelta por `GET /cart.js`.

Este dato representa el contexto de país/mercado activo, no necesariamente el
país físico del visitante ni el destino final del pedido. Shopify Plus puede
preseleccionar el país con geolocalización; en otros casos puede depender del
país que el comprador eligió en la tienda. La sugerencia de geolocalización no
es infalible. Configura también las zonas y tarifas reales en Shopify: la barra
solo informa el mínimo y el checkout determina el envío aplicable a la dirección
de entrega. Consulta la [localización en Liquid](https://shopify.dev/docs/api/liquid/objects/localization), la [detección de localización](https://shopify.dev/docs/storefronts/themes/markets/localization-discovery) y [monedas y países de Shopify Markets](https://shopify.dev/docs/storefronts/themes/markets/multiple-currencies-languages).

Antes de instalarla en la tienda real, hay que definir los mínimos por mercado y
moneda que use Manu y distribuir la versión de la app a esa tienda. El umbral
`1000` en este tema es solo de demostración.
