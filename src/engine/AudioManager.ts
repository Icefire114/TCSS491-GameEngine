import { AudioPath } from "./assetmanager.js";
import { GameEngine } from "./gameengine.js";

export class AudioManager {
    static playSFX(path: AudioPath, volume: number = 0.5, loop: boolean = false): void {
        const audio = GameEngine.g_INSTANCE.getAudio(path);
        audio.volume = volume;
        audio.loop = loop;
        audio.play();
    }

    static playMusic(path: AudioPath, volume: number = 0.5, loop: boolean = true): void {
        const audio = GameEngine.g_INSTANCE.getAudio(path);
        audio.volume = volume;
        audio.loop = loop;
        audio.play();
    }

    static stop(path: AudioPath): void {
        const audio = GameEngine.g_INSTANCE.getAudio(path);
        audio.pause();
        audio.currentTime = 0;
    }
}