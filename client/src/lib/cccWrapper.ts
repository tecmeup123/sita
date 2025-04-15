/**
 * This is a wrapper around the @ckb-ccc/ccc library that handles browser compatibility issues
 */

// First, import our polyfills
import '../nodePolyfills.js';
import '../browserPolyfills.js';

// Then import the actual CKB library
import { ccc } from "@ckb-ccc/ccc";

// Export everything from the library
export { ccc };

// Add any browser-specific overrides if needed
// Example: 
// ccc.someBrowserSpecificFunction = () => { /* browser implementation */ };