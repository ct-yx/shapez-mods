(() => {
    var webpack_modules = {
        6684: function(module, exports, webpack_require) {
            "use strict";
            webpack_require.d(exports, { Z: function() { return css_string; } });
            var css_loader = webpack_require(8081),
                make_hot_module = webpack_require.n(css_loader),
                css_processor = webpack_require(3645),
                css_list = webpack_require.n(css_processor)()(make_hot_module());
            css_list.push([module.id, "", ""]);
            var css_string = css_list.toString();
        },

        3645: function(module) {
            "use strict";
            module.exports = function(css_template) {
                var list = [];
                list.toString = function() {
                    return list.map(function(item) {
                        var result = "",
                            has_layer = item[5] !== undefined;
                        if (item[4]) result += "@supports (" + item[4] + ") {";
                        if (item[2]) result += "@media " + item[2] + " {";
                        if (has_layer) result += "@layer" + (item[5].length > 0 ? " " + item[5] : "") + " {";
                        result += css_template(item);
                        if (has_layer) result += "}";
                        if (item[2]) result += "}";
                        if (item[4]) result += "}";
                        return result;
                    }).join("");
                };
                list.i = function(test, condition, deduplicate, supports, layer) {
                    if (typeof test === "string") test = [[null, test, undefined]];
                    var seen = {};
                    if (deduplicate) for (var idx = 0; idx < list.length; idx++) {
                        var id = list[idx][0];
                        if (id !== null) seen[id] = true;
                    }
                    for (var i = 0; i < test.length; i++) {
                        var entry = [].concat(test[i]);
                        if (!(deduplicate && seen[entry[0]])) {
                            if (layer !== undefined) {
                                if (entry[5] !== undefined) {
                                    entry[1] = "@layer" + (entry[5].length > 0 ? " " + entry[5] : "") + " {" + entry[1] + "}";
                                }
                                entry[5] = layer;
                            }
                            if (condition) {
                                if (entry[2]) {
                                    entry[1] = "@media " + entry[2] + " {" + entry[1] + "}";
                                    entry[2] = condition;
                                } else {
                                    entry[2] = condition;
                                }
                            }
                            if (supports) {
                                if (entry[4]) {
                                    entry[1] = "@supports (" + entry[4] + ") {" + entry[1] + "}";
                                    entry[4] = supports;
                                } else {
                                    entry[4] = "" + supports;
                                }
                            }
                            list.push(entry);
                        }
                    }
                };
                return list;
            };
        },

        8081: function(module) {
            "use strict";
            module.exports = function(module) {
                return module[1];
            };
        },
    };

    var installed_modules = {};

    function webpack_require(module_id) {
        var cached = installed_modules[module_id];
        if (cached !== undefined) return cached.exports;
        var module_wrapper = installed_modules[module_id] = { id: module_id, exports: {} };
        return webpack_modules[module_id](module_wrapper, module_wrapper.exports, webpack_require), module_wrapper.exports;
    }

    webpack_require.n = function(module) {
        var getter = module && module.__esModule ? function() { return module.default; } : function() { return module; };
        webpack_require.d(getter, { a: getter });
        return getter;
    };

    webpack_require.d = function(target, getters) {
        for (var key in getters) if (Object.prototype.hasOwnProperty.call(getters, key) && !Object.prototype.hasOwnProperty.call(target, key)) {
            Object.defineProperty(target, key, { enumerable: true, get: getters[key] });
        }
    };

    webpack_require.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); };

    (function() {
        // shapez imports
        var gMetaBuildingRegistry = shapez.gMetaBuildingRegistry;
        var enumAngleToDirection = shapez.enumAngleToDirection;
        var Vector = shapez.Vector;
        var MetaBalancerBuilding = shapez.MetaBalancerBuilding;
        var MetaBeltBuilding = shapez.MetaBeltBuilding;
        var enumUndergroundBeltVariants = shapez.enumUndergroundBeltVariants;
        var MetaUndergroundBeltBuilding = shapez.MetaUndergroundBeltBuilding;
        var UndergroundBeltComponent = shapez.UndergroundBeltComponent;
        var Entity = shapez.Entity;
        var HUDBuildingPlacerLogic = shapez.HUDBuildingPlacerLogic;
        var defaultBuildingVariant = shapez.defaultBuildingVariant;
        var enumHubGoalRewards = shapez.enumHubGoalRewards;
        var Mod = shapez.Mod;

        // Constants
        var BELT_ID = "belt";
        var BELT_LAYER = "regular";
        var TUNNEL_DISTANCES = [5, 9, 7];

        // Extended logic using $old to call original
        var auto_tunnel_logic = function(options) {
            var originalExecute = options.$old;

            return {
                executeDirectionLockedPlacement: function() {
                    var current_building = this.currentMetaBuilding.get();
                    if (!current_building) return;

                    // For non-belt buildings, just call original (which handles drag-placement)
                    if (current_building.getId() !== BELT_ID) {
                        originalExecute.call(this);
                        return;
                    }

                    // === BELT PLACEMENT WITH AUTO TUNNELS ===
                    var path = this.computeDirectionLockPath();
                    var placed = false;
                    var skip = false;

                    var self = this;
                    this.root.logic.performBulkOperation(function() {
                        self.currentBaseRotation = path[0].rotation;

                        for (var idx = 0; idx < path.length; idx++) {
                            var path_item = path[idx];
                            var rotation_changed = false;

                            if (self.currentBaseRotation !== path_item.rotation) {
                                rotation_changed = true;
                                self.currentBaseRotation = path_item.rotation;
                            }

                            var tile_content = self.root.map.getLayerContentXY(path_item.tile.x, path_item.tile.y, BELT_LAYER);

                            if (tile_content) {
                                var static_ent = tile_content.components.StaticMapEntity;
                                var is_belt = static_ent.getMetaBuilding().getId() === BELT_ID;
                                var same_rotation = static_ent.rotation === path_item.rotation;
                                if (!(is_belt && same_rotation || (skip = true, is_belt))) continue;
                            }

                            var next_item = path[idx + 1];
                            var next_content = next_item ? self.root.map.getLayerContentXY(next_item.tile.x, next_item.tile.y, BELT_LAYER) : null;
                            var has_smart = self.root.hubGoals.isRewardUnlocked("reward_smart_tunnel");

                            if ((!rotation_changed || has_smart) && !skip) {
                                var tunnel_end = self.tryPlaceAutoTunnels(next_content, path, idx, rotation_changed && has_smart);
                                if (tunnel_end !== null) {
                                    placed = true;
                                    skip = false;
                                    idx = tunnel_end;
                                    continue;
                                }
                            }

                            if (self.tryPlaceCurrentBuildingAt(path_item.tile)) {
                                placed = true;
                                skip = false;
                            }
                        }
                    });

                    if (placed) this.root.soundProxy.playUi(current_building.getPlacementSound());
                },

                tryPlaceAutoTunnels: function(next_entity, path_array, start_idx, need_smart) {
                    if (!next_entity) return null;

                    var base_rotation = this.currentBaseRotation;
                    var static_entity = next_entity.components.StaticMapEntity;

                    // If the next tile is a balancer with the same rotation, skip tunnel placement
                    var is_balancer = static_entity.getMetaBuilding().getId() === gMetaBuildingRegistry.findByClass(MetaBalancerBuilding).getId();
                    if (is_balancer && static_entity.rotation === base_rotation) {
                        return null;
                    }

                    var item_acceptor = next_entity.components.ItemAcceptor;
                    var local_tile = static_entity.worldToLocalTile(path_array[start_idx + 1].tile);

                    if (item_acceptor && item_acceptor.findMatchingSlot(local_tile, enumAngleToDirection[base_rotation])) {
                        return null;
                    }

                    var belt_class = gMetaBuildingRegistry.findByClass(MetaBeltBuilding);
                    var tunnel_class = gMetaBuildingRegistry.findByClass(MetaUndergroundBeltBuilding);

                    var max_dist = this.root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_underground_belt_tier_2) ? TUNNEL_DISTANCES[1] : TUNNEL_DISTANCES[0];
                    if (need_smart) max_dist = TUNNEL_DISTANCES[2];

                    var end_idx = null;
                    var had_gap = true;
                    var found_invalid = true;

                    for (var check = start_idx + max_dist; check > start_idx; check--) {
                        var item = path_array[check];
                        if (!item || item.rotation !== base_rotation) continue;

                        var tile = item.tile;
                        var content = this.root.map.getLayerContentXY(tile.x, tile.y, BELT_LAYER);

                        if (content) {
                            had_gap = false;
                            var content_static = content.components.StaticMapEntity;
                            var content_tunnel = content.components.UndergroundBelt;

                            if (content_static.getMetaBuilding().getId() !== BELT_ID || content_static.rotation !== base_rotation) {
                                found_invalid = false;
                            }

                            var tier = end_idx !== null && end_idx - start_idx > TUNNEL_DISTANCES[0] ? 1 : 0;
                            var rot_ok = content_static.rotation === base_rotation || content_static.rotation === (base_rotation + 180) % 360;
                            if (content_tunnel && content_tunnel.tier === tier && rot_ok) return null;
                        } else {
                            if (had_gap) end_idx = check;
                            else had_gap = true;
                        }
                    }

                    if (found_invalid) return null;

                    if (end_idx !== null && base_rotation === path_array[end_idx].rotation) {
                        var variant = need_smart ? "smart" : (end_idx - start_idx > TUNNEL_DISTANCES[0] ? enumUndergroundBeltVariants.tier2 : defaultBuildingVariant);

                        // Save state for rollback
                        var saved_rotation = this.currentBaseRotation;
                        var saved_variant = this.currentVariant.get();
                        var saved_building = this.currentMetaBuilding.get();

                        try {
                            // Place entry tunnel
                            this.currentMetaBuilding.set(tunnel_class);
                            this.currentBaseRotation = base_rotation;
                            this.currentVariant.set(variant);
                            var first_ok = this.tryPlaceCurrentBuildingAt(path_array[start_idx].tile);

                            // Place exit tunnel (opposite rotation)
                            this.currentBaseRotation = (base_rotation + 180) % 360;
                            var second_ok = this.tryPlaceCurrentBuildingAt(path_array[end_idx].tile);

                            if (!first_ok || !second_ok) return null;

                            // Success - restore state
                            this.currentBaseRotation = saved_rotation;
                            this.currentVariant.set(saved_variant);
                            this.currentMetaBuilding.set(belt_class);

                            return end_idx;
                        } catch (e) {
                            // Error - rollback
                            this.currentBaseRotation = saved_rotation;
                            this.currentVariant.set(saved_variant);
                            this.currentMetaBuilding.set(saved_building);
                            return null;
                        }
                    }

                    return null;
                }
            };
        };

        // Register mod
        window.$shapez_registerMod(
            class extends Mod {
                init() {
                    this.modInterface.registerCss(webpack_require(6684).Z);
                    this.modInterface.extendClass(HUDBuildingPlacerLogic, auto_tunnel_logic);
                }
            },
            {
                name: "Auto Tunnels",
                description: "when you are building belt across another belf with shift , build tunnel instead of the belt that you are building",
                website: "https://mod.io/g/shapez/m/auto-tunnels-remake",
                id: "auto tunnels Remake",
                version: "1.0.4",
                author: "erjiu (modified by minimax, original by Sense_101)",
                settings: {},
                modId: "6090358",
            }
        );
    })();
})();