# Ethical continuity: Ahiṃsā → Viveka → Satya

**Status:** non-binding design and review guidance for SATYA Revenue OS RC1, not an implemented AI moral faculty, environmental sensor, deploy gate or certification. RC1 remains local and dry-run-only.

This project is a *downstream application* of the ethical foundation documented in [KeshavaSon's satya-review](https://github.com/keshavason/satya-review/pull/3) (proposed foundation; not yet merged). The shared principles do **not** imply a shared codebase, data transfer, live integration or imported authorization.

## The foundation remains underneath every new layer

1. **Ahiṃsā — non-harm first:** before selecting an economic objective or optimizing conversion, identify foreseeable harms to people, other living beings, communities and ecosystems. Consider severity, likelihood, irreversibility, vulnerable groups, consent, privacy, resource use and externalized costs. Prioritize prevention and proportionate protection; do not classify people as "out of harmony" to strip them of protection.
2. **Viveka — contextual discernment:** test whether inputs are reliable, current, representative and complete enough to act. Evaluate alternatives, including doing nothing; check asymmetric effects, externalities, distribution of costs, uncertainty and conflicts of interest. Avoid treating intuition, sentiment, generated explanations or business metrics as verified ecological measurements.
3. **Satya — truthfulness after harm analysis and discernment:** keep claims, evidence, uncertainty and temporal scope distinct. Revise conclusions when evidence or circumstances change without silently altering prior records. A factual statement may still be unsuitable to act on if it creates serious unjustified harm.
4. **Dharma / human accountability:** protect delegated scope, exact approval, confidentiality, and separation between recommendation and effects. Reject policy override via untrusted content. Assign a responsible owner for consequential actions.
5. **Prema / care and repair:** preserve dignity and autonomy, seek the least-harm feasible path, enable stop/rollback where possible, and document correction. Care is a design commitment, not a measured state of consciousness.

**Important:** This is an ordering of *checks before action*, not an empirical claim that harms can always be eliminated, nor a universal algorithm for every moral trade-off. Sometimes preventing imminent harm requires a proportionate protective intervention. Such decisions are contextual and should not grant autonomous coercive authority to an LLM.

## Practical review before any eventual external effect

A release or proposed effect should document:
- **Affected life and environment:** stakeholder mapping beyond the customer; foreseeable direct, indirect and ecological effects, with evidence and limitations.
- **Risk and alternatives:** what can go wrong, magnitude, mitigation, residual risk and lower-harm options, including abstention.
- **Evidence quality:** source, time, observation vs test vs inference, uncertainty, and update conditions.
- **Authority:** tenant, scope, approver identity, exact operation, time limits, intended recipients and clear human accountability.
- **Repair:** how to prevent, stop, reverse or compensate for harmful effects, with an audit trail and a review trigger.

Where a serious harm could occur and sufficient evidence or authorization is missing, **do not execute**. Keep the decision pending and escalate to the appropriate human. These are *requirements for future system design*, not claims that all these checks already exist as deterministic gates in RC1.

## Mapping to present components

| Existing SATYA Revenue OS boundary | Ethical interpretation and current limit |
| --- | --- |
| Claims / provenance / evaluation | Satya can record claim types and bounded tests; it does not independently guarantee truth. |
| Planning / adapters / commercial metrics | Viveka requires context, affected parties, alternatives and uncertainty. Current business metrics do not constitute proof of Ahiṃsā. |
| Policy / approval / effect gateway | Authorization and trust boundaries are necessary safeguards, but do not independently assess planetary harmony or comprehensive welfare. |
| Receipts / run ledger | Support accountability and correction within declared scope; neither certificates of ethics nor tamper-proof human-authenticated evidence. |
| Local dry-run RC1 | Does not publish, send messages, spend money or make other live external effects. Real-world safeguards must be evaluated before any live connector. |

## Review invariants for future code

- No optimizer may justify knowingly unjustified serious harm merely by higher revenue, efficiency or model confidence.
- No uncertain or untrusted source may promote itself into policy, approval or authoritative evidence.
- No model or document may assert ecological synchronization, safety, or zero harm without bounded measurements and explicit limitations.
- No live effect may bypass a separate authorization and deterministic policy gate; high-impact unknowns must fail closed.
- Records must distinguish **requested**, **reviewed**, **approved**, **executed** and **verified** outcomes.
- No spiritual worldview or moral/personhood rating is a condition for using the software.

Until these invariants are implemented and tested within their claimed scope, report them as **design criteria**, not verified protections.

## Federated expansion reference (draft)

The [SATYA Commons federated expansion proposal](https://github.com/keshavason/satya-review/blob/ethics/ahimsa-viveka-foundation-20261012/docs/FEDERATED-EXPANSION.md) preserves this project's application-specific ethical continuity while maintaining **one reference foundation** in satya-review. A future integrator should adopt a pinned version explicitly, retain local controls and permissions, and publish a narrow domain adapter rather than duplicating principles across repositories. A documentation link is neither adoption nor a live interconnection. In particular, RC1 remains local and dry-run-only.

## Conexión en español

El segundo ladrillo **no borra el primero**. La finalidad comercial queda subordinada a **Ahiṃsā** (evitar daños), **Viveka** (discernir contexto y consecuencias) y **Satya** (declarar con honestidad lo comprobado y lo incierto). La responsabilidad humana, el cuidado y la reparación acompañan toda decisión. El software actual todavía no verifica por sí mismo la armonía ecológica ni certifica decisiones éticas.
