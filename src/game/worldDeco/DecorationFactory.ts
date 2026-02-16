import { GameEngine } from "../../engine/gameengine.js";
import { Vec2 } from "../../engine/types.js";
import { Bush } from "./Bush.js";
import { FireBarrel } from "./FireBarrel.js";
import { Rock } from "./Rock.js";
import { Tree } from "./Tree.js";

export namespace DecoFactory {
    export function createBush(pos: Vec2): Bush {
        return new Bush(pos);
    }

    export function createRock(pos: Vec2, scale: number = 1): Rock {
        return new Rock(pos, scale);
    }

    export function createTree(pos: Vec2): Tree {
        return new Tree(pos);
    }

    export function createFireBarrel(pos: Vec2): FireBarrel {
        return new FireBarrel(pos, 0.075);
    }
}