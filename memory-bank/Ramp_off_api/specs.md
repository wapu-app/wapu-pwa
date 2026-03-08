## Caso de uso
- Usuario merchand cobra con lightning recibiendo directamente en una lightning address provista por wapu.
- Cada usuario tiene su propia lightning address.
- El usuario acumula los cobros en su wallet Wapu en USD. (la conversion es automatica, no es necesario desarrollar algo nuevo para esto)
- El frontend de wapu debe permitir configurar un ALIAS/CBU para hacer withdraw automaticos.
- Debe permitir configurar un horario diario en el cual el backend realizara un withdraw automatico de todos los fondos en ARS al CBU/ALIAS configurado.

## Desafios
- El desafio principal es proveerle una lightning address a cada usuario. Podemos hacer eso creandolas manualmente en AlbyHub, pero serian direcciones @getalby.
- Talvez podria hacer una redireccion (usando direcciones user@wapu.app) donde el BE pide el invoice a getalby.
- Debe detectar el usuario en la LA para asignar el saldo recibido al Wapu user.
- Actualmente si alguien pagara a andycreed@getalby.com el pago se haria al nodo, pero el BE de Wapu no sabria que se recibio el dinero. Hay que investigar respecto al webhook de Alby para poder reportar al backend que se realizo un pago.
