import { ImagePath } from "../../../engine/assetmanager.js";
import { Entity, EntityID } from "../../../engine/Entity.js";
import { GameEngine } from "../../../engine/gameengine.js";
import { BoxCollider } from "../../../engine/physics/BoxCollider.js";
import { Collidable } from "../../../engine/physics/Collider.js";
import { Vec2 } from "../../../engine/Vec2.js";
import { unwrap } from "../../../engine/util.js";
import { ArmoryUI } from "./ArmoryUI.js";
import { G_CONFIG } from "../../CONSTANTS.js";
import { UILayer } from "../../UI.js";
import { Player } from "../player.js";
import { AnimationState, Animator } from "../../../engine/Animator.js";

export class Armory implements Entity, Collidable {
    public tag: string = "Armory";
    public id: EntityID;
    public position: Vec2;
    public velocity: Vec2 = new Vec2();
    public physicsCollider: BoxCollider;
    public sprite: ImagePath = new ImagePath("res/img/safe_zone/armory.png");
    public removeFromWorld: boolean = false;
    private size: Vec2 = new Vec2(20, 20);

    private animator = new Animator(
        [
            [
                {
                    sprite: this.sprite,
                    frameCount: 10,
                    frameWidth: 158,
                    frameHeight: 200,
                },
                AnimationState.IDLE
            ]
        ],
        this.size
    )

    constructor(pos: Vec2) {
        this.id = `${this.tag}#${crypto.randomUUID()}`;
        this.position = pos;
        this.physicsCollider = new BoxCollider(this.size.x, this.size.y);
    }

    draw(ctx: CanvasRenderingContext2D, game: GameEngine): void {
        // game.renderer.drawRawSpriteAtWorldPos(
        //     this.position,
        //     game.getSprite(this.sprite),
        //     this.size
        // );
        this.animator.drawCurrentAnimFrameAtPos(this.position);

        if (G_CONFIG.DRAW_SAFEZONE_BB) {
            game.renderer.drawRectAtWorldPos(
                Vec2.compSub(this.position, new Vec2(this.size.x / 2, 0)),
                this.size,
                "rgba(183, 0, 255,0)",
                "rgb(183, 0, 255)",
                2
            );
        }
    }

    private isPlayerTouching(): boolean {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;
        return this.physicsCollider.collides(this, player);
    }

    update(keys: { [key: string]: boolean; }, deltaTime: number, clickCoords: Vec2): void {
        this.animator.updateAnimState(AnimationState.IDLE, deltaTime);

        const UI: UILayer = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("UI_LAYER")) as UILayer;
        const armory_ui: ArmoryUI = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("armory_ui")) as ArmoryUI;
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;
        UI.drawOpenArmoryPrompt = this.isPlayerTouching();
        if (UI.drawOpenArmoryPrompt && keys['e']) {
            armory_ui.isOpen = !armory_ui.isOpen;
            player.uiOpen = armory_ui.isOpen;
            keys['e'] = false;
        }
        if (!UI.drawOpenArmoryPrompt && armory_ui.isOpen) {
            armory_ui.isOpen = false;
            player.uiOpen = armory_ui.isOpen;
        }
    }
}