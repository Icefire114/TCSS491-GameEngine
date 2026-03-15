import { ImagePath } from "../../../engine/assetmanager.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";
import { Zombie } from "../../zombies/Zombie.js";
import { Bullet } from "./Bullet.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { Player } from "../player.js";

/**
 * @description Boss ice beam projectile.
 */
export class IceBeamBullet extends Bullet {
    public tag: string = "IceBeamBullet";
    public physicsCollider = new BoxCollider(4, 2);
    public sprite: ImagePath = new ImagePath("res/img/ammo/SingleIce.png");
    public removeFromWorld: boolean = false;
    public damage: number;

    private hitPlayer = false;

    animator: Animator = new Animator(
        [
            [
                {
                    sprite: this.sprite,
                    frameCount: 1,
                    frameHeight: 1024,
                    frameWidth: 1536,
                    offestX: 0
                },
                AnimationState.IDLE
            ]
        ],
        { x: 4, y: 2 }
    );

    constructor(startX: number, startY: number, angle: number, damage: number) {
        super("IceBeamBullet", startX, startY, angle);
        this.damage = damage;
    }

    protected onEnemyHit(target: Entity): void {
  
    }

    onTerrainHit(): void {
        this.removeFromWorld = true;
    }

    shouldRemoveOnHit(): boolean {
        return false;
    }

    update(keys: { [key: string]: boolean }, deltaTime: number): void {
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);
        super.update(keys, deltaTime);

        const player = GameEngine.g_INSTANCE.getUniqueEntityByTag("player") as Player | undefined;
        if (!player) return;

        if (!this.hitPlayer && this.physicsCollider.collides(this, player)) {
            this.hitPlayer = true;
            player.damagePlayer(this.damage, "Health");
        }
    }
}
