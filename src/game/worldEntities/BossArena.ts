import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { DrawLayer } from "../../engine/types.js";
import { Vec2 } from "../../engine/Vec2.js";
import { Player } from "./player.js";
import { Boss } from "./Boss.js";

export class BossArena implements Entity {
    readonly tag = "boss_arena";
    readonly id: EntityID;

    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    physicsCollider = null;
    sprite = null;
    removeFromWorld = false;

    // --- Arena boundaries ---
    private minX: number;
    private maxX: number;

    isActive = false;
    private boss: Boss | null = null;
    private bossDefeated = false;

    constructor(minX: number, maxX: number) {
        this.id   = `boss_arena#${crypto.randomUUID()}` as EntityID;
        this.minX = minX;
        this.maxX = maxX;

        window.addEventListener("boss:defeated", () => this.deactivate());
    }

    update(keys: { [key: string]: boolean }, deltaTime: number, _click: Vec2): void {
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
        if (!player) return;

        // --- Player enters arena ---
        if (!this.isActive && player.position.x >= this.minX && player.position.x <= this.maxX) {
            this.activate(player);
        }

        if (!this.isActive) return;

        // --- Keep player inside of arena ---
        if (player.position.x < this.minX) {
            player.position.x = this.minX;
            player.velocity.x = Math.abs(player.velocity.x);
        }
        if (player.position.x > this.maxX) {
            player.position.x = this.maxX;
            player.velocity.x = -Math.abs(player.velocity.x);
        }
    }

    private activate(player: Player): void {
        if (this.isActive) return;
        if (this.bossDefeated) return;
        this.isActive = true;

        // Spawn boss on the right side of the arena
        const bossSpawnX = this.maxX - 10;
        this.boss = new Boss(new Vec2(bossSpawnX, player.position.y));
        GameEngine.g_INSTANCE.addUniqueEntity(this.boss, DrawLayer.ZOMBIE);

    }

    private deactivate(): void {
        // boss died, so unlock arena
        this.isActive = false;
        this.boss     = null;
        this.bossDefeated = true;

    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (!this.isActive) return;

        // --- Arena boundary lines ---
        // mainly for test but we can keep it if needed
        const scale  = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const leftX  = (this.minX - game.viewportX) * scale / game.zoom;
        const rightX = (this.maxX - game.viewportX) * scale / game.zoom;

        ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
        ctx.lineWidth   = 12;
        ctx.setLineDash([16, 8]);
        ctx.beginPath();
        ctx.moveTo(leftX,  0);
        ctx.lineTo(leftX,  ctx.canvas.height);
        ctx.moveTo(rightX, 0);
        ctx.lineTo(rightX, ctx.canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // --- Boss health bar HUD ---
        if (!this.boss) return;

        const pct     = this.boss.health / 1500;
        const barW    = ctx.canvas.width * 0.5; 
        const barH    = 22;
        const barX    = (ctx.canvas.width - barW) / 2;
        const barY    = 20;

        // Background
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(barX - 6, barY - 6, barW + 12, barH + 22);

        // Empty bar
        ctx.fillStyle = "#333";
        ctx.fillRect(barX, barY + 14, barW, barH);

        // Filled bar — green → orange → red
        ctx.fillStyle = pct > 0.5 ? "#44FF44" : pct > 0.25 ? "#FFAA00" : "#FF3333";
        ctx.fillRect(barX, barY + 14, barW * pct, barH);

        // "BOSS" label
        ctx.fillStyle  = "white";
        ctx.font       = "bold 13px Arial";
        ctx.textAlign  = "center";
        ctx.fillText(`BOSS  ${Math.ceil(this.boss.health)} / 1500`, ctx.canvas.width / 2, barY + 11); // <-- CHANGE THIS LINE
    }
}