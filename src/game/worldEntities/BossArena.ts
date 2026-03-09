import { Entity, EntityID } from "../../engine/Entity.js";
import { GameEngine } from "../../engine/gameengine.js";
import { DrawLayer } from "../../engine/types.js";
import { Vec2 } from "../../engine/Vec2.js";
import { Mountain } from "./mountain.js";
import { Player } from "./player.js";
import { Boss } from "./Boss.js";
import { G_CONFIG } from "../CONSTANTS.js";

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
    private arenaWidth: number;
    private leadAhead = 75;

    // --- Transition stuff ---
    private introLockTime = 0;
    private readonly introLockDuration = 1.35;

    private fadeTime = 0;
    private readonly fadeDuration = 2.1;
    private isOutroFading = false;
    private outroFadeTime = 0;

    private stagedPlayerX = 0;
    private stagedPlayerStartX = 0;

    isActive = false;
    private boss: Boss | null = null;
    private bossDefeated = false;

    constructor(minX: number, maxX: number, private wave: number = 1) {
        this.id = `boss_arena#${crypto.randomUUID()}` as EntityID;
        this.minX = minX;
        this.maxX = maxX;
        this.arenaWidth = maxX - minX;
        this.position = new Vec2((minX + maxX) / 2, 0);

        window.addEventListener("boss:defeated", () => this.deactivate());
    }

    update(keys: { [key: string]: boolean }, deltaTime: number, _click: Vec2): void {
        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
        if (!player) return;

        if (this.isOutroFading) {
            this.outroFadeTime += deltaTime;
            if (this.outroFadeTime >= this.fadeDuration) {
                this.isOutroFading = false;
            }
        }

        this.position.x = player.position.x;
        this.position.y = player.position.y;

        // --- Player enters arena ---
        if (!this.isActive && player.position.x >= this.minX && player.position.x <= this.maxX) {
            this.activate(player);
        }

        // --- Move only left border forward with player to boss doesn't fall behind---
        const trailBehind = this.arenaWidth - this.leadAhead;
        const targetMinX = player.position.x - trailBehind;
        this.minX = Math.max(this.minX, targetMinX);

        if (!this.isActive) return;

        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined;
        if (!mountain) return;

        // Brief lock so transition feels clean
        if (this.introLockTime < this.introLockDuration) {
            this.introLockTime += deltaTime;
            this.fadeTime += deltaTime;

            if (this.boss && !this.boss.removeFromWorld) {
                this.boss.velocity.x = 0;
                this.boss.velocity.y = 0;
                this.boss.position.y = mountain.getHeightAt(this.boss.position.x);
            }
        } else {
            this.fadeTime += deltaTime;
        }

        // --- Keep player inside of arena ---
        if (player.position.x < this.minX) {
            player.position.x = this.minX;
            player.velocity.x = Math.max(0, player.velocity.x);
        }

        // --- Keep boss getting too far behind ---
        if (this.boss && !this.boss.removeFromWorld && this.boss.position.x < this.minX) {
            this.boss.position.x = this.minX;
            this.boss.velocity.x = Math.max(0, this.boss.velocity.x);
        }
    }

    private activate(player: Player): void {
        if (this.isActive) return;
        if (this.bossDefeated) return;

        this.isActive = true;

        const mountain = GameEngine.g_INSTANCE.getUniqueEntityByTag("mountain") as Mountain | undefined;
        if (!mountain) return;

        // Snapshot old player position (boss starts here)
        const oldPlayerX = player.position.x;

        // Stage positions: player right, boss left
        this.stagedPlayerX = oldPlayerX + 50;
        const stagedBossX = this.minX + 3;

        player.position.x = this.stagedPlayerX;
        player.position.y = mountain.getHeightAt(this.stagedPlayerX);
        player.velocity.x = 0;
        player.velocity.y = 0;

        this.boss = new Boss(new Vec2(stagedBossX, mountain.getHeightAt(stagedBossX)), this.wave);
        this.boss.velocity.x = 0;
        this.boss.velocity.y = 0;
        GameEngine.g_INSTANCE.addEntity(this.boss, DrawLayer.ZOMBIE);

        // Short lock + fade
        this.introLockTime = 0;
        this.fadeTime = 0;

        // Put player toward right side of screen
        GameEngine.g_INSTANCE.positionScreenOnEnt(player, 0.60, 0.65);
        GameEngine.g_INSTANCE.snapViewportToFollowedEnt();
    }

    private deactivate(): void {
        // boss died, so unlock arena
        this.isActive = false;
        this.boss = null;
        this.bossDefeated = true;
        this.isOutroFading = true;
        this.outroFadeTime = 0;

        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
        if (player) {
            GameEngine.g_INSTANCE.positionScreenOnEnt(player, 0.15, 0.65);
        }
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        if (!this.isActive && !this.isOutroFading) return;

        if (this.isActive) {
            // --- Arena boundary lines ---
            if (G_CONFIG.DRAW_BOSS_ARENA_BB) {
                const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
                const leftX = (this.minX - game.viewportX) * scale / game.zoom;

                ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
                ctx.lineWidth = 12;
                ctx.setLineDash([16, 8]);
                ctx.beginPath();
                ctx.moveTo(leftX, 0);
                ctx.lineTo(leftX, ctx.canvas.height);
                // ctx.moveTo(rightX, 0);
                // ctx.lineTo(rightX, ctx.canvas.height);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // --- Boss health bar HUD ---
            if (this.boss) {
                const pct = this.boss.health / this.boss.maxHealth;
                const barW = ctx.canvas.width * 0.5;
                const barH = 22;
                const barX = (ctx.canvas.width - barW) / 2;
                const barY = ctx.canvas.height - 54;

                // Background
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                ctx.fillRect(barX - 6, barY - 6, barW + 12, barH + 22);

                // Empty bar
                ctx.fillStyle = "#333";
                ctx.fillRect(barX, barY, barW, barH);

                // Filled bar — green → orange → red
                ctx.fillStyle = pct > 0.5 ? "#44FF44" : pct > 0.25 ? "#FFAA00" : "#FF3333";
                ctx.fillRect(barX, barY, barW * pct, barH);

                // "BOSS" label
                ctx.fillStyle = "white";
                ctx.font = "bold 13px Arial";
                ctx.textAlign = "center";
                ctx.fillText(`BOSS  ${Math.ceil(this.boss.health)} / ${Math.ceil(this.boss.maxHealth)}`, ctx.canvas.width / 2, barY - 8);
            }

            // Intro fade from black to clear
            const fadeAlpha = Math.max(0, 1 - (this.fadeTime / this.fadeDuration));
            if (fadeAlpha > 0) {
                ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha * 0.8})`;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
        }

        // Outro fade from black to clear when boss dies
        if (this.isOutroFading) {
            const outroAlpha = Math.max(0, 1 - (this.outroFadeTime / this.fadeDuration));
            ctx.fillStyle = `rgba(0, 0, 0, ${outroAlpha * 0.8})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }
}
