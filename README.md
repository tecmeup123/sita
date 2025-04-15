# SiTa Minter - BIFI UNLEASHED

A decentralized web application for creating Bitcoin tokens powered by Nervos Network RGB++ protocol. SiTa Minter offers a simple, intuitive interface for token creation with comprehensive security features and multiple wallet support.

## Documentation

All project documentation can be found in the `/docs` directory:

- [Complete Project Overview](./docs/README.md)
- [Update Guides](./docs/update-guides/index.md) - Guides for updating various components
- [VPS Installation Guide](./docs/deployment/vps-installation-guide.md) - Comprehensive instructions for deploying on a VPS
- [JoyID Developer Integration Guide](./docs/JOYID-DEVELOPER-INTEGRATION-GUIDE.md)
- [JoyID Installation Guide](./docs/JOYID-INSTALLATION-GUIDE.md)
- [Blockchain Security Implementation](./docs/BLOCKCHAIN-SECURITY.md)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Features

- Create Bitcoin tokens powered by the Nervos Network RGB++ protocol
- Multiple wallet support via CCC connector (JoyID, MetaMask, UTXO Global)
- Multi-language support (English, Chinese, Spanish, Portuguese, French, Italian)
- Comprehensive security features (CSP, XSS protection, CSRF validation, rate limiting)
- User-friendly token creation workflow with intuitive interface
- Bitcoin-focused branding with "BIFI UNLEASHED" theme

## Technology Stack

- React frontend with TypeScript
- CCC wallet connector with multiple wallet support
- Nervos CKB blockchain
- RGB++ token standard
- Express.js backend with security middleware
- PostgreSQL database for transaction logging and security events