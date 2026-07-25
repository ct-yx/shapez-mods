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
        var enumAngleToDirection = shapez.enumAngleToDirection;
        var enumUndergroundBeltVariants = shapez.enumUndergroundBeltVariants;
        var MetaUndergroundBeltBuilding = shapez.MetaUndergroundBeltBuilding;
        var HUDBuildingPlacerLogic = shapez.HUDBuildingPlacerLogic;
        var defaultBuildingVariant = shapez.defaultBuildingVariant;
        var Mod = shapez.Mod;

        // Constants
        var BELT_ID = "belt";
        var BELT_LAYER = "regular";

        // Read the live range table supplied by the game. Belt Speed Control
        // extends this array to tiers 3 and 4 and updates it when its range
        // sliders change, so this Mod deliberately never caches the values.
        function getTunnelTierForVariant(variant) {
            if (variant === defaultBuildingVariant) return 0;
            var tier2 = enumUndergroundBeltVariants && enumUndergroundBeltVariants.tier2;
            if (variant === tier2 || variant === "tier2") return 1;
            if (variant === "tier3") return 2;
            if (variant === "tier4") return 3;
            return -1;
        }

        function getAvailableTunnelCandidates(root, tunnel_class) {
            var ranges = shapez.globalConfig && shapez.globalConfig.undergroundBeltMaxTilesByTier;
            if (!Array.isArray(ranges) || !tunnel_class) return [];

            var available_variants;
            try {
                available_variants = tunnel_class.getAvailableVariants(root) || [];
            } catch (error) {
                return [];
            }

            var tier2 = enumUndergroundBeltVariants && enumUndergroundBeltVariants.tier2 || "tier2";
            var variants = [defaultBuildingVariant, tier2, "tier3", "tier4"];
            var candidates = [];
            for (var index = 0; index < variants.length; ++index) {
                var variant = variants[index];
                var tier = getTunnelTierForVariant(variant);
                var range = Number(ranges[tier]);
                if (tier < 0 || available_variants.indexOf(variant) < 0 || !Number.isFinite(range) || range < 1) {
                    continue;
                }
                candidates.push({ variant: variant, tier: tier, range: Math.floor(range) });
            }

            // Prefer the shortest actually sufficient tunnel. This still does
            // the right thing when a user gives an earlier tier a larger range
            // multiplier than a later tier.
            candidates.sort(function(a, b) {
                return a.range - b.range || a.tier - b.tier;
            });
            return candidates;
        }

        function getTunnelChoiceForDistance(candidates, distance) {
            for (var index = 0; index < candidates.length; ++index) {
                if (candidates[index].range >= distance) return candidates[index];
            }
            return null;
        }

        function getMaximumTunnelRange(candidates) {
            var maximum = 0;
            for (var index = 0; index < candidates.length; ++index) {
                maximum = Math.max(maximum, candidates[index].range);
            }
            return maximum;
        }

        function getRegularEntity(root, tile) {
            return root.map.getLayerContentXY(tile.x, tile.y, BELT_LAYER);
        }

        function entityAcceptsIncomingFrom(content, world_tile, world_direction) {
            var components = content && content.components;
            var static_entity = components && components.StaticMapEntity;
            var acceptor = components && components.ItemAcceptor;
            if (!static_entity || !acceptor || typeof acceptor.findMatchingSlot !== "function") {
                return false;
            }

            // ItemAcceptor slots are stored in local coordinates. Using both
            // worldToLocalTile and worldDirectionToLocal is what lets the
            // check work for rotated vanilla buildings and every width of the
            // Balancer Variants Mod.
            var local_tile = static_entity.worldToLocalTile(world_tile);
            var local_direction = typeof static_entity.worldDirectionToLocal === "function"
                ? static_entity.worldDirectionToLocal(world_direction)
                : world_direction;
            return !!acceptor.findMatchingSlot(local_tile, local_direction);
        }

        function isForwardBelt(content, rotation) {
            var components = content && content.components;
            var static_entity = components && components.StaticMapEntity;
            if (!static_entity || !components.Belt || typeof static_entity.getMetaBuilding !== "function") {
                return false;
            }
            var meta = static_entity.getMetaBuilding();
            return !!meta && meta.getId() === BELT_ID && static_entity.rotation === rotation;
        }

        function isUndergroundTunnel(content) {
            return !!(content && content.components && content.components.UndergroundBelt);
        }

        function canPlaceTunnelAt(placer, tunnel_class, tile, rotation, variant, rotation_variant) {
            var logic = placer.root && placer.root.logic;
            if (!logic || typeof logic.checkCanPlaceEntity !== "function" || typeof tunnel_class.createEntity !== "function") {
                return true;
            }

            try {
                var entity = tunnel_class.createEntity({
                    root: placer.root,
                    origin: tile,
                    rotation: rotation,
                    originalRotation: rotation,
                    rotationVariant: rotation_variant,
                    variant: variant,
                });
                return logic.checkCanPlaceEntity(entity, {});
            } catch (error) {
                return false;
            }
        }

        // Extended logic using $old to call original
        var auto_tunnel_logic = function(options) {
            var old_methods = options.$old;

            return {
                executeDirectionLockedPlacement: function() {
                    var current_building = this.currentMetaBuilding.get();
                    if (!current_building) return;

                    // For non-belt buildings, just call original (which handles drag-placement).
                    if (current_building.getId() !== BELT_ID) {
                        var originalExecute = old_methods.executeDirectionLockedPlacement || old_methods;
                        originalExecute.call(this);
                        return;
                    }

                    var path = this.computeDirectionLockPath();
                    if (!path || !path.length) return;

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

                            var tile_content = getRegularEntity(self.root, path_item.tile);
                            if (tile_content) {
                                var static_ent = tile_content.components.StaticMapEntity;
                                var is_belt = static_ent && static_ent.getMetaBuilding().getId() === BELT_ID;
                                var same_rotation = static_ent && static_ent.rotation === path_item.rotation;
                                if (!(is_belt && same_rotation || (skip = true, is_belt))) continue;
                            }

                            // Keep the original Smart Tunnel reward behavior for a turn, but
                            // use normal tunnel variants instead of the obsolete "smart" variant.
                            var can_try_after_turn = self.root.hubGoals.isRewardUnlocked("reward_smart_tunnel");
                            if ((!rotation_changed || can_try_after_turn) && !skip) {
                                var tunnel_end = self.tryPlaceAutoTunnels(path, idx);
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

                tryPlaceAutoTunnels: function(path_array, start_idx) {
                    var base_rotation = this.currentBaseRotation;
                    var next_idx = start_idx + 1;
                    var next_item = path_array[next_idx];
                    if (!next_item || next_item.rotation !== base_rotation) return null;

                    var world_direction = enumAngleToDirection[base_rotation];
                    var next_content = getRegularEntity(this.root, next_item.tile);
                    if (!next_content) return null;

                    // Do not hide a legitimate machine input (including any
                    // 4/5/8/10/16-way balancer input) behind a new tunnel.
                    if (entityAcceptsIncomingFrom(next_content, next_item.tile, world_direction)) {
                        return null;
                    }

                    // A forward belt is a normal continuation, not an obstacle.
                    // Existing tunnels are also a hard stop: never nest, bridge
                    // over, or replace a tunnel automatically.
                    if (isForwardBelt(next_content, base_rotation) || isUndergroundTunnel(next_content)) {
                        return null;
                    }

                    var tunnel_class = shapez.gMetaBuildingRegistry.findByClass(MetaUndergroundBeltBuilding);
                    var candidates = getAvailableTunnelCandidates(this.root, tunnel_class);
                    var maximum_range = getMaximumTunnelRange(candidates);
                    if (!tunnel_class || maximum_range < 2) return null;

                    var end_idx = null;
                    for (var check = next_idx; check < path_array.length; ++check) {
                        var item = path_array[check];
                        if (!item || item.rotation !== base_rotation) break;

                        var distance = check - start_idx;
                        if (distance > maximum_range) break;

                        var content = getRegularEntity(this.root, item.tile);
                        if (!content) {
                            // Stop at the first clear exit after one contiguous
                            // obstacle. This conservative rule avoids jumping
                            // over unrelated belts or nested tunnel networks.
                            end_idx = check;
                            break;
                        }

                        if (isUndergroundTunnel(content)) return null;
                        if (entityAcceptsIncomingFrom(content, item.tile, world_direction)) return null;
                        if (isForwardBelt(content, base_rotation)) return null;
                    }

                    if (end_idx === null) return null;
                    var choice = getTunnelChoiceForDistance(candidates, end_idx - start_idx);
                    if (!choice) return null;

                    // Preflight both endpoints before replacing the starting
                    // belt. This avoids a half-placed tunnel pair when a tile
                    // is protected, occupied by a non-replaceable building, or
                    // vetoed by another placement Mod.
                    if (!canPlaceTunnelAt(this, tunnel_class, path_array[start_idx].tile, base_rotation, choice.variant, 0)) {
                        return null;
                    }
                    if (!canPlaceTunnelAt(this, tunnel_class, path_array[end_idx].tile, base_rotation, choice.variant, 1)) {
                        return null;
                    }

                    var saved_rotation = this.currentBaseRotation;
                    var saved_variant = this.currentVariant.get();
                    var saved_building = this.currentMetaBuilding.get();
                    try {
                        this.currentMetaBuilding.set(tunnel_class);
                        this.currentBaseRotation = base_rotation;
                        this.currentVariant.set(choice.variant);
                        if (!this.tryPlaceCurrentBuildingAt(path_array[start_idx].tile)) return null;

                        this.currentBaseRotation = (base_rotation + 180) % 360;
                        this.currentVariant.set(choice.variant);
                        if (!this.tryPlaceCurrentBuildingAt(path_array[end_idx].tile)) return null;

                        return end_idx;
                    } catch (error) {
                        return null;
                    } finally {
                        this.currentBaseRotation = saved_rotation;
                        this.currentVariant.set(saved_variant);
                        this.currentMetaBuilding.set(saved_building);
                    }
                },
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
                description: "Uses the live underground-belt range table for conservative automatic tunnel placement during direction-locked belt building.",
                website: "https://mod.io/g/shapez/m/auto-tunnels-remake",
                id: "auto tunnels Remake",
                version: "1.1.0",
                author: "erjiu, minimax & Sense_101; maintained by ct-yx & Codex",
                settings: {},
                modId: "6090358",
            }
        );
    })();
})();
