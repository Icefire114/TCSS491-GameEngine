import { AudioPath } from "./assetmanager.js";
import { GameEngine } from "./gameengine.js";
import { AssetManager } from "./assetmanager.js";

export class AudioManager {
    private static m_audioContext = new AudioContext();
    private static m_masterGain: GainNode;
    private static m_musicGain: GainNode;
    private static m_sfxGain: GainNode;
    private static isAudioMuted: boolean = false;
    private static sliderValue: number = 0.5; // default volume level (50%)
    private static assetManager: AssetManager;
    private static activeSources: Map<string, AudioBufferSourceNode>;

    /**
     * Init method to start audio manager
     */
    static init(assetManager: AssetManager): void {
        if (AudioManager.assetManager) {
            throw new Error("AudioManager has already been initialized!");
        }

        AudioManager.assetManager = assetManager;

        AudioManager.activeSources = new Map();
        AudioManager.m_masterGain = AudioManager.m_audioContext.createGain();
        AudioManager.m_musicGain = AudioManager.m_audioContext.createGain();;
        AudioManager.m_sfxGain = AudioManager.m_audioContext.createGain();;

        // Default volumes
        AudioManager.m_masterGain.gain.value = 1;
        AudioManager.m_musicGain.gain.value = 1;
        AudioManager.m_sfxGain.gain.value = 1;

        // Connect graph
        AudioManager.m_musicGain.connect(AudioManager.m_masterGain);
        AudioManager.m_sfxGain.connect(AudioManager.m_masterGain);
        AudioManager.m_masterGain.connect(AudioManager.m_audioContext.destination);

        const muteButton = document.getElementById("muteButton") as HTMLButtonElement;
        muteButton.addEventListener("click", () => {
            AudioManager.toggleMute();

            muteButton.textContent = AudioManager.isAudioMuted ? "AUDIO OFF" : "AUDIO ON";
        });

        const slider = document.getElementById("audioSlider") as HTMLInputElement;
        slider.addEventListener("input", () => {
            AudioManager.sliderValue = parseFloat(slider.value) / 100;
            AudioManager.adjustAudioVolume(AudioManager.sliderValue);
            AudioManager.isAudioMuted = false; // unmute when adjusting volume
            muteButton.textContent = "AUDIO ON";
        });
    }

    /**
     * Plays a sound effect, allowing for multiple overlapping instances of the same sound.
     * @param path the audio path to play, must be preloaded in the asset manager
     * @param volume The volume of this sfx between 0 and 1
     * @param delay The delay in seconds before the sound starts playing. Default is 0 (play immediately).
     */
    static playSFX(path: AudioPath, volume: number = 0.5, delay: number = 0): void {
        const buffer = this.assetManager.getAudio(path);

        if (!buffer) return;

        const source = AudioManager.m_audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = AudioManager.m_audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(AudioManager.m_sfxGain);

        if (delay === 0)
            source.start(0);
        else    
            source.start(AudioManager.m_audioContext.currentTime + delay);
    }

    /**
     * Will play the audioPath only once and never again.
     */
    public static playOnce(path: AudioPath, volume: number = 0.5): void {
        const buffer = this.assetManager.getAudio(path);
        if (!buffer) return;

        const existing = this.activeSources.get(path.asRaw());
        if (existing) return; // if it exists, do nothing

        const source = this.m_audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.m_audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.m_sfxGain);

        source.start();

        this.activeSources.set(path.asRaw(), source);
    }

    /**
     * will play the audiopath with no stacking.
     * If the same audiopath is already playing then it is restarted
     */
   public static playInstanceSFX(key: AudioPath, volume: number = 0.5): void {

        const buffer = this.assetManager.getAudio(key);
        if (!buffer) return;

        // stop previous instance
        const existing = this.activeSources.get(key.asRaw());
        if (existing) {
            try {
                existing.onended = null; // prevent onended from firing after we stop it
                existing.stop(0);
            } catch {}
            this.activeSources.delete(key.asRaw());
        }

        const source = this.m_audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.m_audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.m_sfxGain);

        source.start();

        this.activeSources.set(key.asRaw(), source);

        source.onended = () => {
            if (this.activeSources.get(key.asRaw()) === source) 
                this.activeSources.delete(key.asRaw());
        };
    }

    /**
     *  Will play the audioPath with no stacking.
     * If the same audioPath is already playing, it will do nothing and let the current one play
     */
    public static playLoopingSFX(key: AudioPath, volume: number = 0.5): void {
        const buffer = this.assetManager.getAudio(key);
        if (!buffer) return;

        const existing = this.activeSources.get(key.asRaw());
        if (existing) return; // if already playing, do nothing

        const source = this.m_audioContext.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.m_audioContext.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.m_sfxGain);

        source.start(0);

        this.activeSources.set(key.asRaw(), source);

        source.onended = () => {
            if (this.activeSources.get(key.asRaw()) === source) 
                this.activeSources.delete(key.asRaw());
        };
    }

    /**
     * Stops the looping SFX associated with the given AudioPath, if it is currently playing.
     */
    public static stopLoopingSFX(key: AudioPath): void {
        const buffer = this.assetManager.getAudio(key);
        if (!buffer) return;

        const existing = this.activeSources.get(key.asRaw());
        if (existing) {
            try {
                existing.onended = null; // prevent onended from firing after we stop it
                existing.stop(0);
            } catch {}
            this.activeSources.delete(key.asRaw());
        }
    }

    /**
     * Plays the safezone music in a loop with filters and effects.
     * The music is added to active sources, if it is already playing and this method is 
     * called, nothing happens.
     * 
     * Call stop music with the audio path to stop the music.
     * 
     * @param path the audiopath
     * @param volume Volume between 0 and 1
     */
    static playSafezoneMusic(path: AudioPath, volume: number = 0.5): void {
        const buffer = this.assetManager.getAudio(path);
        if (!buffer) return;

        const existing = this.activeSources.get(path.asRaw());
        if (existing) return; // if already playing, do nothing

        const source = this.m_audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.m_audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 3500; // lower = more muffled audio

        const delay = this.m_audioContext.createDelay();
        delay.delayTime.value = 0.1; // 100ms echo

        // feedback loop - makes the echo repeat and fade out
        const feedback = this.m_audioContext.createGain();
        feedback.gain.value = 0.2; // how many times it echoes, keep below 1.0!

        // filter.Q.value = 10; // adds bass boost at cutoff

        const gainNode = this.m_audioContext.createGain();
        gainNode.gain.value = volume;

        // chain: source -> filter -> gain -> music gain -> destination
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.m_musicGain);

        gainNode.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(this.m_musicGain); // also mix the delayed signal into the output

        //randomize start position
        const offset = AudioManager.m_audioContext.currentTime + Math.random() * buffer.duration;
        source.start(0, offset);

        this.activeSources.set(path.asRaw(), source);
    }

    /**
     * Plays the music in a loop with no filters or effects.
     * The music is added to active sources, if it is already playing and this method is 
     * called, nothing happens.
     * 
     * @param path the audiopath
     * @param volume the volume between 0 and 1
     * @param fadeIn the time in seconds for the music to fade in
     */
    static playMusic(path: AudioPath, volume: number = 0.5, fadeIn: number = 0): void {
        const buffer = this.assetManager.getAudio(path);
        if (!buffer) return;

        const existing = this.activeSources.get(path.asRaw());
        if (existing) return; // if already playing, do nothing

        const source = this.m_audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const gainNode = this.m_audioContext.createGain();

        if (fadeIn > 0) {
            gainNode.gain.value = 0;
            gainNode.gain.linearRampToValueAtTime(
                volume,
                this.m_audioContext.currentTime + fadeIn
            );
        } else {
            gainNode.gain.value = volume;
        }

        source.connect(gainNode);
        gainNode.connect(this.m_musicGain);

        source.start(0);

        this.activeSources.set(path.asRaw(), source);
    }

    /**
     * stops the music associated with the given audiopath if it is playing. If it is not playing, does nothing.
     * @param path the audioPath
     */
    public static stopMusic(path: AudioPath): void {
        const buffer = this.assetManager.getAudio(path);
        if (!buffer) return;

        const existing = this.activeSources.get(path.asRaw());
        if (existing) {
            try {
                existing.onended = null; // prevent onended from firing after we stop it
                existing.stop(0);
            } catch {}
            this.activeSources.delete(path.asRaw());
        }
    }

    public static getSFXGain(): GainNode {
        return AudioManager.m_sfxGain;
    }

    public static getMusicGain(): GainNode {
        return AudioManager.m_musicGain;
    }

    /**
     * Call to mute or unmute all audio and sfx.
     * If currently unmuted, will mute. If currently muted, will unmute.
     */
    public static toggleMute(): void {
        AudioManager.isAudioMuted = !AudioManager.isAudioMuted;
        AudioManager.m_masterGain.gain.value = AudioManager.isAudioMuted ? 0 : AudioManager.sliderValue;
    }

    /**
     * Call to adjust the volume of all audio and sfx
     */
    public static adjustAudioVolume(volume: number): void {
        AudioManager.m_masterGain.gain.value = volume;
    }

    /**
     * Returns the AudioContext used by the AudioManager.
     */
    public static getAudioContext(): AudioContext {
        return AudioManager.m_audioContext;
    }
}