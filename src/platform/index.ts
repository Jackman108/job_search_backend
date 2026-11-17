/** Platform public surface (phase 1′ — growing). */
export { redact } from './logging/redact.js';
export {
    decryptHhPassword,
    encryptHhPassword,
    evaluateHhCredKey,
    HH_CRED_ENC_VERSION,
    resetHhCredKeyCache,
    resolveHhCredKey,
} from './crypto/hhCredCrypto.js';
