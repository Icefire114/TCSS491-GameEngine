import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { BoxCollider } from "../../engine/physics/BoxCollider.js";
import { Vec2 } from "../../engine/types.js";
import { Mountain } from "./mountain.js";
import { Player } from "./player.js";

export class Boss implements Entity {
    readonly tag = "boss";
    readonly id: EntityID;

    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider = new BoxCollider(6, 8);
    sprite = null;
    removeFromWorld = false;

    // --- Health ---
    maxHealth = 1267;
    currentHealth = 1267;

    // --- Movement --- 
    speed = 20;

    // --- Normal attack ---
    attackRange = 12;
    attackDamage = 15;
    attackCooldown = 1.5; // seconds between attacks
    private attackTimer = 0;

    // --- Power attack ---
    powerDamage = 40;
    powerCooldown = 10;    // seconds between power attacks
    private powerTimer = 0;
    private powerWindUp = false;
    private powerWindUpTimer = 0;
    private readonly POWER_WIND_UP_DURATION = 1.2; // pause before power hit lands

    constructor(startPos: Vec2) {
        this.id = `boss#${crypto.randomUUID()}` as EntityID;
        this.position = new Vec2(startPos.x, startPos.y);

        // Delay power attack so it doesn't happen immediately
        this.powerTimer = this.powerCooldown;
    }

    update(keys: { [key: string]: boolean }, deltaTime: number, _click: Vec2): void {
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined;
        if (!player || !mountain) return;

        // --- Gravity and terrain grounding ---
        this.velocity.y += GameEngine.g_INSTANCE.G * deltaTime * 3;
        this.position.y += this.velocity.y * deltaTime;
        const groundY = mountain.getHeightAt(this.position.x);
        if (this.position.y >= groundY) {
            this.position.y = groundY;
            this.velocity.y = 0;
        }

        // --- Tick cooldown timers ---
        this.attackTimer -= deltaTime;
        this.powerTimer -= deltaTime;

        const dx = player.position.x - this.position.x;
        const distance = Math.abs(dx);

        // --- Power wind-up: boss stops, then power attacks ---
        if (this.powerWindUp) {
            this.velocity.x = 0;
            this.powerWindUpTimer -= deltaTime;

            if (this.powerWindUpTimer <= 0) {
                this.powerWindUp = false;
                // only hit if player is in range
                if (distance <= this.attackRange * 1.5) {
                    player.damagePlayer(this.powerDamage, "Health");
                }
                this.powerTimer = this.powerCooldown; // reset cooldown
            }
            return; // skip movement & normal attacks while winding up
        }

        // --- do power attack when cooldown ready and player is near ---
        if (this.powerTimer <= 0 && distance <= this.attackRange * 1.5) {
            this.powerWindUp = true;
            this.powerWindUpTimer = this.POWER_WIND_UP_DURATION;
            return;
        }

        // --- Move toward player ---
        if (distance > this.attackRange) {
            this.velocity.x = dx > 0 ? this.speed : -this.speed;
        } else {
            // In melee range — stop and hit
            this.velocity.x = 0;

            if (this.attackTimer <= 0) {
                this.attackTimer = this.attackCooldown;
                player.damagePlayer(this.attackDamage, "Infection");
            }
        }

        this.position.x += this.velocity.x * deltaTime;
    }

    // Called by bullets or other damage sources
    damage(amount: number): void {
        this.currentHealth -= amount;

        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
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

        // Draw boss as red square
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(screenX - w / 2, screenY - h, w, h);

        // POWER! text during wind up of attack
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
        const pct = this.currentHealth / this.maxHealth;

        ctx.fillStyle = "#333";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = pct > 0.5 ? "#44FF44" : pct > 0.25 ? "#FFAA00" : "#FF3333";
        ctx.fillRect(barX, barY, barW * pct, barH);
    }
}