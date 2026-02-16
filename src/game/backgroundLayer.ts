import { ImagePath } from "../engine/assetmanager.js";
import { GameEngine } from "../engine/gameengine.js";
import { Entity, EntityID } from "../engine/Entity.js";
import { Vec2 } from "../engine/types.js";
import { unwrap } from "../engine/util.js";

/**
 * @author JK
 * @description The background layer class.
 */
export class BackgroundLayer implements Entity {
    position: Vec2 = new Vec2();
    velocity: Vec2 = new Vec2();
    position2: Vec2 = new Vec2();
    playerPosition: Vec2 = new Vec2();

    physicsCollider = null;
    spriteType: string;
    sprite: ImagePath;
    sprite2: ImagePath;
    spritePaths: ImagePath[];

    removeFromWorld: boolean = false;
    tag: string = "backgroundlayer";
    id: EntityID;

    parallaxSpeed: number;
    worldWidth = GameEngine.WORLD_UNITS_IN_VIEWPORT;
    widthInWorldUnits: number;
    changeSky: number = 0;

    startY: number;

    // used for different middle and foreground layers
    spawnRandom: boolean;
    timeInterval = 20; // in seconds
    timeSinceLastChange: number = 0; //in seconds

    // used for night/day stuff
    dayNightCycleTime: number = 0; // Time in the cycle
    cycleDuration: number = 120; // 2 minutes for full day/night cycle
    timeOfDayAlpha: number = 1; // 0 = night, 1 = day
    sunOrMoon: number = 0; // 0 = sun, 1 = moon


    constructor(
        spritePaths: string[],
        parallaxSpeed: number,
        widthInWorldUnits: number,
        startX: number,
        startY: number,
        spawnRandom: boolean = true,
    ) {
        let parts = spritePaths[0].split("/");
        this.spriteType = parts[parts.length - 2];

        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.sprite = new ImagePath(spritePaths[0]);
        this.sprite2 = new ImagePath(spritePaths[0]);
        this.spritePaths = spritePaths.map(path => new ImagePath(path));

        this.position.x = startX;
        this.position.y = startY;
        this.startY = startY;

        this.position2.x = startX + this.worldWidth;
        this.position2.y = startY;

        this.parallaxSpeed = parallaxSpeed;
        this.widthInWorldUnits = widthInWorldUnits;

        this.spawnRandom = spawnRandom;
        console.log(`Created ${this.spriteType} layer with ID ${this.id}`);
    }


    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        const sprite = game.getSprite(this.sprite);
        const sprite2 = game.getSprite(this.sprite2);

        const player_width_in_world_units = this.widthInWorldUnits;

        const meter_in_pixels = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        const w = player_width_in_world_units * meter_in_pixels;
        const h = sprite.height * (w / sprite.width);

        const scale = ctx.canvas.width / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const screenX = (this.position.x - game.viewportX) * scale / game.zoom;
        const screenY = (this.position.y - game.viewportY) * scale / game.zoom;

        const screenX2 = (this.position2.x - game.viewportX) * scale / game.zoom;
        const screenY2 = (this.position2.y - game.viewportY) * scale / game.zoom;

        ctx.globalAlpha = 1;
        // first slide
        ctx.drawImage(
            sprite,
            screenX - w / 2,
            screenY - h,
            w,
            h
        );

        if (this.spriteType != "sky") {
            // second slide
            ctx.drawImage(
                sprite2,
                screenX2 - w / 2,
                screenY2 - h,
                w,
                h
            );


            // blend for day/night cycle
            if (this.spriteType == "background") {
                //get night sprites
                const nightSprite = game.getSprite(this.spritePaths[1]);

                ctx.globalAlpha = this.timeOfDayAlpha;

                ctx.drawImage(
                    nightSprite,
                    screenX - w / 2,
                    screenY - h,
                    w,
                    h
                );


                ctx.drawImage(
                    nightSprite,
                    screenX2 - w / 2,
                    screenY2 - h,
                    w,
                    h
                );
            }
        }
    }


    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        // Calculate time of day 
        this.dayNightCycleTime += deltaTime;
        if (this.dayNightCycleTime > this.cycleDuration) {
            this.dayNightCycleTime = 0;
        }

        const player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"));
        this.playerPosition = player.position;
        this.velocity = player.velocity;

        const cycleProgress = this.dayNightCycleTime / this.cycleDuration;
        this.timeOfDayAlpha = (Math.sin(cycleProgress * Math.PI * 2 - Math.PI / 2) + 1) / 2;

        if (this.spriteType != "sky") {
            this.timeSinceLastChange += deltaTime;

            // horizontal movement logic
            if (this.position.x + this.worldWidth < this.playerPosition.x + 35) {
                this.position.x = this.position2.x + this.worldWidth;

                // swap sprites when position resets
                if (this.spawnRandom && this.timeSinceLastChange >= this.timeInterval) {
                    this.sprite = this.spritePaths[Math.floor(Math.random() * this.spritePaths.length)];
                    this.timeSinceLastChange = 0;
                } else {
                    this.sprite = this.sprite2;
                }

            } else {
                this.position.x -= this.velocity.x * this.parallaxSpeed;
            }
            if (this.position2.x + this.worldWidth < this.playerPosition.x + 35) {
                this.position2.x = this.position.x + this.worldWidth;

                // swap sprites when position2 resets
                if (this.spawnRandom && this.timeSinceLastChange >= this.timeInterval) {
                    this.sprite2 = this.spritePaths[Math.floor(Math.random() * this.spritePaths.length)];
                    this.timeSinceLastChange = 0;
                } else {
                    this.sprite2 = this.sprite;
                }
            } else {
                this.position2.x -= this.velocity.x * this.parallaxSpeed;
            }

            // verticle movement logic 
            this.position.y = this.playerPosition.y + this.startY;
            this.position2.y = this.playerPosition.y + this.startY;

        } else {
            // sun and moon logic
            const verticalHeight = 7;

            if (cycleProgress < 0.5) {
                // day
                this.sprite = this.spritePaths[0]; // sun
                const sunProgress = cycleProgress * 2;

                this.position.x = this.playerPosition.x + this.worldWidth - (sunProgress * this.worldWidth * 2);
                // Arc motion
                const angleInArc = sunProgress * Math.PI * 1.5;
                this.position.y = this.playerPosition.y - 5 - (Math.sin(angleInArc) * verticalHeight);
            } else {
                // night
                this.sprite = this.spritePaths[1]; // moon
                const moonProgress = (cycleProgress - 0.5) * 2;

                // Move from right to left
                this.position.x = this.playerPosition.x + this.worldWidth - (moonProgress * this.worldWidth * 2);
                // Arc motion
                const angleInArc = moonProgress * Math.PI * 1.5;
                this.position.y = this.playerPosition.y - 5 - (Math.sin(angleInArc) * verticalHeight);
            }
        }
    }
}
