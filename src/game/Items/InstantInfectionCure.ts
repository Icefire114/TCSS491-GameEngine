import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { clamp, unwrap } from "../../engine/util.js";
import { Player } from "../worldEntities/player.js";
import { Buff, BuffType } from "./Buff.js";

export class InstantInfectionCureBuff implements Buff {
    type: BuffType = BuffType.INSTANT_APPLY;
    tag: string = "InstantHealthItem";
    sprite: ImagePath = new ImagePath("res/img/items/instant_health_pickup.png");

    onApply(): void {
        const player: Player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player"), "Could not find player entity!") as Player

        player.infection = clamp(player.infection - 40, 0, player.infection);
    }
}
