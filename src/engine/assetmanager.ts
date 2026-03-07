import { AudioManager } from "./AudioManager.js";
import { ResourcePath } from "./types.js";

export class AssetManager {
    private m_successCount: number;
    private m_errorCount: number;

    private m_imageCache: Record<ResourcePath, HTMLImageElement>;
    private m_audioBufferCache: Record<ResourcePath, AudioBuffer>;

    private m_downloadQueue: string[];
    private m_shaderSourceCache: Record<ResourcePath, string>;

    constructor() {
        this.m_successCount = 0;
        this.m_errorCount = 0;

        this.m_imageCache = {};
         this.m_audioBufferCache = {};

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
                case 'mp3':
                case 'wav':
                case 'ogg':
                    fetch(path)
                        .then(response => response.arrayBuffer())
                        .then(arrayBuffer => AudioManager.getAudioContext().decodeAudioData(arrayBuffer))
                        .then(decodedBuffer => {
                            this.m_audioBufferCache[ResourcePath.of(path)] = decodedBuffer;
                            console.log("Loaded audio buffer: " + path);
                            this.m_successCount++;
                            if (this.isDone()) callback(this.m_errorCount, this.m_successCount);
                        })
                        .catch(err => {
                            console.error("Error loading audio: " + path, err);
                            this.m_errorCount++;
                            if (this.isDone()) callback(this.m_errorCount, this.m_successCount);
                        });
                    break;
                default:
                    throw new Error("Unkown asset type!");
            }
        }
    };

    getShaderSource(name: ShaderPath): string | undefined {
        return this.m_shaderSourceCache[name.asRaw()];
    };

    getImage(path: ImagePath): HTMLImageElement | undefined {
        return this.m_imageCache[path.asRaw()];
    };

    getAudio(path: AudioPath): AudioBuffer | undefined {
        return this.m_audioBufferCache[path.asRaw()];
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