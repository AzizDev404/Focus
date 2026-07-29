import { Howl } from 'howler'
import { ALERT_SOUNDS, getSound, type SoundDef } from '../data/catalog'

type NoiseType = 'white' | 'pink' | 'brown'

class HowlerAudioEngine {
  private howls = new Map<string, Howl>()
  private noiseCtx: AudioContext | null = null
  private noiseNodes = new Map<string, { stop: () => void }>()
  private masterVolume = 1

  private ensureCtx(): AudioContext {
    if (!this.noiseCtx) this.noiseCtx = new AudioContext()
    if (this.noiseCtx.state === 'suspended') void this.noiseCtx.resume()
    return this.noiseCtx
  }

  private createNoise(type: NoiseType, volume: number): () => void {
    const ctx = this.ensureCtx()
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let b0 = 0,
      b1 = 0,
      b2 = 0
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1
      if (type === 'white') data[i] = w * 0.35
      else if (type === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179
        b1 = 0.99332 * b1 + w * 0.0750759
        b2 = 0.969 * b2 + w * 0.153852
        data[i] = (b0 + b1 + b2 + w * 0.5362) * 0.11
      } else {
        b0 = (b0 + 0.02 * w) / 1.02
        data[i] = b0 * 3.5
      }
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const gain = ctx.createGain()
    gain.gain.value = volume * this.masterVolume
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start()
    return () => {
      try {
        source.stop()
      } catch {
        /* */
      }
    }
  }

  private playBinaural(wave: string, volume: number): () => void {
    const ctx = this.ensureCtx()
    const freqs: Record<string, number> = {
      alpha: 10,
      beta: 20,
      gamma: 40,
      theta: 6,
      delta: 2,
    }
    const beat = freqs[wave] ?? 10
    const carrier = ctx.createOscillator()
    const beatOsc = ctx.createOscillator()
    const gain = ctx.createGain()
    carrier.frequency.value = 200
    beatOsc.frequency.value = 200 + beat
    carrier.type = 'sine'
    beatOsc.type = 'sine'
    gain.gain.value = volume * 0.08 * this.masterVolume
    carrier.connect(gain)
    beatOsc.connect(gain)
    gain.connect(ctx.destination)
    carrier.start()
    beatOsc.start()
    return () => {
      carrier.stop()
      beatOsc.stop()
    }
  }

  playSound(soundId: string, volume: number) {
    this.stopSound(soundId)
    const def = getSound(soundId)
    if (!def) return

    if (def.kind === 'noise-white') {
      this.noiseNodes.set(soundId, { stop: this.createNoise('white', volume) })
      return
    }
    if (def.kind === 'noise-pink') {
      this.noiseNodes.set(soundId, { stop: this.createNoise('pink', volume) })
      return
    }
    if (def.kind === 'noise-brown') {
      this.noiseNodes.set(soundId, { stop: this.createNoise('brown', volume) })
      return
    }
    if (def.kind.startsWith('binaural-')) {
      const wave = def.kind.replace('binaural-', '')
      this.noiseNodes.set(soundId, { stop: this.playBinaural(wave, volume) })
      return
    }
    if (def.url) {
      const ext = def.url.split('?')[0].split('.').pop()?.toLowerCase()
      const howl = new Howl({
        src: [def.url],
        format: ext ? [ext] : undefined,
        loop: true,
        volume: volume * this.masterVolume,
        html5: true,
      })
      howl.play()
      this.howls.set(soundId, howl)
    }
  }

  setVolume(soundId: string, volume: number) {
    const h = this.howls.get(soundId)
    if (h) h.volume(volume * this.masterVolume)
    // noise volumes need restart — acceptable for slider drag end
  }

  stopSound(soundId: string) {
    this.howls.get(soundId)?.unload()
    this.howls.delete(soundId)
    this.noiseNodes.get(soundId)?.stop()
    this.noiseNodes.delete(soundId)
  }

  stopAll() {
    ;[...this.howls.keys()].forEach((k) => this.stopSound(k))
  }

  isPlaying(soundId: string): boolean {
    const h = this.howls.get(soundId)
    if (h?.playing()) return true
    return this.noiseNodes.has(soundId)
  }

  getActiveSoundIds(): string[] {
    const ids = new Set<string>([...this.howls.keys(), ...this.noiseNodes.keys()])
    return [...ids].filter((id) => this.isPlaying(id))
  }

  /** Call once after a user gesture so Web Audio / Howler can play. */
  unlock() {
    this.ensureCtx()
    if (typeof Howler !== 'undefined' && Howler.ctx?.state === 'suspended') {
      void Howler.ctx.resume()
    }
  }

  playAlert(alertId: string, volume = 0.5) {
    const preset = ALERT_SOUNDS.find((a) => a.id === alertId)
    if (!preset || preset.freq === 0) return
    const ctx = this.ensureCtx()
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g)
    g.connect(ctx.destination)
    osc.frequency.value = preset.freq
    osc.type = alertId === 'levelup' ? 'square' : 'sine'
    const peak = Math.max(0, Math.min(1, volume)) * 0.5
    g.gain.setValueAtTime(peak, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  }
}

export const audioEngine = new HowlerAudioEngine()

export type { SoundDef }
