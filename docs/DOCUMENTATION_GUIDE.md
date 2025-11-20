# Documentation Guide

Quick reference for all Stockmeter documentation.

## 📖 Essential Documentation (Root Directory)

These are the core documents you'll need most often:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[README.md](../README.md)** | Main project overview | First time setup, general reference |
| **[QUICKSTART.md](../QUICKSTART.md)** | 10-minute quick start | Getting started quickly |
| **[DEPLOYMENT.md](../DEPLOYMENT.md)** | Production deployment | Deploying to Google Cloud |
| **[TROUBLESHOOTING.md](../TROUBLESHOOTING.md)** | Common issues | When you encounter problems |

## 📚 Additional Documentation (docs/ Directory)

Detailed guides and reference materials:

### Project Information
- **[ABOUT.md](ABOUT.md)** - Comprehensive technical overview, architecture, and workflows
- **[VERSIONS.md](VERSIONS.md)** - Complete list of all dependencies and their versions

### Setup & Validation
- **[READY_TO_USE.md](READY_TO_USE.md)** - Detailed 3-step setup guide with validation
- **[PREFLIGHT_CHECKLIST.md](PREFLIGHT_CHECKLIST.md)** - Complete checklist for local and cloud deployment
- **[APPLICATION_STATUS.md](APPLICATION_STATUS.md)** - Current application status and validation results

### Testing
- **[INTEGRATION_TEST_RESULTS.md](INTEGRATION_TEST_RESULTS.md)** - Integration test results and reports

## 🛠️ Scripts (scripts/ Directory)

Automation scripts for validation and testing:

| Script | Purpose |
|--------|---------|
| `validate-setup.sh` | Validates local development environment |
| `test-local.sh` | Runs comprehensive local tests |
| `validate-cloud.sh` | Validates Google Cloud deployment setup |
| `health-check.sh` | Quick health check for running services |

## 🗂️ Project Structure

```
stockmeter-mvp/
├── README.md                    # ⭐ Start here
├── QUICKSTART.md                # ⭐ Quick setup
├── DEPLOYMENT.md                # ⭐ Cloud deployment
├── TROUBLESHOOTING.md           # ⭐ Problem solving
│
├── docs/                        # Additional documentation
│   ├── README.md                # Documentation index
│   ├── ABOUT.md                 # Technical overview
│   ├── VERSIONS.md              # Version reference
│   ├── READY_TO_USE.md          # Detailed setup
│   ├── PREFLIGHT_CHECKLIST.md   # Deployment checklist
│   ├── APPLICATION_STATUS.md    # Status report
│   └── INTEGRATION_TEST_RESULTS.md
│
├── scripts/                     # Automation scripts
│   ├── validate-setup.sh
│   ├── test-local.sh
│   ├── validate-cloud.sh
│   └── health-check.sh
│
├── backend/                     # Backend application
├── frontend/                    # Frontend application
└── .kiro/specs/                 # Feature specifications
```

## 🎯 Quick Navigation

**I want to...**

- **Get started quickly** → [QUICKSTART.md](../QUICKSTART.md)
- **Understand the architecture** → [docs/ABOUT.md](ABOUT.md)
- **Deploy to production** → [DEPLOYMENT.md](../DEPLOYMENT.md)
- **Check all versions** → [docs/VERSIONS.md](VERSIONS.md)
- **Validate my setup** → Run `./scripts/validate-setup.sh`
- **Fix an issue** → [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- **See current status** → [docs/APPLICATION_STATUS.md](APPLICATION_STATUS.md)

## 📝 Documentation Standards

All documentation follows these principles:
- **Clear and concise** - No unnecessary verbosity
- **Actionable** - Includes specific commands and steps
- **Up-to-date** - Reflects current versions and setup
- **Well-organized** - Easy to find what you need

## 🔄 Keeping Documentation Updated

When making changes:
1. Update relevant documentation
2. Check version numbers in VERSIONS.md
3. Update APPLICATION_STATUS.md if needed
4. Test all commands and scripts

---

**Last Updated:** December 2024
