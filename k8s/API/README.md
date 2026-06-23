# NAGP Kubernetes Deployment

## Requirement Understanding

- **Goal:** Deploy the NAGP API and a persistent PostgreSQL backend on Kubernetes so the API is externally reachable, horizontally scalable, and the database is durable.
- **Success Criteria:**
  - API reachable via Ingress.
  - API pods autoscale under load (HPA active).
  - PostgreSQL data persists across pod restarts (PV/PVC bound).
  - Secrets and configuration applied securely.
  - Resource requests/limits enable predictable scheduling and autoscaling.

## Assumptions

- Kubernetes cluster supports Deployments, StatefulSets, Ingress, and HPA (K8s >= 1.18 recommended).
- An Ingress controller (for example, nginx-ingress) and `metrics-server` are installed and functional.
- A suitable StorageClass exists or the provided PV manifests match the environment.
- Container images referenced in `API/` are accessible from the cluster (public or private registry credentials provided).
- User has RBAC permissions to create Deployments, StatefulSets, Services, PV/PVCs, Secrets, ConfigMaps, and Ingress resources.
- DNS and TLS termination are handled by the Ingress controller or external infra when required.

## Solution Overview

- **Architecture:**
  - Stateless API served by a `Deployment` exposed internally via a `Service`, and externally via an `Ingress`.
  - PostgreSQL runs as a `StatefulSet` with a `PV/PVC` pair for durable storage, exposed internally via a `Service`.

- **Manifests provided in this repo:**
  - API Deployment & Service: [API/nagp-api-deployment.yaml](API/nagp-api-deployment.yaml), [API/nagp-api-service.yaml](API/nagp-api-service.yaml)
  - Ingress: [API/ingress.yaml](API/ingress.yaml)
  - HPA: [API/hpa.yaml](API/hpa.yaml)
  - Postgres StatefulSet & Service: [postgress/postgres-statefulset.yaml](postgress/postgres-statefulset.yaml), [postgress/postgres-service.yaml](postgress/postgres-service.yaml)
  - PV/PVC: [postgress/postgres-pv.yaml](postgress/postgres-pv.yaml), [postgress/postgres-pvc.yaml](postgress/postgres-pvc.yaml)
  - Config & Secret: [postgress/postgres-config.yaml](postgress/postgres-config.yaml), [postgress/postgres-secret.yaml](postgress/postgres-secret.yaml)

- **Recommended deployment order:**
  1. Create PV/PVC and ensure storage is available.
  2. Apply Secrets and ConfigMaps.
  3. Deploy Postgres StatefulSet and Postgres Service.
  4. Deploy API Deployment and API Service.
  5. Apply Ingress configuration.
  6. Verify `metrics-server` and apply HPA for the API.

- **Runtime behavior:**
  - API is horizontally scalable via HPA and serves external traffic through Ingress.
  - PostgreSQL retains data on node/pod restarts via persistent volumes and maintains stable network identity via StatefulSet.

## Justification for the Resources Utilized

- **StatefulSet for Postgres:** Provides stable network identity and ordered lifecycle required for database durability and predictable failover behavior.
- **Persistent Volumes & PVCs:** Ensure data persists across pod and node lifecycle events; chosen capacity and access mode reflect DB requirements.
- **Secrets:** Credentials are stored as Kubernetes `Secret` to avoid having sensitive information in plaintext manifests.
- **ConfigMap:** Non-sensitive DB configuration is centralized for easy updates without rebuilding images.
- **Deployment for API:** The API is stateless; `Deployment` enables rolling updates, rollbacks, and scaling.
- **Services (ClusterIP):** Provide stable in-cluster DNS names so API and Postgres discover and communicate reliably.
- **Ingress:** Centralizes external routing and allows host/path routing and TLS termination (handled by the Ingress controller).
- **Horizontal Pod Autoscaler:** Autoscaling the API improves cost-efficiency and resilience under variable traffic; relies on `metrics-server` or custom metrics.
- **Resource requests & limits:** Help the scheduler place pods correctly and prevent resource contention; they support stable performance and predictable autoscaling.

## Quick Apply & Verification (example)

1. Apply storage, config, and DB resources:

```bash
kubectl apply -f postgress/postgres-pv.yaml
kubectl apply -f postgress/postgres-pvc.yaml
kubectl apply -f postgress/postgres-secret.yaml
kubectl apply -f postgress/postgres-config.yaml
kubectl apply -f postgress/postgres-statefulset.yaml
kubectl apply -f postgress/postgres-service.yaml
```

2. Deploy the API and access resources:

```bash
kubectl apply -f API/nagp-api-deployment.yaml
kubectl apply -f API/nagp-api-service.yaml
kubectl apply -f API/ingress.yaml
kubectl apply -f API/hpa.yaml   # after verifying metrics-server
```

3. Verify:

```bash
kubectl get pods --all-namespaces
kubectl get pvc
kubectl get svc
kubectl get ingress
kubectl describe hpa
```

---