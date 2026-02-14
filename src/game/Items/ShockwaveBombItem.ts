import { ImagePath } from "../../engine/assetmanager.js";
import { GameEngine } from "../../engine/gameengine.js";
import { unwrap } from "../../engine/util.js";
import { Player } from "../worldEntities/player.js";
import { Buff, BuffType } from "./Buff.js";

export class ShockwaveBombItem implements Buff {
    type: BuffType = BuffType.INSTANT_APPLY;
    tag: string = "ShockwaveBombItem";
    sprite: ImagePath = new ImagePath("res/img/items/bomb.png"); 

    onApply(): void {
        const player = unwrap(GameEngine.g_INSTANCE.getUniqueEntityByTag("player")) as Player;
        const blastRadius = 5000;
        const blastForce = 2500; 

        // ALl zombies types tags
        const zombieTags = ["zombie", "BasicZombie", "ThrowerZombie", "FastZombie", "ExplodingZombie", "GiantZombie"];
        
        zombieTags.forEach(tag => {
            const enemies = GameEngine.g_INSTANCE.getEntitiesByTag(tag);
            
            enemies.forEach(enemy => {
                const dx = enemy.position.x - player.position.x;
                const dy = enemy.position.y - player.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < blastRadius && distance > 0) {
                    const dirX = dx / distance;
                    
                    // Applying the force both x andy 
                    enemy.velocity.x += dirX * blastForce;
                    enemy.velocity.y = -1200; 
                }
            });
        });
    }
}