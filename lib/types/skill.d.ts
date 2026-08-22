/**
 * Bundled skill registration: reads SKILL.md from packaged assets and
 * registers it as a runtime skill via ctx.skills.register().
 *
 * @module @deepseek-ai/dsh-computer-use/skill
 */
import type { Context } from '@deepseek-ai/cordis';
/**
 * Register the computer-use-vision skill as a runtime skill.
 * The skill body is read from assets/SKILL.md at apply() time.
 * resourceBase points to the assets directory so knowledge/ paths resolve.
 * @returns the disposal function from ctx.skills.register().
 */
export declare function registerSkill(ctx: Context): () => void;
//# sourceMappingURL=skill.d.ts.map