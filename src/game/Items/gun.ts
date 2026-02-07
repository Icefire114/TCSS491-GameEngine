import { ImagePath } from "../../engine/assetmanager.js"

export type Gun = {
    // Should be unique per gun.
    tag: string,
    sprite: ImagePath,


    onShoot(): void
}