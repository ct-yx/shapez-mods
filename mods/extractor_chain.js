/* eslint-disable prettier/prettier */

// @ts-nocheck
const METADATA = {
    website: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    author: "emanresu",
    name: "Chain Chainable Extractors",
    version: "1",
    id: "chain_chain_extractor",
    description: "Makes chainable extractors chain into each other when dragged",
    minimumGameVersion: ">=1.5.0",
    modId: "2257076"
};

class Mod extends shapez.Mod {
    init() {
        this.modInterface.replaceMethod(
            shapez.HUDBuildingPlacerLogic, "onMouseMove", function ($orig, pos) {
                pos = [...pos][0];
                //console.log(pos)
                if (this.currentMetaBuilding.get()?.id == 'miner' && this.currentVariant.get() == 'chainable' && this.lastDragTile) {
                    // Mostly copied from the original method
                    if (this.root.camera.getIsMapOverlayActive()) {
                        return;
                    }
                    if (this.isDirectionLockActive) {
                        return;
                    }
                    const oldPos = this.lastDragTile;
                    let newPos = this.root.camera.screenToWorld(pos).toTileSpace();
                    if (this.root.camera.desiredCenter) {
                        this.lastDragTile = newPos;
                        return;
                    }
                    if (!oldPos.equals(newPos)) {
                        let x0 = oldPos.x;
                        let y0 = oldPos.y;
                        let x1 = newPos.x;
                        let y1 = newPos.y;

                        var dx = Math.abs(x1 - x0);
                        var dy = Math.abs(y1 - y0);
                        var sx = x0 < x1 ? 1 : -1;
                        var sy = y0 < y1 ? 1 : -1;
                        var err = dx - dy;
                        while (this.currentMetaBuilding.get()) {
                            this.tryPlaceCurrentBuildingAt(new shapez.Vector(x0, y0))
                            if ((x0 === x1 && y0 === y1)) break;
                            var e2 = 2 * err;

                            let current = this.root.map.getLayerContentXY(x0, y0, this.root.currentLayer);

                            let flip = 1;
                            if (this.root.keyMapper.getBinding(shapez.KEYMAPPINGS.placementModifiers.placeInverse).pressed) {
                                flip = -1;
                            }
                            if (e2 > -dy) {
                                err -= dy;
                                x0 += sx;

                                let rot = 180 - flip * 90 * Math.sign(sx);
                                this.currentBaseRotation = rot;
                                if (flip == 1) {
                                    current.components.StaticMapEntity.rotation = rot
                                    this.root.signals.entityChanged.dispatch(current);
                                }
                            }
                            if (e2 < dx) {
                                err += dx;
                                y0 += sy;

                                let rot = 90 + flip * 90 * Math.sign(sy);
                                this.currentBaseRotation = rot;
                                if (flip == 1) {
                                    current.components.StaticMapEntity.rotation = rot
                                    this.root.signals.entityChanged.dispatch(current);
                                }
                            }
                        }
                    }
                    this.lastDragTile = newPos;
                    return shapez.STOP_PROPAGATION;
                } else $orig(pos);
            }
        );
    }
}