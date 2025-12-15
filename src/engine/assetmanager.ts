export class AssetManager {
    private successCount: number;
    private errorCount: number;
    private cache: Record<string, HTMLImageElement>;
    private downloadQueue: string[];

    constructor() {
        this.successCount = 0;
        this.errorCount = 0;
        this.cache = {};
        this.downloadQueue = [];
    };

    queueDownload(path: string) {
        console.log("Queueing: " + path);
        this.downloadQueue.push(path);
    };

    isDone() {
        return this.downloadQueue.length === this.successCount + this.errorCount;
    };

    /**
     * Downloads all stored assets
     * @param callback Called when all assets are downloaded
     */
    downloadAll(callback: (errorCount: number, successCount: number) => void) {
        if (this.downloadQueue.length === 0) setTimeout(callback, 10, this.errorCount, this.successCount);

        for (const path in this.downloadQueue) {
            const img: HTMLImageElement = new Image();

            console.log(path);

            img.addEventListener("load", () => {
                console.log("Loaded: " + img.src);
                this.successCount++;
                if (this.isDone()) callback(this.errorCount, this.successCount);
            });

            img.addEventListener("error", () => {
                console.error("Error loading: " + img.src);
                this.errorCount++;
                if (this.isDone()) callback(this.errorCount, this.successCount);
            });

            img.src = path;
            this.cache[path] = img;
        }
    };

    getAsset(path: string): HTMLImageElement {
        return this.cache[path];
    };
};

