// @ts-nocheck
const METADATA = {
    website: "https://github.com/ct-yx/shapez-mods",
    author: "Asynic",
    name: "Belt Speed ×10",
    version: "1.0.0",
    id: "belt-speed-x10",
    description: "Makes every belt and underground belt tier move items 10 times faster.",
    minimumGameVersion: ">=1.5.0",
    doesNotAffectSavegame: true,
};

/**
 * The game derives every belt tier's throughput from HubGoals. Wrapping these
 * two methods preserves the normal upgrade progression while multiplying each
 * tier's effective item movement and injection speed by ten.
 */
class Mod extends shapez.Mod {
    init() {
        this.modInterface.replaceMethod(shapez.HubGoals, "getBeltBaseSpeed", oldMethod => {
            return oldMethod() * 10;
        });

        this.modInterface.replaceMethod(shapez.HubGoals, "getUndergroundBeltBaseSpeed", oldMethod => {
            return oldMethod() * 10;
        });
    }
}
