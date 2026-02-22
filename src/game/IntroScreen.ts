import { Entity, EntityID } from "../engine/Entity.js";
import { GameEngine } from "../engine/gameengine.js";
import { Collider } from "../engine/physics/Collider.js";
import { Vec2 } from "../engine/types.js";
import { ImagePath } from "../engine/assetmanager.js";


// Snow particle sin the title
interface SnowParticle {
    x: number;
    y: number;
    radius: number;
    speed: number;
    drift: number;
    driftPhase: number;
    opacity: number;
}

// Enums that represents the differnet phases of the title
const enum Phase {
    TITLE,       // Showing the title screen, while waiting for Enter
    TITLE_EXIT,  // The transititon animation from title to the intro animation
    PAN_LEFT,    // Camera starts left of player then pans to the  right toward player
    SLIDE_IN,    // Fake player slides in from left to spawn position
    GO_FLASH,    // A "GO!" screen flashes on screen
}

// Constants for phases settings
const PAN_START_OFFSET = 100; // In x
const PAN_DURATION = 2;   
const SLIDE_DURATION = .9;
const GO_DURATION= .8;   


// Title transition to animation 
const TITLE_EXIT_DURATION = 1.5;
const FLASH_PEAK = 0.5; 


// Simple ease in fucntions 
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutBack(t: number): number {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}


export class IntroScreen implements Entity {
    readonly id: EntityID = `intro_screen#${crypto.randomUUID()}` as EntityID;
    readonly tag = "intro_screen";
    position: Vec2 = new Vec2(0, 0);
    velocity: Vec2 = new Vec2(0, 0);
    physicsCollider: Collider | null = null;
    sprite = null;
    removeFromWorld = false;

    private cinemaZombies: Array<{
        worldX: number;
        worldY: number;
        frameTimer: number;
        frame: number;
        type: 'basic' | 'fast' | 'giant';
    }> = [];

    // Misallenous Settings 
    private alpha = 1;
    private fadeOut  = false;
    private onDismiss: () => void;
    private showFakePlayer = true;

    // Snow Effect logic in title 
    private particles: SnowParticle[] = [];
    private readonly PARTICLE_COUNT = 140;

    // The title flicker
    private flickerTimer = 0;
    private flickerAlpha = 1;
    private nextFlickerIn = 2.5;

    // The animation state 
    private phase: Phase  = Phase.TITLE;
    private phaseTimer = 0;
    private elapsed = 0;

    // Viewport bookkeeping for the pan
    private viewportXAtPanStart = 0;  
    private viewportXPanFrom = 0; 

    // GO flash alpha
    private goAlpha = 0;

    // Transition Sprite
    private spritesReady = false;


    // Player dummy setting animation 
    private PLAYER_WALK_SPEED = 30; 
    private playerWalkX  = 0;
    private playerWalkY = 0;
    private waypointIndex = 0;
    private playerFrameTimer = 0;
    private playerFrame = 0;

    private readonly WALK_WAYPOINTS: Array<[number, number]> = [
        [0, 13.5],
        [5, 13.1],
        [10, 12.1],
        [25, 8],
        [31, 5],
        [41, 1],
        [48, -1],
        [55.2, .5],
    ];



    constructor(onDismiss: () => void) {
        this.onDismiss = onDismiss;
        this.initParticles(1280, 720);
        this.preloadSprites();
    }

    private preloadSprites(): void {
        const engine = GameEngine.g_INSTANCE;
        const paths = [
            "res/img/soldiers/Soldier_1/Idle.png",
            "res/img/snowboard.png",
            "res/img/zombies/Zombie Man/Run.png",
            "res/img/zombies/Wild Zombie/Run.png",
            "res/img/zombies/Zombie Woman/Run.png",
        ];
        for (const path of paths) {
            try { engine.getSprite(new ImagePath(path)); } catch {}
        }
    }


    update(keys: { [key: string]: boolean }, dt: number, _click: Vec2): void {
        this.elapsed += dt;
        this.phaseTimer += dt;
        const engine = GameEngine.g_INSTANCE;
        
        // The Title Screen Phase
        if (this.phase === Phase.TITLE) {
            this.tickFlicker(dt);
            this.tickParticles(1280, 720, dt);

            // Intro input
            if (keys["Enter"] || keys[" "] || keys["Mouse0"]) {
                this.viewportXAtPanStart = engine.viewportX;
                this.viewportXPanFrom = engine.viewportX - PAN_START_OFFSET;
                engine.viewportX = this.viewportXPanFrom;  
                this.enterPhase(Phase.TITLE_EXIT);
            }
            return;
        }

       if (this.phase === Phase.TITLE_EXIT) {
            this.tickParticles(1280, 720, dt);
            for (const zombie of this.cinemaZombies) {
                zombie.frameTimer += dt;
                if (zombie.frameTimer > 0.12) {
                    zombie.frameTimer = 0;
                    zombie.frame = (zombie.frame + 1) % 8;
                }
                zombie.worldX += (zombie.type === 'fast' ? 4 : 2) * dt;
            }
            this.playerFrameTimer += dt;
            if (this.playerFrameTimer > 0.08) {
                this.playerFrameTimer = 0;
                this.playerFrame = (this.playerFrame + 1) % 7;
            }
            const t = this.phaseTimer / TITLE_EXIT_DURATION;
            if (t >= 1) {
                this.enterPhase(Phase.PAN_LEFT);
            }
            return;
        }

        // Panning to the left to the right until to our "player"
        if (this.phase === Phase.PAN_LEFT) {
            const t = Math.min(this.phaseTimer / PAN_DURATION, 1);
            engine.viewportX = this.viewportXPanFrom +  easeInOutCubic(t) * (this.viewportXAtPanStart - this.viewportXPanFrom);

            if (t >= 1) {
                engine.viewportX = this.viewportXAtPanStart;
                this.enterPhase(Phase.SLIDE_IN);
            }

            for (const zombie of this.cinemaZombies) {
                zombie.frameTimer += dt;
                if (zombie.frameTimer > 0.12) {
                    zombie.frameTimer = 0;
                    zombie.frame = (zombie.frame + 1) % 8;
                }
                zombie.worldX += (zombie.type === 'fast' ? 4 : 2) * dt;
            }

            const mountain = (GameEngine.g_INSTANCE as any).getUniqueEntityByTag("mountain") as any;
            this.playerFrameTimer += dt;
            
            if (this.playerFrameTimer > 0.08) {
                this.playerFrameTimer = 0;
                this.playerFrame = (this.playerFrame + 1) % 7;
            }
            
            if (this.waypointIndex < this.WALK_WAYPOINTS.length) {
                const [targetX] = this.WALK_WAYPOINTS[this.waypointIndex];
                const step = this.PLAYER_WALK_SPEED * dt;
                const dist = targetX - this.playerWalkX;
            
                if (Math.abs(dist) <= step) {
                    this.playerWalkX = targetX;
                    this.waypointIndex++;
                } else {
                    this.playerWalkX += step * Math.sign(dist);
                }
        
                this.playerWalkY = this.getInterpolatedY(this.playerWalkX);
            }

            if (!this.spritesReady) {
                const engine = GameEngine.g_INSTANCE;
                try {
                    const p = engine.getSprite(new ImagePath("res/img/soldiers/Soldier_1/Idle.png"));
                    const s = engine.getSprite(new ImagePath("res/img/snowboard.png"));
                     if (p.complete && s.complete && p.naturalWidth > 0 && s.naturalWidth > 0) {
                        this.spritesReady = true;
                        this.showFakePlayer = true;
                    }
                } catch {
                    // still loading, keep showFakePlayer false
                }
            }

            return;
        }


        // The slide in for the player
        if (this.phase === Phase.SLIDE_IN) {

            // Animate run frames
            this.playerFrameTimer += dt;
            if (this.playerFrameTimer > 0.08) {
                this.playerFrameTimer = 0;
                this.playerFrame = (this.playerFrame + 1) % 7; // adjust frame count to match your Run.png
            }

            if (this.waypointIndex < this.WALK_WAYPOINTS.length) {
                const [targetX] = this.WALK_WAYPOINTS[this.waypointIndex];

                // Moving towards the current waypoint
                const step = this.PLAYER_WALK_SPEED * dt;
                const dist = targetX - this.playerWalkX;

                if (Math.abs(dist) <= step) {
                    this.playerWalkX = targetX;
                    this.waypointIndex++;
                } else {
                    this.playerWalkX += step * Math.sign(dist);
                }
                
                this.playerWalkY = this.getInterpolatedY(this.playerWalkX);

            } else {
                // When all the waypoints have reached then freeze and do GO
                this.enterPhase(Phase.GO_FLASH);
            }

            return;
        }

        // Handling the Go Flash
        if (this.phase === Phase.GO_FLASH) {
            const t      = this.phaseTimer / GO_DURATION;
            this.goAlpha = t < 0.3 ? t / 0.3 : 1 - ((t - 0.3) / 0.7);
            if (this.phaseTimer > 0.1) {
                this.fadeOut = true;
            }
        }

        // Fade-out only when flagged
        if (this.fadeOut) {
            this.alpha -= dt * 1.5;
            if (this.alpha <= 0) {
                this.alpha = 0;
                this.removeFromWorld = true;
                this.onDismiss();
            }
        }
    }

    /**
     * Systemically handles the different entery of pashes 
     */
    private enterPhase(p: Phase): void {
        this.phase = p;
        this.phaseTimer = 0;

        if (p === Phase.TITLE_EXIT) {
            const [startX, startY] = this.WALK_WAYPOINTS[0];
            this.playerWalkX = startX;
            this.playerWalkY = startY;
            this.waypointIndex = 1;
            this.playerFrame = 0;
            this.playerFrameTimer = 0;
            this.showFakePlayer = false;
            this.spawnCinemaZombies();
        }

        // Handles when were in the flash phase
        if (p === Phase.GO_FLASH) {
            this.showFakePlayer = false;
            const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as any;
            if (player) {
                player.visible = true;
            }
        }
    }


    /**
     * Method to help with the tick magic 
     */
    private tickFlicker(dt: number): void {
        this.flickerTimer -= dt;
        if (this.flickerTimer <= 0) {
            this.flickerAlpha  = 0.15 + Math.random() * 0.4;
            this.flickerTimer  = 0.05 + Math.random() * 0.08;
            this.nextFlickerIn = 1.5  + Math.random() * 3.5;
        } else if (this.flickerTimer <= this.nextFlickerIn * 0.03) {
            this.flickerAlpha = 1;
            if (this.flickerTimer < 0) this.flickerTimer = this.nextFlickerIn;
        }
        if (this.flickerAlpha < 1 && this.flickerTimer <= 0) {
            this.flickerAlpha = 1;
            this.flickerTimer = this.nextFlickerIn;
        }
    }


    // Folloiwng 3 methods are for the title snow particle

    /**
     * Starting the particle effect
     */
    private initParticles(W: number, H: number): void {
        this.particles = [];
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            this.particles.push(this.makeParticle(W, H, true));
        }
    }
    
    /** 
     * Creating the particles themselves
     */
    private makeParticle(W: number, H: number, randomY = false): SnowParticle {
        return {
            x: Math.random() * W,
            y: randomY ? Math.random() * H : -6,
            radius: Math.random() * 2 + 0.5,
            speed: Math.random() * 35 + 15,
            drift: Math.random() * 0.6 + 0.2,
            driftPhase: Math.random() * Math.PI * 2,
            opacity: Math.random() * 0.5 + 0.15,
        };
    }

    /**
     * Making the particle moving
     */
    private tickParticles(W: number, H: number, dt: number): void {
        for (const p of this.particles) {
            p.y += p.speed * dt;
            p.x += Math.sin(this.elapsed * p.drift + p.driftPhase) * 0.6;
            if (p.y > H + 8) {
                Object.assign(p, this.makeParticle(W, H, false));
            }
        }
    }


    draw(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;
        const baseAlpha = Math.max(0, this.alpha);

        // Hanldes snow logic in starting
        if (this.particles.length === 0) {
            this.initParticles(W, H);
        }

        // What phases we are in 
        const isShowingWorld = this.phase === Phase.TITLE_EXIT || 
                           this.phase === Phase.PAN_LEFT || 
                           this.phase === Phase.SLIDE_IN || 
                           this.phase === Phase.GO_FLASH;

        // Drawing our actors 
        if (isShowingWorld) {
            this.drawCinemaZombies(ctx, engine, W, H, baseAlpha);
            if (this.showFakePlayer) {
                this.drawFakePlayer(ctx, engine, W, H, baseAlpha);
            }
        }

        // the title phase
        if (this.phase === Phase.TITLE) {
            this.drawTitleScreen(ctx, W, H, baseAlpha);
            return;
        }

        // Transititon logic (logic - world)
        if (this.phase === Phase.TITLE_EXIT) {
            const t = this.phaseTimer / TITLE_EXIT_DURATION;

            // Fade out text
            const titleAlpha = Math.max(0, 1 - easeInOutCubic(Math.min(t / 0.5, 1)));
            this.drawTitleScreen(ctx, W, H, titleAlpha * baseAlpha);

            // The opening 
            const irisT = easeInOutCubic(Math.max(0, Math.min((t - 0.6) / 0.4, 1)));
            const maxR = Math.sqrt(W * W + H * H) / 2;
            const holeR = irisT * maxR * 1.1;
            const iris = ctx.createRadialGradient(W/2, H/2, Math.max(0, holeR - 40), W/2, H/2, holeR + 20);
            iris.addColorStop(0, 'rgba(7,8,13,0)');
            iris.addColorStop(0.7, 'rgba(7,8,13,0)');
            iris.addColorStop(1, 'rgba(7,8,13,1)');
            ctx.fillStyle = iris;
            ctx.fillRect(0, 0, W, H);

            // The flash 
            const flashT = 1 - Math.min(Math.abs(t - 0.6) / 0.08, 1);
            ctx.globalAlpha = Math.max(0, flashT) * 0.85;
            ctx.fillStyle = '#c8ddf0';
            ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 1;
        }

        this.animationSetup(baseAlpha, ctx, engine, W, H);

        if (this.phase === Phase.GO_FLASH) {
            this.drawGoFlash(ctx, W, H, baseAlpha);
        }

        ctx.globalAlpha = 1;
        ctx.textAlign = "left";

        // Debugging to see the animation path 
        //this.drawingAnimationPath(ctx, engine, W);
    }


    /**
     * Hanldes that nice movie like visual look in the animation 
     */
    animationSetup(baseAlpha: number, ctx: CanvasRenderingContext2D, engine: GameEngine, W: number, H: number) {
        // Tacking the transition progress we are in 
        let introProgress = 1;
        if (this.phase === Phase.TITLE_EXIT) {
            introProgress = easeOutBack(Math.min(this.phaseTimer / (TITLE_EXIT_DURATION * 0.15), 1));
        }

        const activeAlpha = baseAlpha * introProgress;

        // The Vignette 
        const revealRadius = (1 - baseAlpha) * W * 1.5;
        const maskGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(revealRadius, W));
        const dark = `rgba(7, 8, 13, ${activeAlpha * 0.7})`; 
        const transparent = `rgba(7, 8, 13, 0)`;
        maskGrad.addColorStop(0, transparent);
        maskGrad.addColorStop(0.4, transparent); 
        maskGrad.addColorStop(1, dark);
        ctx.fillStyle = maskGrad;
        ctx.fillRect(0, 0, W, H);

        // Ensures sun is here
        if (activeAlpha > 0.1) {
            const sunMask = ctx.createLinearGradient(0, 0, 0, H * 0.32);
            sunMask.addColorStop(0, `rgba(7, 8, 13, ${activeAlpha * 0.9})`);
            sunMask.addColorStop(1, "rgba(7, 8, 13, 0)");
            ctx.fillStyle = sunMask;
            ctx.fillRect(0, 0, W, H * 0.32);
        }

        // The movie bars style
        const barHeightPercent = 0.07;
        const barH = H * barHeightPercent * introProgress * Math.min(1, baseAlpha * 1.5); 
        ctx.fillStyle = "#07080d";
        ctx.globalAlpha = 1; 
        ctx.fillRect(0, 0, W, barH);
        ctx.fillRect(0, H - barH, W, barH);
        
        ctx.globalAlpha = baseAlpha;
    }


    /**
     * Drawing the animation path of the dummy player
     */
    drawingAnimationPath(ctx: CanvasRenderingContext2D, engine: GameEngine, W: number) {
        const worldUnitPx = W / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        // Drawing the connected lines from the points
        for (let wx = this.WALK_WAYPOINTS[0][0]; wx <= this.WALK_WAYPOINTS[this.WALK_WAYPOINTS.length - 1][0]; wx += 0.1) {
            const wy = this.getInterpolatedY(wx);
            const sx = (wx - engine.viewportX) * worldUnitPx;
            const sy = (wy - engine.viewportY) * worldUnitPx;
            wx === this.WALK_WAYPOINTS[0][0] ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Draw waypoint dots
        ctx.fillStyle = "red";
        for (const [wx, wy] of this.WALK_WAYPOINTS) {
            const sx = (wx - engine.viewportX) * worldUnitPx;
            const sy = (wy - engine.viewportY) * worldUnitPx;
            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Drwaing the title/intro screen of the gamea
     */
    private drawTitleScreen(ctx: CanvasRenderingContext2D, W: number, H: number, baseAlpha: number): void {
        ctx.globalAlpha = baseAlpha;

        ctx.fillStyle = "#07080d";
        ctx.fillRect(0, 0, W, H);

        // the ground fog 
        const groundGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
        groundGrad.addColorStop(0, "rgba(10, 18, 35, 0)");
        groundGrad.addColorStop(1, "rgba(10, 18, 35, 0.7)");
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, 0, W, H);

        // Snow effect
        for (const p of this.particles) {
            ctx.globalAlpha = baseAlpha * p.opacity;
            ctx.fillStyle   = "#c8ddf0";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = baseAlpha;

        // The vignette look 
        const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, "rgba(0,0,0,0.82)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";


        // Title glow
       const titleSize = W * 0.09;
        ctx.font = `bold ${titleSize}px monospace`;
        ctx.globalAlpha = baseAlpha * 0.18 * this.flickerAlpha;
        ctx.fillStyle = "#4a90b8";
        ctx.fillText("STEEP", W / 2 + 3, H * 0.45 + 3);
        // Title text itself 
        ctx.globalAlpha = baseAlpha * this.flickerAlpha;
        ctx.fillStyle = "#dde8f0";
        ctx.fillText("STEEP", W / 2, H * 0.45);
        ctx.globalAlpha = baseAlpha;

        // The red underline under the title
        const titleW     = ctx.measureText("STEEP").width;
        const underlineY = H * 0.45 + titleSize * 0.12;
        const scarGrad   = ctx.createLinearGradient(W / 2 - titleW / 2, 0, W / 2 + titleW / 2, 0);
        scarGrad.addColorStop(0,   "rgba(192, 57, 43, 0)");
        scarGrad.addColorStop(0.2, "rgba(192, 57, 43, 0.9)");
        scarGrad.addColorStop(0.8, "rgba(192, 57, 43, 0.9)");
        scarGrad.addColorStop(1,   "rgba(192, 57, 43, 0)");
        ctx.fillStyle = scarGrad;
        ctx.fillRect(W / 2 - titleW / 2, underlineY, titleW, 3);

        // sub text
        const subSize = W * 0.022;
        ctx.font      = `${subSize}px monospace`;
        ctx.fillStyle = "#6a7a8a";
        ctx.fillText("A Zombie Survival", W / 2, H * 0.58);
        ctx.fillText("The world has fallen.  You have not.", W / 2, H * 0.58 + subSize + 10);

        // The pusling prompt
        const pulse = Math.abs(Math.sin(performance.now() / 600));
        ctx.globalAlpha = baseAlpha * pulse;
        ctx.fillStyle   = "#c0392b";
        ctx.font        = `${W * 0.025}px monospace`;
        ctx.fillText("[ PRESS ENTER OR CLICK TO BEGIN ]", W / 2, H * 0.72);

        // Border lines
        ctx.globalAlpha = baseAlpha * 0.35;
        ctx.fillStyle   = "#4a90b8";
        ctx.fillRect(0, 0, W, 2);
        ctx.fillRect(0, H - 2, W, 2);

        ctx.globalAlpha = 1;
        ctx.textAlign   = "left";
    }

    /**
     * Method to draw our dummy player sprite for our intro animation
     */
    private drawFakePlayer(ctx: CanvasRenderingContext2D, engine: GameEngine, W: number, H: number, baseAlpha: number): void {
        const worldUnitPx = W / GameEngine.WORLD_UNITS_IN_VIEWPORT;
        const mountain = engine.getUniqueEntityByTag("mountain") as any;

        let playerSprite: HTMLImageElement | null = null;
        let snowboardSprite: HTMLImageElement | null = null;
        try {
            playerSprite = engine.getSprite(new ImagePath("res/img/soldiers/Soldier_1/Idle.png"));
            snowboardSprite = engine.getSprite(new ImagePath("res/img/snowboard.png"));
        } catch { return; }

        // Drawing the dummy player snowboard
        if (snowboardSprite && mountain) {
            ctx.save();
            const boardWorldW = 5;
            const boardScale = (boardWorldW * worldUnitPx) / snowboardSprite.width;
            const boardW = snowboardSprite.width * boardScale;
            const boardH = snowboardSprite.height * boardScale;

            const screenX = (this.playerWalkX - engine.viewportX) * worldUnitPx;
            const screenY = (this.playerWalkY - engine.viewportY) * worldUnitPx;

            const normal = mountain.getNormalAt(this.playerWalkX);
            const tan = { x: normal.y, y: -normal.x };
            if (tan.x < 0) { tan.x *= -1; tan.y *= -1; }
            const rotation = Math.atan2(tan.y, tan.x);

            ctx.globalAlpha = baseAlpha;
            ctx.translate(screenX - .1, screenY - boardH - .3);
            ctx.rotate(rotation);
            ctx.drawImage(snowboardSprite, -boardW / 2, -boardH / 2, boardW, boardH);
            ctx.restore();
        }

        // Drawing the dummy player
        const FRAME_W = 128;
        const FRAME_H = 128;
        const scale = (10 * worldUnitPx) / FRAME_W;
        const drawW = FRAME_W * scale;
        const drawH = FRAME_H * scale;
        const screenX = (this.playerWalkX - engine.viewportX) * worldUnitPx - drawW / 2;
        const screenY = (this.playerWalkY - engine.viewportY) * worldUnitPx - drawH * 1.05;

        ctx.globalAlpha = baseAlpha;
        ctx.drawImage(playerSprite, this.playerFrame * FRAME_W, 0, FRAME_W, FRAME_H, screenX, screenY, drawW, drawH);
    }

    /**
     * Drawing the GO 
     */
    private drawGoFlash(ctx: CanvasRenderingContext2D, W: number, H: number, baseAlpha: number): void {
        const alpha = Math.max(0, this.goAlpha) * baseAlpha;
        if (alpha <= 0) return;

        // The red screen
        ctx.globalAlpha = alpha * 0.10;
        ctx.fillStyle   = "#c0392b";
        ctx.fillRect(0, 0, W, H);
        const fontSize = W * 0.13;
        ctx.font       = `bold ${fontSize}px monospace`;
        ctx.textAlign  = "center";

        // glowing pass
        ctx.globalAlpha = alpha * 0.22;
        ctx.fillStyle   = "#ff6644";
        ctx.fillText("GO!", W / 2 + 5, H * 0.5 + 5);

        // main text
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = "#ffffff";
        ctx.fillText("GO!", W / 2, H * 0.5);

        // the undderline
        const textW = ctx.measureText("GO!").width;
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle   = "#c0392b";
        ctx.fillRect(W / 2 - textW / 2, H * 0.5 + fontSize * 0.1, textW, 4);

        ctx.globalAlpha = 1;
        ctx.textAlign   = "left";
    }

    /**
     * Used by the background to know part of the animation we are in 
     */
    public getAlpha(): number {
        return this.alpha;
    }

    /**
     * method to help spawn them in the animation 
     */
    private spawnCinemaZombies(): void {
        const engine = GameEngine.g_INSTANCE;
        const mountain = engine.getUniqueEntityByTag("mountain") as any;
        const player = engine.getUniqueEntityByTag("player");
        if (!player || !mountain) return;

        const types: Array<'basic' | 'fast' | 'giant'> = ['basic', 'fast', 'giant', 'basic', 'fast'];
        this.cinemaZombies = types.map((type, i) => {
            const worldX = this.viewportXPanFrom + 3 + i * 6;
            const worldY = mountain.getHeightAt(worldX);
            return { worldX, worldY, frameTimer: 0, frame: Math.floor(Math.random() * 8), type };
        });
    }


    /**
     * Method to draw the animated zombies
     */
    private drawCinemaZombies(ctx: CanvasRenderingContext2D, engine: GameEngine, W: number, H: number, baseAlpha: number): void {
        const worldUnitPx = W / GameEngine.WORLD_UNITS_IN_VIEWPORT;

        // Differnet types of zombies
        const SPRITE_MAP = {
            basic: "res/img/zombies/Zombie Man/Run.png",
            fast:  "res/img/zombies/Wild Zombie/Run.png",
            giant: "res/img/zombies/Zombie Woman/Run.png",
        };

        // Each zombie frame settings
        const FRAME_INFO = {
            basic: { fw: 96, fh: 96, frames: 10, scale: 10 },
            fast:  { fw: 96, fh: 96, frames: 10, scale: 10 },
            giant: { fw: 96, fh: 96, frames: 10, scale: 10 },
        };

        // For each zombie, then draw them out 
        for (const zombie of this.cinemaZombies) {
            let sprite: HTMLImageElement | null = null;
            try {
                sprite = engine.getSprite(new ImagePath(SPRITE_MAP[zombie.type]));
            } catch { continue; }

            const info = FRAME_INFO[zombie.type];
            const scale = (info.scale * worldUnitPx) / info.fw;
            const drawW = info.fw * scale;
            const drawH = info.fh * scale;

            const screenX = (zombie.worldX - engine.viewportX) * worldUnitPx - drawW / 2;
            const screenY = (zombie.worldY - engine.viewportY) * worldUnitPx - drawH;

            ctx.globalAlpha = baseAlpha;
            ctx.drawImage(
                sprite,
                zombie.frame * info.fw, 0,   
                info.fw, info.fh,
                screenX, screenY,
                drawW, drawH
            );
        }
    }

    /**
     * Method to calcualte a semi releastic path between the points
     * for my fake player animation 
     */
    private getInterpolatedY(x: number): number {
        const pts = this.WALK_WAYPOINTS;
        if (x <= pts[0][0]) return pts[0][1];
        if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];

        for (let i = 0; i < pts.length - 1; i++) {
            const [x0, y0] = pts[i];
            const [x1, y1] = pts[i + 1];
            if (x >= x0 && x <= x1) {
                const t = (x - x0) / (x1 - x0);

                const [, yPrev] = i > 0 ? pts[i - 1] : [0, y0];
                const [, yNext] = i < pts.length - 2 ? pts[i + 2] : [0, y1];

                const m0 = (y1 - yPrev) * 0.5;
                const m1 = (yNext - y0) * 0.5;

                const t2 = t * t;
                const t3 = t2 * t;

                return (2*t3 - 3*t2 + 1) * y0
                    + (t3 - 2*t2 + t)   * m0
                    + (-2*t3 + 3*t2)    * y1
                    + (t3 - t2)         * m1;
            }
        }
        return pts[pts.length - 1][1];
    }
}