import { AudioPath } from "./assetmanager";

export class AudioManager {
    static playSFX(path: AudioPath, volume: number = 0.5, loop: boolean = false): void {
        const audio = new Audio(path.asRaw());
        audio.volume = volume;
        audio.loop = loop;
        audio.play();
    }

    static playMusic(path: AudioPath, volume: number = 0.5, loop: boolean = true): void {
        const audio = new Audio(path.asRaw());
        audio.volume = volume;
        audio.loop = loop;
        audio.play();
    }

    static stop(path: AudioPath): void {
        const audio = new Audio(path.asRaw());
        audio.pause();
        audio.currentTime = 0;
    }
}