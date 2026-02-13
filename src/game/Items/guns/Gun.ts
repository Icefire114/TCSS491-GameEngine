import { Bullet } from "../../worldEntities/bullets/Bullet";

export abstract class Gun {
    tag: string;

    ammoOnHand: number; // total ammo the player has for this gun (not including what's currently loaded)
    ammoInGun: number; // current ammo in the gun
    magSize: number;
    fireRate: number; // in shots per second
    lastShotTime: number = 0;
    isReloading: boolean = false;
    reloadTime: number; // in seconds

    constructor(tag: string, ammo: number, magSize: number, fireRate: number, reloadTime: number) {
        this.tag = tag;
        this.magSize = magSize;
        this.ammoInGun = magSize;
        this.ammoOnHand = ammo;
        this.fireRate = fireRate;
        this.reloadTime = reloadTime;
    }

    canShoot(currentTime: number): boolean {
        if (this.isReloading) return false;
        if (this.ammoInGun <= 0) return false;

        const timeSinceLastShot = currentTime - this.lastShotTime;
        const shotCooldown = 1000 / this.fireRate; // convert fire rate to milliseconds

        return timeSinceLastShot >= shotCooldown;
    }

    shoot(startX: number, startY: number, targetX: number, targetY: number, currentTime: number): Bullet | null {
        if (!this.canShoot(currentTime)) {
            return null;
        }

        this.ammoInGun--;
        this.lastShotTime = currentTime;

        return this.createBullet(startX, startY, targetX, targetY);
    }

    reload(): void {
        if (this.isReloading || this.ammoInGun === this.magSize) return;
        
        this.isReloading = true;
        setTimeout(() => {
            const ammoToReload = this.magSize - this.ammoInGun;
            if (this.ammoOnHand >= ammoToReload) {
                this.ammoInGun = this.magSize;
                this.ammoOnHand -= ammoToReload;
            } else {
                this.ammoInGun += this.ammoOnHand;
                this.ammoOnHand = 0;
            }
            this.isReloading = false;
        }, this.reloadTime * 1000);
    }

    protected abstract createBullet(startX: number, startY: number, targetX: number, targetY: number): Bullet;
}