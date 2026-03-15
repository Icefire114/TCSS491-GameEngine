import { AnimationState, Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Vec2 } from "../../engine/Vec2.js";
import { DrawLayer } from "../../engine/types.js";
import { Mountain } from "./mountain.js";
import { Player } from "./player.js";
import { Zombie } from "../zombies/Zombie.js";
import { IceBeamBullet } from "./bullets/IceBeamBullet.js";

export class Boss extends Zombie {
    sprite: ImagePath = new ImagePath("res/img/zombies/Boss zombie/boss running.png");

    // --- Power attack ---
    powerDamage: number;
    powerCooldown: number;    // seconds between power attacks
    private powerTimer = 0;
    private powerWindUp = false;
    private powerWindUpTimer = 0;
    private powerWindUpDuration = 0; // pause before power hit lands
    private beamTimer = 0;
    private readonly BEAM_DURATION = 3; // seconds
    private beamFireTimer = 0;
    private readonly BEAM_FIRE_INTERVAL = 0.1; // seconds between shots
    private attackOffsetX = 0;
    private readonly ATTACK_AIR_HEIGHT = 5;
    private readonly ATTACK_BEHIND_BUFFER = 30;
    private readonly ATTACK_DRIFT_SPEED = 6; // units/sec drift left
    private readonly ATTACK_MAX_BEHIND = 30; // max units behind player
    private readonly ATTACK_LEFT_MARGIN = 10; // units from left edge of screen
    private readonly ATTACK_LEFT_SHIFT = 10; // extra left shift during power attack (air only)
    private readonly ATTACK_AIR_LERP = 3; // higher = snappier, lower = smoother
    private powerOutroTimer = 0;
    private powerOutroDuration = 0;

    public maxHealth: number;

    constructor(pos?: Vec2, wave: number = 1) {
        const tag: string = "boss";
        const attack_range: number = 20;
        const attack_cooldown: number = 1.5; // seconds between attacks
        const run_range: number = 999;       // boss always runs
        const scaleFactor = 1 + (wave - 1) * 0.4; // scale factor +40% for each wave
        const health: number = 1500 * scaleFactor;
        const reward: number = 0;            // no currency reward for boss
        const walk_speed: number = 35 * scaleFactor;
        const run_speed: number = 35 * scaleFactor;
        const player_damage_amount: number = 15 * scaleFactor; // normal damage

        const physicsCollider = new BoxCollider(15, 20);
        const animator: Animator = new Animator([
            [
                {
                    sprite: new ImagePath("res/img/zombies/Boss zombie/boss running.png"),
                    frameHeight: 504,
                    frameWidth: 518.3125,
                    frameCount: 16
                },
                AnimationState.IDLE
            ],
            [
                {
                    sprite: new ImagePath("res/img/zombies/Boss zombie/boss running.png"),
                    frameHeight: 504,
                    frameWidth: 518.3125,
                    frameCount: 16
                },
                AnimationState.WALK_L
            ],
            [
                {
                    sprite: new ImagePath("res/img/zombies/Boss zombie/boss running.png"),
                    frameHeight: 504,
                    frameWidth: 518.3125,
                    frameCount: 16
                },
                AnimationState.WALK_R
            ],
            [
                {
                    sprite: new ImagePath("res/img/zombies/Boss zombie/boss running.png"),
                    frameHeight: 504,
                    frameWidth: 518.3125,
                    frameCount: 16
                },
                AnimationState.RUN
            ],
            [
                {
                    sprite: new ImagePath("res/img/zombies/Boss zombie/boss attack.png"),
                    frameHeight: 400,
                    frameWidth: 539.375,
                    frameCount: 16,
                    offestX: 0,
                    forceScaleToSize: new Vec2(22, 19)
                },
                AnimationState.ATTACK
            ],
            [
                {
                    sprite: new ImagePath("res/img/zombies/Boss zombie/boss powerup start transition.png"),
                    frameHeight: 534,
                    frameWidth: 503.375,
                    frameCount: 16
                },
                AnimationState.HIT
            ],
            [
                {
                    sprite: new ImagePath("res/img/zombies/Boss zombie/boss powerup.png"),
                    frameHeight: 534,
                    frameWidth: 502.3333333333,
                    frameCount: 6
                },
                AnimationState.RELOAD
            ],
            [
                {
                    sprite: new ImagePath("res/img/zombies/Boss zombie/boss powerup end transition.png"),
                    frameHeight: 534,
                    frameWidth: 503.375,
                    frameCount: 16
                },
                AnimationState.FALL
            ]
        ], new Vec2(physicsCollider.width, physicsCollider.height));

        super(tag, physicsCollider, animator, attack_range, attack_cooldown, run_range, health, reward, walk_speed, run_speed, player_damage_amount, pos);
        this.maxHealth = health;

        this.powerDamage = 2 * scaleFactor;
        this.powerCooldown = Math.max(3, 7 - (wave - 1));
        this.powerTimer = this.powerCooldown;

        this.powerWindUpDuration = 16 / this.animator.ANIMATION_FPS;
        this.powerOutroDuration = 16 / this.animator.ANIMATION_FPS;
    }

    protected _onUpdate(keys: { [key: string]: boolean }, deltaTime: number, player: Player, mountain: Mountain, distance: number, currentTime: number): void {
        // --- Outro: still shoot during end transition ---
        if (this.powerOutroTimer > 0) {
            this.beamFireTimer -= deltaTime;
            this.updateAirPosition(deltaTime, player, mountain, false);

            if (this.beamFireTimer <= 0) {
                this.fireBeamAtPlayer(player);
                this.beamFireTimer = this.BEAM_FIRE_INTERVAL;
            }
            return;
        }
        
        // --- Active beam: keep firing toward player ---
        if (this.beamTimer > 0) {
            this.beamTimer -= deltaTime;
            this.beamFireTimer -= deltaTime;
            this.updateAirPosition(deltaTime, player, mountain, true);

            if (this.beamTimer <= 0) {
                this.beamTimer = 0;
                if (this.powerOutroTimer <= 0) {
                    this.powerOutroTimer = this.powerOutroDuration;
                }
                return;
            }

            if (this.beamFireTimer <= 0) {
                this.fireBeamAtPlayer(player);
                this.beamFireTimer = this.BEAM_FIRE_INTERVAL;
            }
            return;
        }

        // --- Tick power attack cooldown ---
        this.powerTimer -= deltaTime;

        // --- Power wind-up: boss stops, then power attacks ---
        if (this.powerWindUp) {
            this.updateAirPosition(deltaTime, player, mountain, true);
            this.powerWindUpTimer -= deltaTime;

            if (this.powerWindUpTimer <= 0) {
                this.powerWindUp = false;
                this.beamTimer = this.BEAM_DURATION;
                this.beamFireTimer = 0;
                this.powerTimer = this.powerCooldown; // reset cooldown
            }
            return;
        }

        // --- Trigger power attack when cooldown ready and player is near ---
        if (this.powerTimer <= 0 && player.position.x > this.position.x) {
            this.powerWindUp = true;
            this.powerWindUpTimer = this.powerWindUpDuration;
            this.velocity.x = 0;
            this.attackOffsetX = Math.min(
                this.ATTACK_MAX_BEHIND,
                (player.position.x - this.position.x) + this.ATTACK_BEHIND_BUFFER
            );
        }
    }

    private updateAirPosition(deltaTime: number, player: Player, mountain: Mountain, advanceOffset: boolean): void {
        this.velocity.x = 0;
        if (advanceOffset) {
            this.attackOffsetX = Math.min(
                this.ATTACK_MAX_BEHIND,
                this.attackOffsetX + this.ATTACK_DRIFT_SPEED * deltaTime
            );
        }
        const leftEdge = GameEngine.g_INSTANCE.viewportX + this.ATTACK_LEFT_MARGIN;
        const desiredX = Math.max(leftEdge, player.position.x - this.attackOffsetX - this.ATTACK_LEFT_SHIFT);
        const lerp = 1 - Math.exp(-this.ATTACK_AIR_LERP * deltaTime);
        this.position.x += (desiredX - this.position.x) * lerp;
        this.position.y = mountain.getHeightAt(this.position.x) - this.ATTACK_AIR_HEIGHT;
    }

    private fireBeamAtPlayer(player: Player): void {
        const playerHalfH = (player.physicsCollider?.height ?? 0) * 0.5;
        const targetY = player.position.y + playerHalfH + 6;
        const dx = player.position.x - this.position.x;
        const dy = targetY - this.position.y;
        const angle = Math.atan2(dy, dx);
        const originX = this.position.x + Math.cos(angle) * 2;
        const originY = this.position.y - (this.physicsCollider.height * 0.6) + Math.sin(angle) * 2;
        GameEngine.g_INSTANCE.addEntity(
            new IceBeamBullet(originX, originY, angle, this.powerDamage),
            DrawLayer.BULLET
        );
    }
    
    protected _doAttack(player: Player, distance: number, currentTime: number): void {
        if (this.powerWindUp) return; // don't normal attack during power attack windup

        if (distance <= this.attack_range) {
            if (currentTime - this.lastAttackTime >= this.attack_cooldown) {
                this.lastAttackTime = currentTime;
                player.damagePlayer(this.player_damage_amount, "Health");
            }
        }
    }

    protected moveTowardsPlayer(player: Player, distance: number, deltaX: number): void {
        if (this.powerWindUp || this.beamTimer > 0) {
            this.velocity.x = 0;
            return;
        }
        if (deltaX <= 2) {
            this.velocity.x = 0;
            return;
        }
        let MOVE_SPEED = this.run_speed;
        MOVE_SPEED = Math.max(MOVE_SPEED, Math.abs(player.velocity.x) * 1.03);
        if (deltaX > 50) {
            MOVE_SPEED *= 1.5;
        }
        this.velocity.x = MOVE_SPEED;
    }

    protected updateZombieAnimation(distance: number, deltaTime: number): void {
        if (this.powerOutroTimer > 0) {
            this.powerOutroTimer -= deltaTime;
            this.animator.updateAnimState(AnimationState.FALL, deltaTime);
            return;
        }
        if (this.powerWindUp) {
            this.animator.updateAnimState(AnimationState.HIT, deltaTime);
            return;
        }
        if (this.beamTimer > 0) {
            this.animator.updateAnimState(AnimationState.RELOAD, deltaTime);
            return;
        }
        super.updateZombieAnimation(distance, deltaTime);
    }

    damage(amount: number): void {
        this.takeDamage(amount);

        if (this.health <= 0) {
            this.removeFromWorld = true;
            window.dispatchEvent(new CustomEvent("boss:defeated"));
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;
        const w = this.physicsCollider.width * scale / game.zoom;
        const h = this.physicsCollider.height * scale / game.zoom;

        this.animator.drawCurrentAnimFrameAtPos(this.position);

        // --- Small health bar floating above boss ---
        const barW = w * 1.5;
        const barH = 5;
        const barX = screenX - barW / 2;
        const barY = screenY - h - 18;

        ctx.fillStyle = "#333";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = this.health > 500 ? "#44FF44" : this.health > 250 ? "#FFAA00" : "#FF3333";
        ctx.fillRect(barX, barY, barW * (this.health / this.maxHealth), barH);
    }
}
