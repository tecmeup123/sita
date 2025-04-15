# JoyID Wallet Installation Guide

JoyID is a user-friendly blockchain wallet that provides secure and seamless access to the Nervos CKB network. This guide will walk you through the process of installing and setting up your JoyID wallet to use with SITA MINTER and other blockchain applications.

## Table of Contents

1. [Introduction to JoyID](#introduction-to-joyid)
2. [System Requirements](#system-requirements)
3. [Installation Guide](#installation-guide)
   - [Mobile Installation](#mobile-installation)
   - [Browser Extension](#browser-extension)
4. [Setting Up Your Wallet](#setting-up-your-wallet)
5. [Connecting to SITA MINTER](#connecting-to-sita-minter)
6. [Adding CKB to Your Wallet](#adding-ckb-to-your-wallet)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

## Introduction to JoyID

JoyID is a next-generation blockchain wallet that doesn't require seed phrases. Instead, it uses WebAuthn (the same technology used for fingerprint and face recognition) to create a secure wallet that's tied to your device's biometric security. This makes it much easier to use while maintaining high security standards.

Key features:
- No seed phrases to remember or lose
- Biometric security (fingerprint/face recognition)
- Simple and intuitive interface
- Support for Nervos CKB blockchain
- Complete control over your assets

## System Requirements

**Mobile:**
- iOS 14.0 or later (iPhone 6s or newer)
- Android 8.0 or later with fingerprint or face recognition capabilities

**Desktop:**
- Chrome 89 or later
- Firefox 86 or later
- Edge 89 or later
- Safari 14 or later
- Operating system with WebAuthn support

## Installation Guide

### Mobile Installation

1. **Install from App Store/Google Play**
   - For iOS: Visit the [App Store](https://apps.apple.com/app/joyid-wallet/id1626612571) and search for "JoyID Wallet"
   - For Android: Visit the [Google Play Store](https://play.google.com/store/apps/details?id=id.joy.app) and search for "JoyID Wallet"
   - Alternatively, scan this QR code from the JoyID website: [https://app.joy.id](https://app.joy.id)

2. **Launch the App**
   - Open the JoyID app after installation
   - You'll see a welcome screen explaining the key features of JoyID

3. **Accept Terms & Conditions**
   - Review and accept the Terms of Service and Privacy Policy
   - These documents explain how JoyID protects your data and privacy

### Browser Extension

JoyID primarily works as a mobile app, not a browser extension. When using JoyID with web applications:

1. The web application will display a QR code
2. Scan this QR code with your JoyID mobile app
3. Authenticate using your biometrics
4. Complete transactions directly from your mobile device

This approach provides better security than traditional browser extensions.

## Setting Up Your Wallet

1. **Create Your Wallet**
   - Tap "Create New Wallet" on the welcome screen
   - Follow the on-screen instructions to set up biometric authentication
   - Your device will prompt you to use your fingerprint or face recognition

2. **Enable Device Security**
   - JoyID will check if your device has screen lock enabled
   - If not, you'll be prompted to set it up for additional security

3. **Setup Device Backup (Recommended)**
   - JoyID will offer to set up a device backup
   - This creates a backup of your wallet on another device (like another phone or tablet)
   - Follow the on-screen instructions to scan the QR code with your backup device

4. **Set Your Display Name**
   - Choose a display name for your wallet
   - This name is only for your reference and isn't shared publicly

5. **Wallet Creation Complete**
   - Your JoyID wallet is now ready to use
   - You'll see your wallet address for the Nervos CKB network

## Connecting to SITA MINTER

1. **Visit SITA MINTER Website**
   - Open your web browser and navigate to the SITA MINTER application
   - Click on the "Connect Wallet" button

2. **Select Network**
   - Choose between "Mainnet" or "Testnet"
   - For your first experience, we recommend using Testnet

3. **Scan QR Code**
   - A QR code will appear on your screen
   - Open your JoyID app on your mobile device
   - Tap the scan icon in the top-right corner of the JoyID app
   - Scan the QR code displayed on the SITA MINTER website

4. **Authorize Connection**
   - JoyID will ask you to authorize the connection to SITA MINTER
   - Review the connection details
   - Confirm with your biometric authentication (fingerprint or face)

5. **Connection Complete**
   - Once authorized, you'll see your wallet is connected in SITA MINTER
   - Your wallet address will be displayed in the application
   - You're now ready to create tokens on the Nervos CKB network!

## Adding CKB to Your Wallet

To create tokens and perform transactions on the Nervos network, you'll need some CKB tokens:

### For Testnet (Free)

1. **Use the CKB Testnet Faucet**
   - Inside the JoyID app, navigate to the Assets tab
   - Tap on CKB
   - Select "Get Testnet CKB"
   - Follow the instructions to receive free testnet CKB

2. **Alternative Faucet**
   - Visit [https://faucet.nervos.org/](https://faucet.nervos.org/)
   - Enter your CKB testnet address (starts with "ckt")
   - Complete the CAPTCHA and request testnet CKB
   - You should receive testnet CKB within a few minutes

### For Mainnet (Purchase Required)

1. **Purchase from Exchanges**
   - Create an account on an exchange that lists CKB like [BitMart](https://www.bitmart.com/invite/q6Y7xj/en)
   - Complete the exchange's KYC process
   - Purchase CKB tokens using your preferred payment method
   - Withdraw the CKB to your JoyID wallet address (starts with "ckb")

2. **Receive from Another Wallet**
   - If you already have CKB in another wallet, you can send it to your JoyID wallet
   - In JoyID, tap on CKB in the Assets tab
   - Tap "Receive" to display your wallet address
   - Use this address to send CKB from your other wallet

## Troubleshooting

### Common Issues and Solutions

**"Cannot Access Camera"**
- Ensure JoyID has permission to access your camera
- Go to your device settings, find JoyID in the apps list, and enable camera permissions

**"Biometric Authentication Failed"**
- Make sure your finger or face is properly positioned
- Clean your fingerprint sensor or camera
- Try using an alternative registered biometric if available

**"Connection Failed" When Scanning QR Code**
- Ensure your internet connection is stable
- Make sure the entire QR code is visible and well-lit
- Try refreshing the webpage to generate a new QR code

**"Transaction Failed" or "Insufficient Balance"**
- Check that you have enough CKB in your wallet (including for transaction fees)
- For testnet, request more free CKB from the faucet
- For mainnet, you may need to add more CKB to your wallet

**"App Crashes When Opening"**
- Ensure your device meets the minimum requirements
- Update the JoyID app to the latest version
- Try restarting your device

### Contacting Support

If you encounter issues that aren't resolved by the troubleshooting steps above:

1. Visit the [JoyID Help Center](https://joy.id/help)
2. Join the [JoyID Telegram community](https://t.me/joinchat/joYL7QB7XX9kZTRk)
3. Email support at support@joy.id

## Security Best Practices

1. **Protect Your Device**
   - Always use a strong screen lock (PIN, pattern, or password)
   - Keep your device's operating system and apps updated
   - Install a reputable antivirus/anti-malware app on your device

2. **Backup Your Wallet**
   - Set up device backup within JoyID to another trusted device
   - Store backup devices in physically secure locations

3. **Be Aware of Phishing**
   - Only download JoyID from official app stores
   - Verify the URLs of websites before connecting your wallet
   - Never share your biometric data with anyone

4. **Transaction Safety**
   - Always verify transaction details before confirming
   - Start with small amounts when using new applications
   - Be extremely cautious with projects that require unusual permissions

5. **Network Security**
   - Use secure and trusted internet connections
   - Avoid connecting your wallet on public or unsecured WiFi networks
   - Consider using a VPN for additional security

---

By following this installation guide, you'll be able to set up your JoyID wallet and connect it to SITA MINTER to create and manage your tokens on the Nervos CKB blockchain securely and easily. If you have any questions or need further assistance, please refer to our [FAQ section](https://sita-minter.app/faq) or contact our support team.

Happy token creation with SITA MINTER!