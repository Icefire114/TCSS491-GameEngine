import { ResourcePath } from "./types.js";

export class AssetManager {
    private m_successCount: number;
    private m_errorCount: number;
    private m_cache: Record<ResourcePath, HTMLImageElement>;
    private m_downloadQueue: string[];

    constructor() {
        this.m_successCount = 0;
        this.m_errorCount = 0;
        this.m_cache = {};
        this.m_downloadQueue = [];
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
            const img: HTMLImageElement = new Image();

            console.log(path);

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
            this.m_cache[ResourcePath.of(path)] = img;
        }
    };

    getImage(path: ImagePath): HTMLImageElement | undefined {
        return this.m_cache[path.asRaw()];
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