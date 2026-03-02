import { Animator } from "../../engine/Animator.js";
import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Vec2 } from "../../engine/Vec2.js";
import { Mountain } from "./mountain.js";
import { Player } from "./player.js";
import { AnimationState } from "../../engine/Animator.js";
import { Zombie } from "../zombies/Zombie.js";

export class Boss extends Zombie {
    sprite: ImagePath = new ImagePath("res/img/player_new.png");

    // --- Power attack ---
    powerDamage = 40;
    powerCooldown = 10;    // seconds between power attacks
    private powerTimer = 0;
    private powerWindUp = false;
    private powerWindUpTimer = 0;
    private readonly POWER_WIND_UP_DURATION = 1.2; // pause before power hit lands

    constructor(pos?: Vec2) {
        const tag: string = "boss";
        const attack_range: number = 12;
        const attack_cooldown: number = 1.5; // seconds between attacks
        const run_range: number = 999;       // boss always runs
        const health: number = 1500;
        const reward: number = 0;            // no currency reward for boss
        const walk_speed: number = 20;
        const run_speed: number = 20;
        const player_damage_amount: number = 15; // normal damage

        const physicsCollider = new BoxCollider(6, 8);
        const animator: Animator = new Animator([]); // TODO: add boss animations

        super(tag, physicsCollider, animator, attack_range, attack_cooldown, run_range, health, reward, walk_speed, run_speed, player_damage_amount, pos);

        // Delay power attack just so it doesn't happen right away
        this.powerTimer = this.powerCooldown;
    }

    protected _onUpdate(keys: { [key: string]: boolean }, deltaTime: number, player: Player, mountain: Mountain, distance: number, currentTime: number): void {
        // --- Tick power attack cooldown ---
        this.powerTimer -= deltaTime;

        // --- Power wind-up: boss stops, then power attacks ---
        if (this.powerWindUp) {
            this.velocity.x = 0;
            this.powerWindUpTimer -= deltaTime;

            if (this.powerWindUpTimer <= 0) {
                this.powerWindUp = false;
                // only hit if player is in range
                if (distance <= this.attack_range * 1.5) {
                    player.damagePlayer(this.powerDamage, "Health"); // heavy slam → Health damage
                }
                this.powerTimer = this.powerCooldown; // reset cooldown
            }
            return;
        }

        // --- Trigger power attack when cooldown ready and player is near ---
        if (this.powerTimer <= 0 && distance <= this.attack_range * 1.5) {
            this.powerWindUp = true;
            this.powerWindUpTimer = this.POWER_WIND_UP_DURATION;
            this.velocity.x = 0;
        }
    }
    
    protected _doAttack(player: Player, distance: number, currentTime: number): void {
        if (this.powerWindUp) return; // don't normal attack during power attack windup

        if (distance <= this.attack_range) {
            if (currentTime - this.lastAttackTime >= this.attack_cooldown) {
                this.lastAttackTime = currentTime;
                player.damagePlayer(this.player_damage_amount, "Infection"); // Infection damage
            }
        }
    }

    // Called by damage sources
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

        // red square
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(screenX - w / 2, screenY - h, w, h);

        // "POWER!" text during windup of power attack
        if (this.powerWindUp) {
            ctx.fillStyle = "white";
            ctx.font = `bold ${Math.round(16 / game.zoom)}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText("POWER!", screenX, screenY - h - 8);
        }

        // --- Small health bar floating above boss ---
        const barW = w * 1.5;
        const barH = 5;
        const barX = screenX - barW / 2;
        const barY = screenY - h - 18;

        ctx.fillStyle = "#333";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = this.health > 500 ? "#44FF44" : this.health > 250 ? "#FFAA00" : "#FF3333";
        ctx.fillRect(barX, barY, barW * (this.health / 1500), barH);
    }
}