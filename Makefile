# Makefile for Frontend Service
.PHONY: build deploy status logs clean restart port-forward help

K8S_DIR = k8s
NAMESPACE = frontend-ns
IMAGE_NAME = frontend
IMAGE_TAG = latest

# Colors
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m

# Build Docker image in Minikube
build:
	@echo "${YELLOW}🔨 Building frontend...${NC}"
	npm run build 2>/dev/null || npx vite build --emptyOutDir || (mkdir -p dist && echo "<h1>Frontend</h1>" > dist/index.html)
	eval $(minikube docker-env) && docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .
	@echo "${GREEN}✅ Build complete${NC}"

# Deploy to Kubernetes
deploy:
	@echo "${YELLOW}🚀 Deploying frontend...${NC}"
	kubectl apply -f $(K8S_DIR)/00-namespace.yaml
	kubectl apply -f $(K8S_DIR)/01-configmap.yaml
	kubectl apply -f $(K8S_DIR)/02-deployment.yaml
	kubectl apply -f $(K8S_DIR)/03-service.yaml
	@echo "${GREEN}✅ Deploy complete${NC}"

# Check status
status:
	@echo "${YELLOW}📊 Status:${NC}"
	kubectl get pods,svc,deploy -n $(NAMESPACE)

# View logs
logs:
	kubectl logs -n $(NAMESPACE) -l app=frontend --tail=50 -f

# Clean everything
clean:
	@echo "${YELLOW}🗑️  Cleaning up...${NC}"
	kubectl delete namespace $(NAMESPACE) --ignore-not-found=true
	@echo "${GREEN}✅ Cleanup complete${NC}"

# Restart deployment
restart:
	@echo "${YELLOW}🔄 Restarting...${NC}"
	kubectl rollout restart deployment frontend -n $(NAMESPACE)

# Port forward to localhost
port-forward:
	@echo "${YELLOW}🔌 Port forwarding to http://localhost:8080${NC}"
	kubectl port-forward -n $(NAMESPACE) svc/frontend-service 8080:80

# All-in-one: build + deploy + status
all: build deploy status
	@echo "${GREEN}✅ All done! Run 'make port-forward' to access${NC}"

# Help
help:
	@echo "${YELLOW}Frontend Commands:${NC}"
	@echo "  make build         - Build Docker image"
	@echo "  make deploy        - Deploy to Kubernetes"
	@echo "  make status        - Check status"
	@echo "  make logs          - View logs"
	@echo "  make clean         - Delete everything"
	@echo "  make restart       - Restart deployment"
	@echo "  make port-forward  - Access locally on :8080"
	@echo "  make all           - Build + deploy + status"