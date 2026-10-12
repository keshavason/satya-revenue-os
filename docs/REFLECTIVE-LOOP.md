# SATYA Revenue OS · Bucle reflexivo
## Documentary design v0.1 · Not implemented in RC1

Consultar el [diseño de referencia fijado](https://github.com/keshavason/satya-review/blob/f63587e5f16dc103d1369b40630ccaef5347a29d/docs/REFLECTIVE-LOOP.md), la [continuidad ética](ETHICAL-CONTINUITY.md) y el [registro local de referencia](COMMONS-REFERENCE.md). Publicar este diseño no instancia revisores ni activa efectos externos.

## Propuesta para una decisión comercial

```text
objetivo + entradas tipadas + alcance autorizado
 -> agente: evidencia, propuesta, afectados y riesgos
 <-> espejo: objeciones, alternativas y consecuencias omitidas
 <-> maestro: conserva aportes válidos, explica una mejora y prueba transferencia
 -> metarrevisión proporcional: dependencias y daños agregados, si procede
 -> recomendación | revisar | pendiente | detener
 -> autorización separada + controles deterministas (implementación futura)
 -> efecto acotado, habilitado y autorizado (fuera de RC1)
 -> observación, conciliación, reparación y revisión ante cambios
```

Todos los roles aplican conjuntamente no-daño, discernimiento, honestidad desde el inicio, responsabilidad, consecuencias y cuidado. «Gurú» designa aquí a un maestro con competencia demostrable en un dominio, no una autoridad espiritual, un permiso superior ni infalibilidad.

No basta que varios modelos coincidan: declarar fuentes, dependencias e incentivos compartidos. Cuando todos repiten una premisa, buscar evidencia externa en vez de incrementar el número de aprobaciones.

## Invariantes para implementaciones futuras

- **Sin autoridad emergente:** ningún voto entre agentes autoriza mensajes, cobros, escrituras, publicaciones o gasto.
- **Sin política desde datos no confiables:** documentos, herramientas y agentes aportan información, no permisos.
- **Límites definidos antes del ciclo:** coste, tiempo y profundidad. Agotarlos sin resolver un riesgo material deja pendiente o detiene; no produce aprobación por cansancio.
- **Disenso preservado:** registrar evidencia, fecha, alternativas y límites; la revisión puede corregir al autor o cliente.
- **Afectados más allá del cliente:** contemplar terceros, seres vivos, recursos, ecosistemas y efectos acumulativos.
- **Consecuencias observadas:** crear nuevos eventos y versiones al corregir; no falsificar el historial.
- **No actuar también tiene efectos:** contrastar abstención, alternativas, protección proporcional y reversibilidad.
- **Responsable identificable:** separar revisión AI, revisión humana, autorización y ejecución de la operación concreta.

## Encaje conceptual con RC1

Claims/provenance podrían registrar afirmaciones y objeciones; un host de confianza podría coordinar revisores; una pasarela separada tendría que comprobar permisos. El ledger podría enlazar iteraciones, disensos y reaperturas. La existencia de estas primitivas por separado no demuestra que ya implementen la orquestación descrita.

RC1 ejecuta funciones registradas localmente y no incorpora un conector comercial en vivo. Este cambio no modifica código, esquemas, CLI ni tests.

## Antes de automatizar

Proponer OpenSpec y contratos tipados; asignar responsables; definir presupuestos por riesgo, independencia y competencia por dominio. Comparar agente solo, agente con espejo y agente con maestro, controlando o declarando diferencias de recursos.

Probar errores correlacionados, falsa unanimidad, fuentes contradictorias u obsoletas, instrucciones hostiles, permisos ausentes o revocados, efectos acumulativos y bucles sin fin. Comprobar además cuándo una revisión empeora una solución correcta y si la enseñanza se transfiere a una tarea distinta.

Medir errores y correcciones, falsos positivos y negativos, coste, latencia, disenso y parada. No declarar resultados a partir de casos meramente propuestos. Conectores reales requieren otra autorización y pruebas específicas.

## English summary

This is a pinned, domain-specific design reference, not an implemented multi-agent runtime. A proposer, critical mirror, domain teacher demonstrating transferable improvements and optional meta-review use bounded cycles. All commitments apply concurrently; no consensus grants permissions. RC1 stays local and dry-run-only. Independent review, comparative efficacy and live-effect safeguards remain to be demonstrated before operational adoption.
