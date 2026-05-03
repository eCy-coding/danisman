# ═══════════════════════════════════════════════════════════
# EcyPro — Render Backend Deployment (Terraform)
# ═══════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.0"
    }
  }
}

provider "render" {
  # Set RENDER_API_KEY environment variable
}

# ── PostgreSQL Database ────────────────────────────────────
resource "render_postgres" "ecypro_db" {
  name            = "ecypro-db"
  plan            = var.db_plan
  region          = var.region
  database_name   = "ecypro"
  database_user   = "ecypro"
  high_availability = var.high_availability

  lifecycle {
    prevent_destroy = true
  }
}

# ── Backend Web Service ───────────────────────────────────
resource "render_web_service" "ecypro_api" {
  name              = "ecypro-api"
  plan              = var.api_plan
  region            = var.region
  runtime           = "docker"
  docker_context    = "."
  dockerfile_path   = "Dockerfile"
  docker_target     = "backend"
  health_check_path = "/api/health"

  auto_deploy = true

  env_vars = {
    NODE_ENV     = { value = "production" }
    PORT         = { value = "3001" }
    DATABASE_URL = { from_database = render_postgres.ecypro_db.id }
    JWT_SECRET   = { generate_value = true }
    JWT_EXPIRES_IN = { value = "7d" }
    CORS_ORIGIN  = { value = var.frontend_url }
  }
}

# ── Variables ──────────────────────────────────────────────
variable "region" {
  description = "Render region"
  type        = string
  default     = "frankfurt"
}

variable "db_plan" {
  description = "PostgreSQL plan"
  type        = string
  default     = "starter"
}

variable "api_plan" {
  description = "API service plan"
  type        = string
  default     = "starter"
}

variable "frontend_url" {
  description = "Frontend URL for CORS"
  type        = string
  default     = "https://ecypro.vercel.app"
}

variable "high_availability" {
  description = "Enable high availability for database"
  type        = bool
  default     = false
}

# ── Outputs ────────────────────────────────────────────────
output "api_url" {
  value = render_web_service.ecypro_api.url
}

output "database_url" {
  value     = render_postgres.ecypro_db.connection_string
  sensitive = true
}
