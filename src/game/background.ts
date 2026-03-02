import { GameEngine } from "../engine/gameengine.js";
import { DrawLayer } from "../engine/types.js";
import { Vec2 } from "../engine/Vec2.js";
import { BackgroundLayer } from "./backgroundLayer.js";

/**
 * @author JK
 * @description The main background class.
 */
export class Background {

    start(): void {
        this.initBackgroundGround();
        this.initMiddleGround();
        this.initForegroundLayers();
    }

    initBackgroundGround(): void {
        let paths = [
            "res/img/background/background/day.png",
            "res/img/background/background/night.png"
        ];

        // Day/ Night sprites
        GameEngine.g_INSTANCE.addEntity(new BackgroundLayer(
            paths, //paths
            0, //parallaxSpeed
            140, //widthInWorldUnits
            0,  //startX
            40, //startY
            false //spawnRandom
        ), DrawLayer.SKY);
    }

    initMiddleGround(): void {
        // this is used for sky objects like sun and moon
        let paths = [
            "res/img/background/sky/sun.png",
            "res/img/background/sky/moon.png",
        ];

        GameEngine.g_INSTANCE.addEntity(new BackgroundLayer(
            paths, //paths
            0.05, //parallaxSpeed
            40, //widthInWorldUnits
            0,  //startX doesnt matter here
            0, //startY doesnt matter here
            false, //spawnRandom
        ), DrawLayer.BACKGROUND);

        // this is used for mountains
        paths = [
            "res/img/background/middleground/middle1.png",
            "res/img/background/middleground/middle2.png",
            "res/img/background/middleground/middle3.png",
            "res/img/background/middleground/middle4.png",
            "res/img/background/middleground/middle5.png"
        ];

        GameEngine.g_INSTANCE.addEntity(new BackgroundLayer(
            paths, //paths
            0.00001, //parallaxSpeed
            GameEngine.WORLD_UNITS_IN_VIEWPORT, //widthInWorldUnits
            -7,  //startX
            30, //startY
            true //spawnRandom
        ), DrawLayer.BACKGROUND);
    }

    initForegroundLayers() {
        let paths = [
            "res/img/background/foreground/fore1.png",
            "res/img/background/foreground/fore2.png",
            "res/img/background/foreground/fore3.png",
            "res/img/background/foreground/fore4.png",
            "res/img/background/foreground/fore5.png"
        ];

        GameEngine.g_INSTANCE.addEntity(new BackgroundLayer(
            paths, //paths
            0.002, //parallaxSpeed
            GameEngine.WORLD_UNITS_IN_VIEWPORT, //widthInWorldUnits
            0,  //startX
            40, //startY
            true //spawnRandom
        ), DrawLayer.FOREGROUND);
    }
}
