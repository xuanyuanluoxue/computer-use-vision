/**
 * Package-owned invariant companion for @deepseek-ai/dsh-computer-use.
 * Registers the manifest name for the runtime diagnostics gate.
 * @module @deepseek-ai/dsh-computer-use/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-computer-use';
/**
 * Install package-level runtime invariant.
 * No runtime invariant beyond the manifest name: this package registers tools
 * and a skill through the standard capability seams.
 */
export function install() {
    // No runtime invariant: tool registrations are verified by the tool
    // registry's own disposal/HMR-safety test. Skill registration is verified
    // by the skill-filesystem or runtime provider discovery.
    void PACKAGE_NAME;
}
//# sourceMappingURL=invariant.js.map