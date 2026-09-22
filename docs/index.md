---
layout: doc
title: Quality delivery, made executable
---

# Quality delivery, made executable<span style="color:var(--vp-c-brand-1)">_</span>

This repository turns the ideas in Amine Beihaqi's [From Code to Production](https://www.beihaqi.com/blog/from-code-to-production) into commands, tests, workflows, and adoption guidance.

> Quality is continuous verification. Each gate should produce evidence, identify an owner, and make a clear delivery decision.

<div class="evidence-key">
  <code>Executable · runs here</code>
  <code>Configurable · connect infrastructure</code>
  <code>Documented · production requirement</code>
</div>

<div class="delivery-track" aria-label="Delivery path">
  <div class="delivery-stage"><strong>Dev</strong><span>format · lint · types · focused tests</span></div>
  <div class="delivery-stage"><strong>PR</strong><span>contracts · integration · security</span></div>
  <div class="delivery-stage"><strong>Main</strong><span>immutable images · critical E2E</span></div>
  <div class="delivery-stage"><strong>Nightly</strong><span>extended and scheduled evidence</span></div>
  <div class="delivery-stage"><strong>Pre-prod</strong><span>DAST · load · resilience rehearsal</span></div>
  <div class="delivery-stage"><strong>Canary</strong><span>SLO and business-metric decision</span></div>
  <div class="delivery-stage"><strong>Production</strong><span>synthetics · CVEs · incident response</span></div>
</div>

## Start with a failure

Clone, activate the native Git hooks, run the platform, and deliberately break a focused test. The [five-minute guide](/guide/getting-started) shows the complete feedback loop.

## What this repository proves

- Local and CI checks call the same versioned commands.
- Two services exercise real unit, component, contract, integration, and E2E boundaries.
- Pull-request checks remain authoritative when local hooks are bypassed.
- Production stages are documented honestly instead of simulated.
