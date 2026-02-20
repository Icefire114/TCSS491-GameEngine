import { ResourcePath } from "./types.js";

export class AssetManager {
    private m_successCount: number;
    private m_errorCount: number;
    private m_imageCache: Record<ResourcePath, HTMLImageElement>;
    private m_audioCache: Record<ResourcePath, HTMLAudioElement>;
    private m_downloadQueue: string[];
    private m_shaderSourceCache: Record<ResourcePath, string>;

    constructor() {
        this.m_successCount = 0;
        this.m_errorCount = 0;
        this.m_imageCache = {};
        this.m_audioCache = {};
        this.m_downloadQueue = [];
        this.m_shaderSourceCache = {};
    };

    queueDownload(path: string) {
        console.log("Queueing: " + path);
        this.m_downloadQueue.push(path);
    };

    isDone() {
        return this.m_downloadQueue.length === this.m_successCount + this.m_errorCount;
    };

    /**
     * Downloads all stored assets
     * @param callback Called when all assets are downloaded
     */
    downloadAll(callback: (errorCount: number, successCount: number) => void) {
        if (this.m_downloadQueue.length === 0) setTimeout(callback, 10, this.m_errorCount, this.m_successCount);

        for (const path of this.m_downloadQueue) {
            console.log(path);
            const ext = path.split('.').pop()?.toLowerCase();

            switch (ext) {
                case 'glsl':
                    fetch(path)
                        .then(r => r.ok ? r.text() : Promise.reject(r.statusText))
                        .then(src => {
                            this.m_shaderSourceCache[ResourcePath.of(path)] = src;
                            console.log("Loaded: " + path);
                            this.m_successCount++;
                            if (this.isDone()) callback(this.m_errorCount, this.m_successCount);
                        })
                        .catch((err) => {
                            console.error("Error loading shader: " + path + " Reason: " + err);
                            this.m_errorCount++;
                            if (this.isDone()) callback(this.m_errorCount, this.m_successCount);
                        });
                    break;
                case 'jpg':
                case 'jpeg':
                case 'png':
                    const img: HTMLImageElement = new Image();
                    img.addEventListener("load", () => {
                        console.log("Loaded: " + img.src);
                        this.m_successCount++;
                        if (this.isDone()) callback(this.m_errorCount, this.m_successCount);
                    });

                    img.addEventListener("error", () => {
                        console.error("Error loading: " + img.src);
                        this.m_errorCount++;
                        if (this.isDone()) callback(this.m_errorCount, this.m_successCount);
                    });

                    img.src = path;
                    this.m_imageCache[ResourcePath.of(path)] = img;
                    break;
                case 'ogg':
                    const audio: HTMLAudioElement = new Audio();
                    audio.addEventListener("loadeddata", () => {
                        console.log("Loaded: " + audio.src);
                        this.m_successCount++;
                        if (this.isDone()) callback(this.m_errorCount, this.m_successCount);
                    });

                    audio.addEventListener("error", () => {
                        console.error("Error loading: " + audio.src);
                        this.m_errorCount++;
                        if (this.isDone()) callback(this.m_errorCount, this.m_successCount);
                    });

                    audio.addEventListener("ended", () => {
                        audio.pause();
                        audio.currentTime = 0;
                    });

                    audio.src = path;
                    audio.load();

                    this.m_audioCache[ResourcePath.of(path)] = audio;
                    break;
            }
        }
    };

    getShaderSource(name: ShaderPath): string | undefined {
        return this.m_shaderSourceCache[name.asRaw()];
    };

    getImage(path: ImagePath): HTMLImageElement | undefined {
        return this.m_imageCache[path.asRaw()];
    };

    getAudio(path: AudioPath): HTMLAudioElement | undefined {
        return this.m_audioCache[path.asRaw()];
    };

    playAudio(path: AudioPath): void {
        console.log(`audio key: ${path.asRaw()}`);
        console.log(`cache keys: ${Object.keys(this.m_audioCache)}`);
        const audio = this.m_audioCache[path.asRaw()];
        audio.currentTime = 0;
        audio.play();
    };

    muteAudio(mute: boolean): void {
        for (const [key, audio] of Object.entries(this.m_audioCache)) {
            audio.muted = mute;
        }
    };

    adjustAudioVolume(volume: number): void {
        for (const [key, audio] of Object.entries(this.m_audioCache)) {
            audio.volume = volume;
        }
    };

    autoRepeatAudio(path: AudioPath): void {
        const audio = this.m_audioCache[path.asRaw()];
        audio.addEventListener("ended", () => {
            audio.play();
        });
    };
};

/**
 * Represents a path to an image, eg. for using as a sprite.
 */
export class ImagePath {
    private path: ResourcePath;

    constructor(path: string) {
        if (!(path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg"))) {
            throw new Error("Image path must be a path to an actual image!");
        }
        this.path = ResourcePath.of(path);
    }

    /**
     * @returns The raw `ResourcePath` of this current `ImagePath`.
     */
    asRaw(): ResourcePath {
        return this.path;
    }
}

export class ShaderPath {
    private path: ResourcePath;

    constructor(path: string) {
        if (!(path.endsWith(".glsl"))) {
            throw new Error("Shader path must be a path to an actual shader file!");
        }
        this.path = ResourcePath.of(path);
    }

    asRaw(): ResourcePath {
        return this.path;
    }
}

/**
 * Represents a path to an audio file, eg. for using as a sound effect or music.
 */
export class AudioPath {
    private path: ResourcePath;

    constructor(path: string) {
        if (!(path.endsWith(".ogg") || path.endsWith(".mp3") || path.endsWith(".wav"))) {
            throw new Error("Audio path must be a path to an actual audio file!");
        }
        this.path = ResourcePath.of(path);
    }

    /**
     * @returns The raw `ResourcePath` of this current `AudioPath`.
     */
    asRaw(): ResourcePath {
        return this.path;
    }
}