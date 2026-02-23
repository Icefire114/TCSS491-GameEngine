import { Entity, EntityID } from "../../../engine/Entity.js";
import { Vec2 } from "../../../engine/types.js";

export class SafeZoneNotification implements Entity {
    // Required info
    id: EntityID;
    tag: string = "SafeZoneNotification";
    position: Vec2 = new Vec2(0, 0);
    velocity: Vec2 = new Vec2(0, 0);
    physicsCollider = null;
    sprite = null;
    removeFromWorld: boolean = false;

    // The Time system for the notificaiton 
    private timer: number = 0;
    private readonly DROP_DURATION = 1.5;
    private readonly STAY_DURATION = 2.0;
    private readonly RISE_DURATION = 1;

    // The notification placement itself
    private currentY: number = -100;
    private targetY: number = 15;

    constructor(private levelNumber: number) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
    }

    update(keys: { [p: string]: boolean }, deltaTime: number): void {
        this.timer += deltaTime;

        const totalDuration = this.DROP_DURATION + this.STAY_DURATION + this.RISE_DURATION;

        // Handling the indivdual phases of the notification, drop, display, rise up, then remove
        if (this.timer < this.DROP_DURATION) {
            const t = this.timer / this.DROP_DURATION;
            this.currentY = -100 + (this.targetY + 100) * (1 - Math.pow(1 - t, 3));
        }
        else if (this.timer < this.DROP_DURATION + this.STAY_DURATION) {
            this.currentY = this.targetY;
        }
        else if (this.timer < totalDuration) {
            const t = (this.timer - this.DROP_DURATION - this.STAY_DURATION) / this.RISE_DURATION;
            this.currentY = this.targetY - (this.targetY + 120) * (t * t);
        }
        else {
            this.removeFromWorld = true;
        }
    }

    // Well drawing the notification itself 
    draw(ctx: CanvasRenderingContext2D): void {
        const centerX = ctx.canvas.width / 2;
        ctx.save();

        // Notification Display Settings
        const bannerW = 460;
        const bannerH = 70;
        const mainGray = "#404040";
        const darkBorder = "#1A1A1A";
        const lineStroke = "#333333";

        // Outer Border 
        ctx.fillStyle = darkBorder;
        ctx.fillRect(centerX - bannerW / 2 - 2, this.currentY - 2, bannerW + 4, bannerH + 4);

        // Notification Background
        ctx.fillStyle = mainGray;
        ctx.fillRect(centerX - bannerW / 2, this.currentY, bannerW, bannerH);

        // Creating horizontal lines
        ctx.strokeStyle = lineStroke;
        ctx.lineWidth = 1;
        for (let i = 0; i < bannerH; i += 8) {
            ctx.beginPath();
            ctx.moveTo(centerX - bannerW / 2, this.currentY + i);
            ctx.lineTo(centerX + bannerW / 2, this.currentY + i);
            ctx.stroke();
        }

        // the text
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // the "zone" text
        ctx.fillStyle = "#AAAAAA";
        ctx.font = "14px 'Courier New', monospace";
        ctx.fillText(`ZONE ${this.levelNumber}`, centerX, this.currentY + 20);

        // "welcome" part of the notification
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "24px 'Courier New', monospace";
        ctx.fillText("WELCOME TO THE SAFE ZONE", centerX, this.currentY + 45);

        ctx.restore();
    }
}