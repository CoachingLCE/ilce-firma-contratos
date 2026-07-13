# Firma de Contratos — Instituto ILCE

App para que los/as docentes completen sus datos, firmen digitalmente el contrato
y este se envíe automáticamente en PDF a administracion@institutoilce.com.

## Antes de desplegar: 2 cosas para editar

### 1. Datos del representante del Instituto
Abrí `api/send-contract.js` y completá estas líneas (arriba del todo):

```js
const INSTITUTO_REP_NOMBRE = 'COMPLETAR NOMBRE DEL REPRESENTANTE';
const INSTITUTO_REP_CARGO = 'COMPLETAR CARGO (ej: Director/a)';
```

### 2. Clave de aplicación de Gmail
Como el envío es automático, necesitás una **contraseña de aplicación** de Gmail
(no la contraseña normal de la cuenta):

1. Andá a https://myaccount.google.com/security
2. Activá la verificación en 2 pasos (si no la tenés activada)
3. Buscá "Contraseñas de aplicaciones" (App Passwords)
4. Generá una nueva para "Correo" / "Otra"
5. Copiá el código de 16 caracteres que te da Google (esa es tu `GMAIL_APP_PASSWORD`)

## Cómo desplegar en Vercel

1. Instalá la CLI de Vercel si no la tenés: `npm i -g vercel`
2. Desde esta carpeta, ejecutá: `vercel`
3. Seguí los pasos (creá cuenta/proyecto si te lo pide)
4. Una vez desplegado, andá al dashboard del proyecto en vercel.com → **Settings → Environment Variables**
   y agregá:

   | Nombre | Valor |
   |---|---|
   | `GMAIL_USER` | el mail de Gmail del instituto (ej: contratos.ilce@gmail.com) |
   | `GMAIL_APP_PASSWORD` | la contraseña de aplicación de 16 caracteres |
   | `DEST_EMAIL` | (opcional) si querés que llegue a otro mail distinto de administracion@institutoilce.com |

5. Volvé a desplegar para que tome las variables: `vercel --prod`

Al final vas a tener una URL tipo `https://ilce-firma-contratos.vercel.app`

## Cómo embeberlo en Wix

1. En el editor de Wix, agregá un elemento **"Embed" → "Embed a Widget" → "Embed HTML iframe"**
2. Pegá esta URL como fuente del iframe: la que te dio Vercel
3. Ajustá el alto del iframe a algo generoso (ej: 1600-1800px) para que se vea todo el contrato sin scroll interno feo, o dejalo con scroll propio
4. Publicá la página de Wix

No hace falta pegar código HTML/JS dentro de Wix: el iframe carga la página completa
que ya vive en Vercel (formulario + lógica de firma + llamada a la función de envío).

## Probarlo

Entrá a la URL de Vercel, completá los datos de prueba, firmá en el recuadro y enviá.
Revisá que llegue el mail con el PDF adjunto a la casilla configurada como `DEST_EMAIL`.

## Estructura del proyecto

```
index.html          → formulario + contrato + firma digital (frontend)
api/send-contract.js → genera el PDF y lo envía por Gmail (backend serverless)
package.json         → dependencias (pdf-lib, nodemailer)
```

## Notas

- Cada docente completa el % de remuneración que ya se acordó con el Instituto por fuera del sistema.
- La fecha de firma se toma automáticamente del día en que se envía.
- El PDF generado reproduce el texto completo del contrato, con los datos del/la docente
  y su firma insertada al final.
- No hay login: cualquiera con el link puede firmar. Si más adelante querés que cada docente
  reciba un link único y personalizado, se puede agregar sin mucho esfuerzo.
