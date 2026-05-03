# ═══════════════════════════════════════════════════════════
# EcyPro — Vercel Frontend Deployment (Terraform)
# ═══════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

provider "vercel" {
  # Set VERCEL_API_TOKEN environment variable
}

# ── Vercel Project ─────────────────────────────────────────
resource "vercel_project" "ecypro_frontend" {
  name      = "ecypro-premium-consulting"
  framework = "vite"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }

  build_command    = "npm run build"
  output_directory = "dist"
  install_command  = "npm ci"

  environment = [
    {
      key    = "VITE_API_URL"
      value  = var.api_url
      target = ["production", "preview"]
    },
    {
      key    = "VITE_GA_TRACKING_ID"
      value  = var.ga_tracking_id
      target = ["production"]
    },
  ]
}

# ── Custom Domain ──────────────────────────────────────────
resource "vercel_project_domain" "primary" {
  count      = var.custom_domain != "" ? 1 : 0
  project_id = vercel_project.ecypro_frontend.id
  domain     = var.custom_domain
}

resource "vercel_project_domain" "www" {
  count               = var.custom_domain != "" ? 1 : 0
  project_id          = vercel_project.ecypro_frontend.id
  domain              = "www.${var.custom_domain}"
  redirect            = var.custom_domain
  redirect_status_code = 308
}

# ── Deployment ─────────────────────────────────────────────
resource "vercel_deployment" "production" {
  project_id = vercel_project.ecypro_frontend.id
  production = true

  git_source = {
    type   = "github"
    repo   = var.github_repo
    ref    = "main"
  }
}

# ── Variables ──────────────────────────────────────────────
variable "github_repo" {
  description = "GitHub repository in owner/repo format"
  type        = string
  default     = "ecypro/ecypro-premium-consulting"
}

variable "api_url" {
  description = "Backend API URL"
  type        = string
  default     = "https://api.ecypro.com"
}

variable "custom_domain" {
  description = "Custom domain (leave empty to skip)"
  type        = string
  default     = ""
}

variable "ga_tracking_id" {
  description = "Google Analytics tracking ID"
  type        = string
  default     = ""
}

# ── Outputs ────────────────────────────────────────────────
output "deployment_url" {
  value = vercel_deployment.production.url
}

output "project_id" {
  value = vercel_project.ecypro_frontend.id
}
