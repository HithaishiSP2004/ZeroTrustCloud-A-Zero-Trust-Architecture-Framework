# ZeroTrustCloud: Implementing and Automating Identity-Centric Zero-Trust Architecture for Cloud-Native Environments

> 📋 **Current Status: Research & Methodology / Experimental Planning (Week 4)**

**ZeroTrustCloud** (proposed platform name: **TrustMesh**) is a final-year MCA cybersecurity engineering project exploring the design, automated policy governance, and empirical evaluation of an **Identity-Centric Zero-Trust Architecture (ZTA)** tailored specifically for containerized, multi-cloud Kubernetes environments (AWS EKS & Azure AKS).

---

## 1. Project Overview

Cloud-native applications increasingly rely on dynamic microservices, distributed containers, and ephemeral compute nodes across hybrid multi-cloud infrastructure. Traditional perimeter-based security architectures ('castle-and-moat') fail because internal workloads, service accounts, and CI/CD automation operate across arbitrary network boundaries without a static perimeter.

**TrustMesh** investigates how cryptographic workload identities, automated Policy-as-Code enforcement, mutual TLS (mTLS) service mesh encryption, runtime continuous verification, and software supply chain protection can be unified into an automated security control plane.

---

## 2. Problem Statement

Modern cloud-native environments face acute security challenges that perimeter firewalls cannot prevent:
* **Perimeter Dissolution:** Dynamic pod scheduling invalidates IP/port-based security boundaries.
* **Identity Sprawl & Static Secrets:** Excessive long-lived API tokens and hardcoded secrets leak into version control or package registries.
* **Over-Privileged Workloads:** Permissive default Kubernetes configurations allow lateral privilege escalation upon container breakout.
* **Unprotected East-West Traffic:** Unencrypted internal microservice communication exposes sensitive API calls to packet sniffing and tampering.
* **Supply-Chain Poisoning:** Unsigned container images and vulnerable third-party dependencies introduce remote code execution risks.
* **Configuration Drift:** In-cluster out-of-band changes bypass CI/CD static security gates.

---

## 3. Project Objectives

1. **Identity-Centric Workload Security:** Architect cryptographic, secretless workload attestation using SPIFFE/SPIRE and cloud OIDC federation (AWS IRSA / Azure Workload Identity).
2. **Automated Policy-as-Code:** Enforce declarative security policies across clusters using Open Policy Agent (OPA) Gatekeeper admission controllers.
3. **Zero Implicit Network Trust:** Implement strict mutual TLS (mTLS) and Layer-7 authorization policies across microservices using Istio Service Mesh.
4. **Continuous Runtime Verification:** Continuously monitor container hash integrity, detect configuration drift, and calculate dynamic risk scores.
5. **Software Supply Chain Defense:** Integrate automated vulnerability triage (Trivy), SBOM generation (Syft), and digital image signing (Cosign/Sigstore) into CI/CD pipelines.
6. **Centralized Security Observability:** Ingest authentication logs, authorization denials, and admission rejections into Prometheus/Loki and a posture dashboard.
7. **Empirical Benchmarking:** Quantitatively measure defensive efficacy and evaluate latency overhead and compute trade-offs through controlled red-team test scenarios.

---

## 4. Proposed Architecture Blueprint

```text
                  ┌─────────────────────────────────────────┐
                  │        Users / Developers / CI/CD       │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Identity & Access Layer         │
                  │      OIDC / Cloud IAM / SPIFFE SVID     │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          Policy-as-Code Engine          │
                  │       OPA Gatekeeper / Rego Rules       │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
             ┌──────────────────────────────────────────────────┐
             │               Kubernetes / Multi-Cloud           │
             │                      (EKS / AKS)                 │
             │                                                  │
             │   ┌──────────────┐            ┌──────────────┐   │
             │   │  Service A   │───────────▶│  Service B   │   │
             │   │(Envoy Sidecar)  STRICT mTLS(Envoy Sidecar)│   │
             │   └──────────────┘            └──────────────┘   │
             │                                                  │
             │       Istio Service Mesh / Layer-7 AuthZ         │
             └─────────────────────────┬────────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │      Continuous Verification Engine     │
                  │   Dynamic Trust Score / Drift Detection │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Observability & Auditing        │
                  │  Prometheus / Loki / Posture Dashboard  │
                  └─────────────────────────────────────────┘
```

---

## 5. Core System Modules (Planned Implementation Stages)

* **Identity Engine [Planned]:** Cryptographic workload identity attestation via SPIRE and secretless cloud OIDC federation.
* **Policy Engine [Planned]:** Declarative Policy-as-Code admission webhooks using OPA Gatekeeper and Rego rules.
* **Service Trust Engine [Planned]:** Istio Service Mesh enforcing strict mTLS and Layer-7 authorization policies.
* **Continuous Verification Engine [Planned]:** Runtime daemon tracking configuration drift and computing dynamic trust scores.
* **Pipeline Security Engine [Planned]:** Secretless GitHub Actions runners, Trivy scanning, and Cosign image signing enforced at admission.
* **Observability & Compliance Engine [Planned]:** Centralized aggregation of audit telemetry, policy violations, and security health metrics.

---

## 6. Proposed Technology Stack

* **Cloud Infrastructure:** Amazon Web Services (AWS EKS), Microsoft Azure (Azure AKS)
* **Container Orchestration:** Kubernetes (v1.28+)
* **Workload Identity:** SPIFFE / SPIRE, OpenID Connect (OIDC), AWS IRSA, Azure Workload Identity
* **Policy-as-Code:** Open Policy Agent (OPA) Gatekeeper, Rego Policy Language
* **Service Mesh:** Istio Service Mesh, Envoy Proxy (STRICT mTLS)
* **Supply Chain Security:** Cosign / Sigstore, Syft (SBOM), Trivy (Vulnerability Scanner)
* **CI/CD Automation:** GitHub Actions (OIDC Federated, Secretless)
* **Observability & Logging:** Prometheus, Grafana, Grafana Loki, OpenTelemetry Collector

---

## 7. Research & Methodology

The project is grounded in a two-phase literature study surveying 20 research papers and technical publications:
* **Phase I Review (10 Papers):** Workload identity federation, OIDC token binding, mTLS benchmarking, and supply chain integrity.
* **Phase II Review (10 Papers):** Secretless inter-application identities, service mesh control plane verification, Intel SGX enclaves, Kubernetes network misconfigurations, and dynamic risk-based access control (DR-TBAC).
* **Week 4 Blueprint:** Detailed methodology formalization, STRIDE threat modeling, telemetry schema definition, and controlled experimental matrix.

Documentation is cataloged under [`Plannings/`](./Plannings/) and literature reviews under [`Research Papers Review/`](./Research%20Papers%20Review/).

---

## 8. Experimental Evaluation Strategy

System validation will be conducted through controlled security experiments comparing:
1. **Baseline Cloud-Native Environment (Without Zero-Trust Controls):** Flat CNI networking, default service accounts, static secrets, and unsigned container images.
2. **Hardened ZeroTrustCloud Environment (With TrustMesh Controls):** STRICT mTLS, default-deny NetworkPolicies, SPIRE attestation, OPA Gatekeeper admission rules, and mandatory Cosign image signing.

**Planned Test Scenarios (EXP-01 to EXP-08):**
* Authorized communication over strict mTLS (EXP-01)
* Unauthenticated pod access blocking (EXP-02)
* Unauthorized Layer-7 service call rejection (EXP-03)
* Privilege escalation manifest blocking (EXP-04)
* Untrusted / unsigned container image rejection (EXP-05)
* Out-of-band configuration drift detection (EXP-06)
* Vulnerable dependency pod quarantine (EXP-07)
* Synthetic workload load stress benchmarking (EXP-08)

---

## 9. Repository Structure

```text
ZeroTrustCloud-A-Zero-Trust-Architecture-Framework/
│
├── README.md                                          [Project overview, status, and roadmap]
│
├── Plannings/                                         [Project work plans & methodology]
│   ├── Work_Plan_and_Project_Progress_Report_ZeroTrustCloud.pdf
│   └── ZeroTrustCloud_Methodology_Data_Collection_Experimental_Plan.pdf
│
└── Research Papers Review/                            [Literature survey reports]
    ├── part 1/                                        [Phase I literature review papers]
    │   ├── Baire Gowda_LiteratureReview_ZeroTrustCloud.pdf
    │   ├── Hithaishi-sp-Research_Review_ZeroTrustCloud_TrustMesh.pdf
    │   └── Sanjay REVIEW OF RESEARCH PAPER-1.pdf
    │
    └── part 2/                                        [Phase II literature review papers]
        ├── Baire_Gowda_LiteratureReview_ZeroTrustCloud_Week3.pdf
        ├── Hithaishi-sp-Research_Review_ZeroTrustCloud_TrustMesh.pdf
        └── SANJAY LITERATURE REVIEW 2.pdf
```

### Planned Future Directory Structure (To Be Created During Implementation)

```text
├── identity-engine/          [Planned: Phase 4 — SPIRE attestation & OIDC federation manifests]
├── policy-engine/            [Planned: Phase 4 — OPA Gatekeeper constraints & Rego policies]
├── service-mesh/             [Planned: Phase 4 — Istio STRICT mTLS & Layer-7 AuthZ policies]
├── continuous-verification/  [Planned: Phase 5 — Runtime verification & drift detectors]
├── supply-chain-security/    [Planned: Phase 5 — Cosign signature webhooks & SBOM generators]
├── observability/            [Planned: Phase 6 — Prometheus telemetry configs & Grafana dashboards]
│
├── infrastructure/           [Planned: Phase 3 — Cluster provisioning automation]
│   ├── kubernetes/           [Planned — Base Helm charts & microservice testbed]
│   ├── aws/                  [Planned — AWS EKS Terraform & IRSA IAM roles]
│   └── azure/                [Planned — Azure AKS Terraform & Workload Identity]
│
└── experiments/              [Planned: Phase 5 — Empirical evaluation]
    ├── scenarios/            [Planned — Attack simulation scripts EXP-01 to EXP-08]
    ├── datasets/             [Planned — Raw collected CSV telemetry]
    └── results/              [Planned — Comparative performance charts & logs]
```

---

## 10. Project Team Members

* **Hithaishi S P** — [@HithaishiSP2004](https://github.com/HithaishiSP2004) *(Project Lead)*
* **Baire Gowda** — [@bairegowda1003](https://github.com/bairegowda1003)
* **Sanjay** — [@sanju722002](https://github.com/sanju722002)

**Academic Program:** Master of Computer Applications (MCA) — Final Year, Semester III  
**Department:** Department of Computer Applications  
**Academic Year:** 2025 – 2026  
**Project Period:** September 4, 2026 – November 27, 2026

---

## 11. Next Phase Roadmap

* **Weeks 5–7:** Multi-cloud cluster provisioning (AWS EKS & Azure AKS), baseline workload characterization, and Zero-Trust control implementation (SPIRE, OPA, Istio).
* **Weeks 8–9:** Controlled attack simulations (EXP-01 to EXP-08) and empirical telemetry data collection into normalized CSV datasets.
* **Weeks 10–12:** Comparative statistical analysis, performance graphing, and final dissertation authoring.
