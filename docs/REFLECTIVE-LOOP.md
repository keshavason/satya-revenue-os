# SATYA Revenue OS · Bucle de agentes y espejos (diseño)
## Reflective agent / mirror / guide / meta-review loop · RC1 proposal

**Estado:** diseño para futuras versiones; **no implementado ni ejecutado** en RC1. Consulta el [protocolo de base en satya-review](https://github.com/keshavason/satya-review/blob/ethics/ahimsa-viveka-foundation-20261012/docs/REFLECTIVE-LOOP.md) y nuestra [continuidad ética](ETHICAL-CONTINUITY.md). Ambos pueden permanecer como propuestas sin fusionar.

## Propuesta para una decisión comercial

```text
objective + typed inputs
 -> proposer: evidencia, propósito, afectados, riesgos (Ahiṃsā)
 -> mirror: objeciones, alternativas y consecuencias indirectas (Viveka)
 -> guide: revisión del desacuerdo; afirmaciones sustentadas (Satya)
 -> meta-review when material: dependencias, fallos comunes y daños agregados
 -> recorded recommendation | revise | pending | stop
 -> separately authenticated human approval + deterministic policy gate (future)
 -> bounded live effect (future only) + receipt
 -> monitor impact, repair where possible, reopen when conditions change
```

**Regla:** todos los niveles vuelven a evaluar Ahiṃsā → Viveka → Satya; la figura de «gurú» nombra una función crítica y humilde, **no una fuente de infalibilidad ni acceso superior**. El espejo necesita contraste real; varios modelos con los mismos datos no equivalen automáticamente a juicio independiente.

## Invariantes que debe conservar una futura implementación

- **Sin autoridad emergente:** ni mayoría de agentes ni revisión de revisión autoriza por sí misma emails, cobros, CRM, publicación, gasto ni otros efectos.
- **Sin autopromoción de información no confiable:** resultados de navegador, documentos, clientes y otros agentes pueden aportar evidencia, no cambiar permisos o reglas.
- **Autonomía acotada:** la profundidad y el coste se fijan por operación y riesgo; si se exceden sin resolver, conservar `pending` o `stop`.
- **Integridad epistemológica:** preservar opiniones contrarias, fuentes, fecha, estado de la afirmación y motivos de cada revisión; no confundir consenso con verdad.
- **Afectados más allá del cliente:** terceros, grupos vulnerables, otros seres vivos, consumo de recursos y externalidades ecológicas; los microdaños pueden acumularse.
- **Separar pasado, presente y revisión:** nuevos datos reabren expedientes y crean eventos nuevos, sin reescribir el historial.
- **Intervención proporcional:** revisar también daños de no actuar, necesidad de protección, reversibilidad y alternativas menos dañinas.
- **Humano responsable:** decisiones de alto impacto requieren gobernanza y autorización precisas fuera del texto generado.

## Encaje con la arquitectura actual

- **Core claims/provenance:** ubicación conceptual futura de afirmaciones, objeciones, incertidumbre y versiones de evidencia.
- **Runtime/skills:** un host de confianza podría coordinar distintos revisores; RC1 actualmente solo ejecuta funciones registradas localmente.
- **Policy/approval gateway:** un futuro control verificable impediría que una propuesta, incluso revisada, active efectos sin permiso.
- **Run ledger:** guardar iteraciones como eventos con referencias padre, versiones, disensos y desencadenantes de reapertura. Los registros actuales no prueban independencia ni carácter ético.
- **Domain/evals:** diseñar escenarios con daños agregados, falsa unanimidad, prompts hostiles, recursión sin término, autorización ausente y señal de daño tardía.

## Condiciones previas a programación

1. Proponer OpenSpec y definir contratos tipados con propietarios responsables.
2. Decidir disparadores y presupuestos por riesgo, no una recursión perpetua en cada consulta.
3. Probar en dry-run agentes con errores correlacionados y fuentes contradictorias; medir falsos positivos, falsos negativos, coste y latencia.
4. Definir independencia de revisores, detección de circularidad, supervisión humana, gestión de incidentes y capacidad de parada.
5. Solo considerar conectores reales después de pruebas específicas y autorización explícita.

**Truth boundary / Límite de verdad:** esta página es una arquitectura propuesta. Los roles no están instanciados como agentes remotos; no hay monitoreo ambiental, metarrevisor operativo, guardianes automáticos ni efectos comerciales en vivo. La documentación no modifica el esquema, la CLI o los tests existentes de RC1.

## English summary

A future trusted host might orchestrate proposer → independent mirror → fallible guide → optional meta-review, with risk-bounded cycles and evidence-triggered reopening. Every review applies non-harm, discernment and truthfulness; it cannot grant its own permissions. RC1 remains local and dry-run-only; the recursive loop is **not implemented**. Never conflate agreement among agents with proof, authorization or environmental safety.
