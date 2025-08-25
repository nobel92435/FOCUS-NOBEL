// /js/utils.js

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    addDoc,
    collection,
    onSnapshot,
    arrayUnion,
    updateDoc,
    deleteDoc,
    getDocs,
    serverTimestamp,
    query,
    where,
    increment,
    runTransaction,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showToast, updateTotalTimeDisplay } from './ui.js';

// --- Shared Constants ---
export const ACHIEVEMENTS = {
    'novice_scholar': { name: 'Novice Scholar', description: 'Study for a total of 1 hour.' },
    'dedicated_learner': { name: 'Dedicated Learner', description: 'Study for a total of 10 hours.' },
    'marathoner': { name: 'Marathoner', description: 'Complete a single study session over 2 hours.' },
    'consistent_coder': { name: 'Consistent Coder', description: 'Maintain a 7-day study streak.' }
};

export const availableSounds = {
    'None': '',
    '8-Bit Powerup': 'tone_powerup', 'Alarm Beep': 'tone_alarm_beep', 'Alien Signal': 'tone_alien_signal',
    'Arcade Hit': 'tone_arcade_hit', 'Bass Drop': 'tone_bass_drop', 'Beep Sequence': 'tone_beep_sequence',
    'Bell': 'tone_metal_bell', 'Bird': 'tone_bird', 'Bubble Pop': 'tone_bubble_pop', 'Bubbles': 'tone_bubbles',
    'Buzzer': 'tone_buzzer', 'Cat Purr': 'tone_purr', 'Celesta': 'tone_celesta', 'Chime Chord': 'tone_chime_chord',
    'Chimes': 'tone_chimes', 'Chiptune Arp': 'tone_chiptune_arp', 'Choir Aah': 'tone_choir_aah',
    'Clock Tick': 'tone_clock_tick', 'Coin Collect': 'tone_coin_collect', 'Computer Voice': 'tone_computer_voice',
    'Cosmic Ping': 'tone_cosmic_ping', 'Cosmic Rumble': 'tone_cosmic_rumble', 'Crickets': 'tone_crickets',
    'Crystal': 'tone_crystal', 'Cybernetic': 'tone_cybernetic', 'Data Stream': 'tone_data_stream',
    'Deep Drone': 'tone_deep_drone', 'Dial-up': 'tone_dial_up', 'Digital': 'tone_digital',
    'Digital Sweep': 'tone_digital_sweep', 'Disintegrate': 'tone_disintegrate', 'Dreamy Arp': 'tone_dreamy_arp',
    'Drone Pulse': 'tone_drone_pulse', 'Electric Piano': 'tone_electric_piano', 'Energy Charge': 'tone_energy_charge',
    'Engine Start': 'tone_engine_start', 'Error Beep': 'tone_error_beep', 'Explosion': 'tone_explosion',
    'Fairy Twinkle': 'tone_fairy_twinkle', 'Flute': 'tone_flute', 'Forcefield': 'tone_forcefield',
    'Game Over': 'tone_game_over', 'Glass Tap': 'tone_glass_tap', 'Glitch': 'tone_glitch', 'Gong': 'tone_gong',
    'Guitar Harmonic': 'tone_guitar_harmonic', 'Harp': 'tone_harp', 'Heartbeat': 'tone_heartbeat',
    'High Score': 'tone_high_score', 'Hologram': 'tone_hologram', 'Hyperspace': 'tone_hyperspace',
    'Kalimba': 'tone_kalimba', 'Keyboard Click': 'tone_keyboard', 'Kitchen': 'tone_kitchen', 'Laser': 'tone_laser',
    'Low Battery': 'tone_low_battery', 'Mechanical': 'tone_mechanical', 'Metal Bell': 'tone_metal_bell',
    'Modem': 'tone_modem', 'Morse Code': 'tone_morse', 'Music Box': 'tone_music_box', 'Noise Alarm': 'tone_noise_alarm',
    'Notification Pop': 'tone_notification_pop', 'Ocean Wave': 'tone_ocean', 'Ominous Drone': 'tone_ominous_drone',
    'Page Turn': 'tone_page_turn', 'Phase Shift': 'tone_phase_shift', 'Pluck': 'tone_pluck', 'Portal': 'tone_portal',
    'Power Down': 'tone_power_down', 'Rain on Window': 'tone_rain_on_window', 'Rainfall': 'tone_rainfall',
    'Retro Game': 'tone_retro_game', 'Riser': 'tone_riser', 'Robot Beep': 'tone_robot_beep', 'Scanner': 'tone_scanner',
    'Sci-Fi Pad': 'tone_sci_fi_pad', 'Simple Beep': 'tone_simple_beep', 'Singing Bowl': 'tone_singing_bowl',
    'Soft Marimba': 'tone_soft_marimba', 'Sonar Ping': 'tone_sonar', 'Starship Hum': 'tone_starship_hum',
    'Static': 'tone_static', 'Steam Train': 'tone_steam_train', 'Steel Drum': 'tone_steel_drum',
    'Strummed Chord': 'tone_strummed_chord', 'Stutter': 'tone_stutter', 'Subtle Beep': 'tone_subtle_beep',
    'Synth Pluck': 'tone_synth_pluck', 'Synthwave': 'tone_synthwave', 'Teleporter': 'tone_teleporter',
    'Thunder': 'tone_thunder', 'Tibetan Bowl': 'tone_tibetan_bowl', 'Typewriter': 'tone_typewriter',
    'UI Confirm': 'tone_ui_confirm', 'Vibrating Bell': 'tone_vibrating_bell', 'Vinyl Crackles': 'tone_vinyl_crackles',
    'Violin Pizzicato': 'tone_pizzicato', 'Warning Horn': 'tone_warning_horn', 'Water Drop': 'tone_water_drop',
    'Wind Chimes': 'tone_wind_chimes', 'Wobble': 'tone_wobble', 'Wood': 'tone_wood', 'Xylophone': 'tone_xylophone',
    'Zen Garden': 'tone_zen_garden',
};

// --- Firebase and User State (will be passed from main.js) ---
let db;
let currentUser;
let appId;
let pomodoroSettings;
let pomodoroSounds;
let isAudioUnlocked = false; // Moved here, but state managed by main.js
let totalTimeTodayInSeconds;
let totalBreakTimeTodayInSeconds;


export const setUtilsGlobals = (dbInstance, currentUserRef, appIdRef, pSettings, pSounds, totalStudy, totalBreak) => {
    db = dbInstance;
    currentUser = currentUserRef;
    appId = appIdRef;
    pomodoroSettings = pSettings;
    pomodoroSounds = pSounds;
    totalTimeTodayInSeconds = totalStudy;
    totalBreakTimeTodayInSeconds = totalBreak;
};

export const updatePomodoroSettingsInUtils = (newSettings) => {
    pomodoroSettings = newSettings;
};

export const updatePomodoroSoundsInUtils = (newSounds) => {
    pomodoroSounds = newSounds;
};

export const updateDailyTotalsInUtils = (studySeconds, breakSeconds) => {
    totalTimeTodayInSeconds = studySeconds;
    totalBreakTimeTodayInSeconds = breakSeconds;
};

export const getCurrentDate = () => new Date();

export async function playSound(soundId, volume) {
    if (!soundId || soundId.trim() === '') return;

    if (typeof Tone === 'undefined') {
        console.warn("Tone.js not loaded. Cannot play sounds.");
        return;
    }

    await Tone.start();

    try {
        if (soundId.startsWith('tone_')) {
            const now = Tone.now();
            const settings = { volume: Tone.gainToDb(volume) };

            const triggerSynth = (synthType, options, note, duration, connection) => {
                const s = new synthType(options);
                if (connection) {
                    s.connect(connection);
                } else {
                    s.toDestination();
                }
                s.triggerAttackRelease(note, duration, now);
                const durationSeconds = Tone.Time(duration).toSeconds();
                setTimeout(() => s.dispose(), (durationSeconds + 0.5) * 1000);
            };

            const triggerPolySynth = (synthType, options, notes, duration) => {
                const poly = new Tone.PolySynth(synthType, options).toDestination();
                poly.triggerAttackRelease(notes, duration, now);
                const durationSeconds = Tone.Time(duration).toSeconds();
                setTimeout(() => poly.dispose(), (durationSeconds + 1) * 1000);
            };

            switch (soundId) {
                case 'tone_simple_beep': triggerSynth(Tone.Oscillator, { ...settings, type: "sine", frequency: "C5" }, "C5", 0.2); break;
                case 'tone_subtle_beep': triggerSynth(Tone.Oscillator, { volume: Tone.gainToDb(volume * 0.5), type: "sine", frequency: "A5" }, "A5", 0.15); break;
                case 'tone_alarm_beep': triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'square' } }, "F#5", "0.2s"); break;
                case 'tone_buzzer': triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'sawtooth' } }, "C3", "0.3s"); break;
                case 'tone_error_beep':
                    const errorSynth = new Tone.Synth({ ...settings, oscillator: { type: 'triangle' } }).toDestination();
                    errorSynth.triggerAttackRelease("B4", "16n", now);
                    errorSynth.triggerAttackRelease("F4", "16n", now + 0.2);
                    setTimeout(() => errorSynth.dispose(), 600); break;
                case 'tone_ui_confirm':
                    const confirmSynth = new Tone.Synth({ ...settings, oscillator: { type: 'sine' } }).toDestination();
                    confirmSynth.triggerAttackRelease("C5", "16n", now);
                    confirmSynth.triggerAttackRelease("G5", "16n", now + 0.1);
                    setTimeout(() => confirmSynth.dispose(), 500); break;
                case 'tone_warning_horn': triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'sawtooth' } }, "A3", "1s"); break;
                case 'tone_beep_sequence':
                    const seqSynth = new Tone.Synth(settings).toDestination();
                    seqSynth.triggerAttackRelease("C5", "16n", now); seqSynth.triggerAttackRelease("E5", "16n", now + 0.15); seqSynth.triggerAttackRelease("G5", "16n", now + 0.3);
                    setTimeout(() => seqSynth.dispose(), 800); break;
                case 'tone_low_battery':
                    const lowBattSynth = new Tone.Synth(settings).toDestination();
                    lowBattSynth.triggerAttackRelease("G4", "8n", now); lowBattSynth.triggerAttackRelease("E4", "8n", now + 0.2); lowBattSynth.triggerAttackRelease("C4", "8n", now + 0.4);
                    setTimeout(() => lowBattSynth.dispose(), 1000); break;
                case 'tone_robot_beep': triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'square' } }, "A4", "16n"); break;
                case 'tone_computer_voice':
                    const compSynth = new Tone.Synth({ ...settings, oscillator: { type: 'square' } }).toDestination();
                    compSynth.triggerAttackRelease("A3", "16n", now); compSynth.triggerAttackRelease("D4", "16n", now + 0.15); compSynth.triggerAttackRelease("F4", "16n", now + 0.3);
                    setTimeout(() => compSynth.dispose(), 800); break;
                case 'tone_digital': triggerSynth(Tone.FMSynth, { ...settings, harmonicity: 3, modulationIndex: 10 }, "C6", "32n"); break;
                case 'tone_chime_chord': triggerPolySynth(Tone.Synth, { volume: settings.volume, oscillator: { type: 'sine' } }, ["C5", "E5", "G5"], "0.5s"); break;
                case 'tone_chimes': triggerPolySynth(Tone.MetalSynth, { volume: settings.volume, harmonicity: 8, resonance: 800, octaves: 1.5 }, ["C5", "E5", "G5", "B5"], "1s"); break;
                case 'tone_synth_pluck': triggerSynth(Tone.Synth, settings, "C4", "8n"); break;
                case 'tone_pluck': triggerSynth(Tone.PluckSynth, settings, "C4", "4n"); break;
                case 'tone_music_box':
                    const mbSynth = new Tone.PluckSynth({ ...settings, attackNoise: 0.5, dampening: 4000, resonance: 0.9 }).toDestination();
                    const mbReverb = new Tone.Reverb(1.5).toDestination();
                    mbSynth.connect(mbReverb); mbSynth.triggerAttackRelease("C5", "1n", now); mbSynth.triggerAttackRelease("G5", "1n", now + 0.5); mbSynth.triggerAttackRelease("E5", "1n", now + 1);
                    setTimeout(() => { mbSynth.dispose(); mbReverb.dispose(); }, 2500); break;
                case 'tone_xylophone': triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 1, dampening: 7000, resonance: 0.98 }, "C5", "4n"); break;
                case 'tone_celesta': triggerSynth(Tone.MetalSynth, { ...settings, harmonicity: 7, resonance: 900, octaves: 2 }, "C5", "1s"); break;
                case 'tone_chiptune_arp':
                    const arpSynth = new Tone.Synth({ ...settings, oscillator: { type: 'pulse', width: 0.4 } }).toDestination();
                    const notes = ["C4", "E4", "G4", "C5", "G4", "E4"]; notes.forEach((note, i) => arpSynth.triggerAttackRelease(note, "16n", now + i * 0.1));
                    setTimeout(() => arpSynth.dispose(), 1000); break;
                case 'tone_dreamy_arp':
                    const dreamSynth = new Tone.FMSynth({ ...settings, harmonicity: 1.5, modulationIndex: 5 }).toDestination();
                    const dreamReverb = new Tone.Reverb(3).toDestination();
                    dreamSynth.connect(dreamReverb);
                    const dreamNotes = ["C4", "G4", "B4", "E5"]; dreamNotes.forEach((note, i) => dreamSynth.triggerAttackRelease(note, "4n", now + i * 0.3));
                    setTimeout(() => { dreamSynth.dispose(); dreamReverb.dispose(); }, 2500); break;
                case 'tone_electric_piano': triggerSynth(Tone.FMSynth, { ...settings, harmonicity: 3, modulationIndex: 10, envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.8 } }, "C4", "2n"); break;
                case 'tone_flute': triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.5 } }, "C5", "1s"); break;
                case 'tone_guitar_harmonic': triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.1, dampening: 8000, resonance: 0.95 }, "C5", "1n"); break;
                case 'tone_harp': triggerPolySynth(Tone.PluckSynth, { volume: settings.volume, attackNoise: 0.2, dampening: 5000, resonance: 0.9 }, ["C4", "E4", "G4", "B4", "D5"], "1n"); break;
                case 'tone_kalimba': triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.8, dampening: 3000, resonance: 0.8 }, "C4", "4n"); break;
                case 'tone_pizzicato': triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.05, dampening: 1500, resonance: 0.5 }, "C4", "8n"); break;
                case 'tone_soft_marimba': triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.8, sustain: 0, release: 0.1 } }, "C4", "2n"); break;
                case 'tone_steel_drum': triggerSynth(Tone.MetalSynth, { ...settings, harmonicity: 3.5, modulationIndex: 20, resonance: 1000 }, "C4", "2n"); break;
                case 'tone_strummed_chord':
                    const strumSynth = new Tone.PolySynth(Tone.PluckSynth, { volume: settings.volume, attackNoise: 0.1, dampening: 4000 }).toDestination();
                    const chord = ["C4", "E4", "G4", "C5"]; chord.forEach((note, i) => strumSynth.triggerAttack(note, now + i * 0.03));
                    strumSynth.releaseAll(now + 1); setTimeout(() => strumSynth.dispose(), 1500); break;
                case 'tone_synthwave': triggerPolySynth(Tone.Synth, { volume: settings.volume, oscillator: { type: 'fatsawtooth' }, envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 } }, ["C3", "E3", "G3"], "1s"); break;
                case 'tone_arcade_hit': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0 } }, null, "8n"); break;
                case 'tone_coin_collect':
                    const coinSynth = new Tone.Synth({ ...settings }).toDestination();
                    coinSynth.triggerAttackRelease("E6", "16n", now); coinSynth.triggerAttackRelease("G6", "16n", now + 0.1);
                    setTimeout(() => coinSynth.dispose(), 500); break;
                case 'tone_laser':
                    const laserSynth = new Tone.Synth(settings).toDestination();
                    laserSynth.frequency.rampTo("C4", 0.1, now); laserSynth.triggerAttackRelease("A5", "8n", now);
                    setTimeout(() => laserSynth.dispose(), 500); break;
                case 'tone_powerup':
                    const powerupSynth = new Tone.Synth(settings).toDestination();
                    const p_notes = ["C5", "E5", "G5", "C6"]; p_notes.forEach((note, i) => powerupSynth.triggerAttackRelease(note, "16n", now + i * 0.1));
                    setTimeout(() => powerupSynth.dispose(), 800); break;
                case 'tone_game_over':
                    const goSynth = new Tone.Synth({ ...settings, oscillator: { type: 'sawtooth' } }).toDestination();
                    const go_notes = [{ n: "C4", t: 0 }, { n: "G3", t: 0.2 }, { n: "E3", t: 0.4 }, { n: "C3", t: 0.6 }];
                    go_notes.forEach(note => goSynth.triggerAttackRelease(note.n, "8n", now + note.t));
                    setTimeout(() => goSynth.dispose(), 1200); break;
                case 'tone_high_score':
                    const hsSynth = new Tone.Synth(settings).toDestination();
                    const hs_notes = ["A4", "C5", "E5", "A5", "E5"]; hs_notes.forEach((note, i) => hsSynth.triggerAttackRelease(note, "16n", now + i * 0.1));
                    setTimeout(() => hsSynth.dispose(), 1000); break;
                case 'tone_notification_pop': triggerSynth(Tone.MembraneSynth, { ...settings, pitchDecay: 0.01, octaves: 4 }, "G5", "32n"); break;
                case 'tone_retro_game': triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'square' } }, "A4", "16n"); break;
                case 'tone_stutter':
                    const stutterSynth = new Tone.Synth(settings).toDestination();
                    for (let i = 0; i < 4; i++) { stutterSynth.triggerAttackRelease("C5", "32n", now + i * 0.05); }
                    setTimeout(() => stutterSynth.dispose(), 500); break;
                case 'tone_metal_bell': triggerSynth(Tone.MetalSynth, { ...settings, envelope: { decay: 1.2 } }, "C5", "1s"); break;
                case 'tone_noise_alarm': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: "pink" }, envelope: { attack: 0.1, decay: 0.5, sustain: 0.1, release: 0.8 } }, null, "1s"); break;
                case 'tone_wobble':
                    const wobbleSynth = new Tone.Synth({ ...settings, oscillator: { type: "fmsquare", modulationType: "sawtooth", modulationIndex: 2 } }).toDestination();
                    wobbleSynth.triggerAttackRelease("C3", "4n", now); setTimeout(() => wobbleSynth.dispose(), 1000); break;
                case 'tone_bird':
                    const birdSynth = new Tone.Synth({ ...settings, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 } }).toDestination();
                    birdSynth.frequency.setValueAtTime("G5", now); birdSynth.frequency.linearRampToValueAtTime("A5", now + 0.1); birdSynth.frequency.linearRampToValueAtTime("G5", now + 0.2);
                    birdSynth.triggerAttack(now).triggerRelease(now + 0.2); setTimeout(() => birdSynth.dispose(), 500); break;
                case 'tone_bubble_pop': triggerSynth(Tone.MembraneSynth, { ...settings, pitchDecay: 0.01, octaves: 4 }, "C4", "32n"); break;
                case 'tone_bubbles':
                    const bubbleSynth = new Tone.MembraneSynth({ ...settings, pitchDecay: 0.02, octaves: 5 }).toDestination();
                    for (let i = 0; i < 5; i++) { bubbleSynth.triggerAttackRelease(`C${4 + i}`, "16n", now + i * 0.1); }
                    setTimeout(() => bubbleSynth.dispose(), 1000); break;
                case 'tone_explosion':
                    const exSynth = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' }, envelope: { attack: 0.01, decay: 1, sustain: 0, release: 0.5 } }).toDestination();
                    const exFilter = new Tone.Filter(1000, "lowpass").toDestination();
                    exSynth.connect(exFilter); exFilter.frequency.rampTo(100, 1, now); exSynth.triggerAttackRelease("1s", now);
                    setTimeout(() => { exSynth.dispose(); exFilter.dispose(); }, 1500); break;
                case 'tone_gong': triggerSynth(Tone.MetalSynth, { ...settings, frequency: 150, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, envelope: { attack: 0.01, decay: 2.5, release: 1 } }, "C2", "2s"); break;
                case 'tone_water_drop': triggerSynth(Tone.MembraneSynth, { ...settings, pitchDecay: 0.05, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.14, sustain: 0.01, release: 0.2 } }, "C7", "8n"); break;
                case 'tone_bass_drop':
                    const bdSynth = new Tone.MembraneSynth({ ...settings, pitchDecay: 0.8, octaves: 4, envelope: { attack: 0.1, decay: 1, sustain: 0.5, release: 1 } }).toDestination();
                    bdSynth.triggerAttackRelease("C1", "1n", now); setTimeout(() => bdSynth.dispose(), 2000); break;
                case 'tone_crickets':
                    const cricketSynth = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.05, sustain: 0 } }).toDestination();
                    const cricketFilter = new Tone.Filter(8000, "bandpass").toDestination();
                    cricketSynth.connect(cricketFilter); for (let i = 0; i < 5; i++) { cricketSynth.triggerAttack(now + i * 0.2); }
                    setTimeout(() => { cricketSynth.dispose(); cricketFilter.dispose(); }, 1500); break;
                case 'tone_disintegrate': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'pink', fadeOut: 0.5 }, envelope: { attack: 0.01, decay: 0.5, sustain: 0 } }, null, "0.5s"); break;
                case 'tone_engine_start':
                    const engineSynth = new Tone.NoiseSynth({ ...settings, noise: { type: 'brown' } }).toDestination();
                    const engineFilter = new Tone.Filter(100, "lowpass").toDestination();
                    engineSynth.connect(engineFilter); engineFilter.frequency.rampTo(1000, 1, now); engineSynth.triggerAttackRelease("1s", now);
                    setTimeout(() => { engineSynth.dispose(); engineFilter.dispose(); }, 1500); break;
                case 'tone_glass_tap': triggerSynth(Tone.MetalSynth, { ...settings, harmonicity: 12, resonance: 1200, octaves: 1, envelope: { attack: 0.001, decay: 0.1, release: 0.1 } }, "C6", "16n"); break;
                case 'tone_glitch':
                    const glitchSynth = new Tone.Synth({ ...settings, oscillator: { type: 'square' } }).toDestination();
                    for (let i = 0; i < 5; i++) { glitchSynth.triggerAttackRelease(Math.random() * 1000 + 500, "32n", now + Math.random() * 0.2); }
                    setTimeout(() => glitchSynth.dispose(), 500); break;
                case 'tone_heartbeat':
                    const hbSynth = new Tone.MembraneSynth({ ...settings, pitchDecay: 0.2, octaves: 2 }).toDestination();
                    hbSynth.triggerAttackRelease("C2", "8n", now); hbSynth.triggerAttackRelease("C2", "8n", now + 0.3);
                    setTimeout(() => hbSynth.dispose(), 800); break;
                case 'tone_hyperspace':
                    const hsNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' } }).toDestination();
                    const hsFilter = new Tone.Filter(200, "highpass").toDestination();
                    hsNoise.connect(hsFilter); hsFilter.frequency.rampTo(5000, 0.5, now); hsNoise.triggerAttackRelease("0.5s", now);
                    setTimeout(() => { hsNoise.dispose(); hsFilter.dispose(); }, 1000); break;
                case 'tone_keyboard': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }, null, "32n"); break;
                case 'tone_kitchen': triggerPolySynth(Tone.MetalSynth, { volume: settings.volume, harmonicity: 15, resonance: 1000, octaves: 1 }, ["C5", "G5", "A5"], "16n"); break;
                case 'tone_mechanical': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }, null, "8n"); break;
                case 'tone_morse':
                    const morseSynth = new Tone.Synth(settings).toDestination();
                    morseSynth.triggerAttackRelease("C5", "32n", now); morseSynth.triggerAttackRelease("C5", "32n", now + 0.1); morseSynth.triggerAttackRelease("C5", "32n", now + 0.2);
                    morseSynth.triggerAttackRelease("C5", "16n", now + 0.4); morseSynth.triggerAttackRelease("C5", "16n", now + 0.6); morseSynth.triggerAttackRelease("C5", "16n", now + 0.8);
                    morseSynth.triggerAttackRelease("C5", "32n", now + 1.1); morseSynth.triggerAttackRelease("C5", "32n", now + 1.2); morseSynth.triggerAttackRelease("C5", "32n", now + 1.3);
                    setTimeout(() => morseSynth.dispose(), 1800); break;
                case 'tone_ocean':
                    const oceanNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'brown' } }).toDestination();
                    const oceanFilter = new Tone.AutoFilter("4n").toDestination().start();
                    oceanNoise.connect(oceanFilter); oceanNoise.triggerAttack(now);
                    setTimeout(() => { oceanNoise.dispose(); oceanFilter.dispose(); }, 2000); break;
                case 'tone_page_turn': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0 } }, null, "8n"); break;
                case 'tone_power_down':
                    const pdSynth = new Tone.Synth(settings).toDestination();
                    pdSynth.frequency.rampTo("C2", 0.5, now); pdSynth.triggerAttackRelease("C4", "0.5s", now);
                    setTimeout(() => pdSynth.dispose(), 1000); break;
                case 'tone_purr':
                    const purrNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'brown' } }).toDestination();
                    const purrLFO = new Tone.LFO("20hz", -15, 0).start();
                    purrLFO.connect(purrNoise.volume); purrNoise.triggerAttack(now);
                    setTimeout(() => { purrNoise.dispose(); purrLFO.dispose(); }, 1500); break;
                case 'tone_rain_on_window':
                case 'tone_rainfall': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'pink' }, envelope: { attack: 0.5, decay: 1, sustain: 1, release: 1 } }, null, "2s"); break;
                case 'tone_riser':
                    const riserNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' } }).toDestination();
                    const riserFilter = new Tone.Filter(200, "lowpass").toDestination();
                    riserNoise.connect(riserFilter); riserFilter.frequency.rampTo(5000, 1, now); riserNoise.triggerAttackRelease("1s", now);
                    setTimeout(() => { riserNoise.dispose(); riserFilter.dispose(); }, 1500); break;
                case 'tone_scanner':
                    const scanSynth = new Tone.Synth(settings).toDestination();
                    const scanLFO = new Tone.LFO("2hz", 400, 1000).start();
                    scanLFO.connect(scanSynth.frequency); scanSynth.triggerAttack(now);
                    setTimeout(() => { scanSynth.dispose(); scanLFO.dispose(); }, 1000); break;
                case 'tone_singing_bowl':
                case 'tone_tibetan_bowl': triggerSynth(Tone.MetalSynth, { ...settings, harmonicity: 1.2, resonance: 1200, octaves: 1.5, envelope: { attack: 0.1, decay: 3, release: 0.5 } }, "C3", "3s"); break;
                case 'tone_static': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' } }, null, "1s"); break;
                case 'tone_steam_train':
                    const steamSynth = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' }, envelope: { attack: 0.05, decay: 0.2, sustain: 0 } }).toDestination();
                    for (let i = 0; i < 4; i++) { steamSynth.triggerAttack(now + i * 0.3); }
                    setTimeout(() => steamSynth.dispose(), 1500); break;
                case 'tone_teleporter':
                    const teleSynth = new Tone.FMSynth({ ...settings, modulationIndex: 20 }).toDestination();
                    teleSynth.frequency.rampTo(2000, 0.3, now); teleSynth.triggerAttackRelease("0.3s", now);
                    setTimeout(() => teleSynth.dispose(), 800); break;
                case 'tone_thunder': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'brown' }, envelope: { attack: 0.1, decay: 2, sustain: 0 } }, null, "2s"); break;
                case 'tone_typewriter':
                    const twSynth = new Tone.PluckSynth({ ...settings, attackNoise: 0.5, dampening: 1000 }).toDestination();
                    twSynth.triggerAttackRelease("C5", "32n", now); setTimeout(() => twSynth.dispose(), 300); break;
                case 'tone_vibrating_bell': triggerSynth(Tone.MetalSynth, { ...settings, vibratoAmount: 0.5, vibratoRate: 5, envelope: { decay: 2 } }, "C4", "2s"); break;
                case 'tone_vinyl_crackles': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'pink' }, envelope: { attack: 0.2, decay: 1, sustain: 1 } }, null, "2s"); break;
                case 'tone_wind_chimes': triggerPolySynth(Tone.MetalSynth, { volume: settings.volume, harmonicity: 5, resonance: 1000, octaves: 2 }, ["C5", "E5", "G5", "A5", "C6"], "2n"); break;
                case 'tone_wood': triggerSynth(Tone.MembraneSynth, { ...settings, pitchDecay: 0.01, octaves: 1 }, "C3", "16n"); break;
                case 'tone_zen_garden': triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.1, dampening: 3000, resonance: 0.9, release: 2 }, "C5", "1n"); break;
                case 'tone_alien_signal': triggerSynth(Tone.FMSynth, { ...settings, harmonicity: 1.5, modulationIndex: 10, modulation: { type: 'sine' } }, "A4", "1s"); break;
                case 'tone_choir_aah': triggerPolySynth(Tone.AMSynth, { volume: settings.volume, harmonicity: 1.5, envelope: { attack: 0.5, decay: 1, sustain: 0.5, release: 1 } }, ["C4", "E4", "G4"], "2s"); break;
                case 'tone_cosmic_ping':
                    const pingSynth = new Tone.Synth(settings).toDestination();
                    const pingReverb = new Tone.Reverb(2).toDestination();
                    pingSynth.connect(pingReverb); pingSynth.triggerAttackRelease("G5", "16n", now);
                    setTimeout(() => { pingSynth.dispose(); pingReverb.dispose(); }, 2500); break;
                case 'tone_cosmic_rumble': triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'brown' }, envelope: { attack: 1, decay: 2, sustain: 1 } }, null, "3s"); break;
                case 'tone_crystal': triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.2, dampening: 6000, resonance: 0.98, release: 2 }, "C6", "1n"); break;
                case 'tone_cybernetic': triggerSynth(Tone.FMSynth, { ...settings, harmonicity: 2, modulationIndex: 15, envelope: { attack: 0.1, decay: 0.5 } }, "G3", "1s"); break;
                case 'tone_data_stream':
                    const dsSynth = new Tone.Synth({ ...settings, oscillator: { type: 'square' } }).toDestination();
                    for (let i = 0; i < 8; i++) { dsSynth.triggerAttackRelease(Math.random() * 500 + 800, "32n", now + i * 0.05); }
                    setTimeout(() => dsSynth.dispose(), 800); break;
                case 'tone_deep_drone': triggerSynth(Tone.Oscillator, { ...settings, frequency: "C2", type: 'sawtooth' }, "C2", "3s"); break;
                case 'tone_dial_up':
                    const dialSynth = new Tone.Synth(settings).toDestination();
                    const dialNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' } }).toDestination();
                    dialSynth.triggerAttackRelease("F5", "0.2s", now); dialSynth.triggerAttackRelease("A5", "0.2s", now + 0.3); dialNoise.triggerAttackRelease("0.5s", now + 0.6);
                    setTimeout(() => { dialSynth.dispose(); dialNoise.dispose(); }, 1500); break;
                case 'tone_digital_sweep':
                    const sweepSynth = new Tone.Synth(settings).toDestination();
                    sweepSynth.frequency.rampTo(2000, 0.5, now); sweepSynth.triggerAttackRelease("C4", "0.5s", now);
                    setTimeout(() => sweepSynth.dispose(), 1000); break;
                case 'tone_drone_pulse':
                    const dpSynth = new Tone.AMSynth(settings).toDestination();
                    const dpLFO = new Tone.LFO("2hz", -10, 0).start();
                    dpLFO.connect(dpSynth.volume); dpSynth.triggerAttackRelease("A2", "2s", now);
                    setTimeout(() => { dpSynth.dispose(); dpLFO.dispose(); }, 2500); break;
                case 'tone_energy_charge':
                    const ecSynth = new Tone.Synth(settings).toDestination();
                    ecSynth.frequency.rampTo("C6", 1, now); ecSynth.triggerAttack("C4", now); ecSynth.triggerRelease(now + 1);
                    setTimeout(() => ecSynth.dispose(), 1500); break;
                case 'tone_fairy_twinkle': triggerPolySynth(Tone.PluckSynth, { volume: settings.volume, resonance: 0.9 }, ["C6", "E6", "G6", "B6"], "8n"); break;
                case 'tone_forcefield':
                    const ffSynth = new Tone.AMSynth({ ...settings, harmonicity: 5 }).toDestination();
                    const ffLFO = new Tone.LFO("8hz", -20, 0).start();
                    ffLFO.connect(ffSynth.volume); ffSynth.triggerAttackRelease("C4", "2s", now);
                    setTimeout(() => { ffSynth.dispose(); ffLFO.dispose(); }, 2500); break;
                case 'tone_hologram':
                    const holoSynth = new Tone.FMSynth({ ...settings, harmonicity: 1.5 }).toDestination();
                    const holoFilter = new Tone.AutoFilter("1n").toDestination().start();
                    holoSynth.connect(holoFilter); holoSynth.triggerAttackRelease("C4", "2s", now);
                    setTimeout(() => { holoSynth.dispose(); holoFilter.dispose(); }, 2500); break;
                case 'tone_modem':
                    const modemSynth = new Tone.FMSynth({ ...settings, harmonicity: 5, modulationIndex: 10 }).toDestination();
                    modemSynth.triggerAttackRelease("A4", "0.5s", now);
                    setTimeout(() => modemSynth.dispose(), 1000); break;
                case 'tone_ominous_drone': triggerSynth(Tone.AMSynth, { ...settings, harmonicity: 0.5 }, "C2", "3s"); break;
                case 'tone_phase_shift':
                    const psSynth = new Tone.Synth(settings).toDestination();
                    const phaser = new Tone.Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 350 }).toDestination();
                    psSynth.connect(phaser); psSynth.triggerAttackRelease("C4", "2s", now);
                    setTimeout(() => { psSynth.dispose(); phaser.dispose(); }, 2500); break;
                case 'tone_portal':
                    const portalNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'pink' } }).toDestination();
                    const portalFilter = new Tone.AutoFilter("0.5s").toDestination().start();
                    portalNoise.connect(portalFilter); portalNoise.triggerAttackRelease("2s", now);
                    setTimeout(() => { portalNoise.dispose(); portalFilter.dispose(); }, 2500); break;
                case 'tone_sci_fi_pad': triggerPolySynth(Tone.FMSynth, { volume: settings.volume, harmonicity: 0.5, modulationIndex: 2, envelope: { attack: 1, release: 1 } }, ["C3", "G3", "Bb3"], "3s"); break;
                case 'tone_sonar':
                    const sonarSynth = new Tone.Synth(settings).toDestination();
                    const feedbackDelay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
                    sonarSynth.connect(feedbackDelay); sonarSynth.triggerAttackRelease("C5", "16n", now);
                    setTimeout(() => { sonarSynth.dispose(); feedbackDelay.dispose(); }, 1500); break;
                case 'tone_starship_hum': triggerSynth(Tone.AMSynth, { ...settings, harmonicity: 0.8 }, "A1", "3s"); break;
                default: console.warn(`Sound not found: ${soundId}. Playing default.`); triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'triangle' } }, "C5", "8n"); break;
            }
        } else {
            const audio = new Audio(soundId);
            audio.volume = volume;
            audio.play().catch(error => console.warn(`Could not play sound: ${soundId}. Error: ${error.message}`));
        }
    } catch (e) {
        console.warn("Error playing sound:", e);
    }
}


export function unlockAudio() {
    if (isAudioUnlocked) return;
    if (typeof Tone === 'undefined') {
        console.warn("Tone.js not loaded. Cannot unlock audio.");
        return;
    }
    Tone.start().then(() => {
        isAudioUnlocked = true;
        console.log("Tone.js audio context started.");
    }).catch(e => console.warn("Tone.js audio context failed to start:", e));

    const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
    silentAudio.play().then(() => {
    }).catch(e => console.warn("Silent audio unlock failed.", e));
}

// --- Service Worker Communication Functions ---
export function scheduleSWAlarm(payload) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_ALARM',
            payload: payload
        });
    }
}

export function cancelSWAlarm(timerId) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CANCEL_ALARM',
            payload: { timerId: timerId }
        });
    }
}

export async function saveSession(subject, durationSeconds, sessionType = 'study') {
    if (!currentUser || durationSeconds <= 0) {
        return;
    }

    const MAX_BREAK_SECONDS = 3 * 3600;
    const cappedDuration = (sessionType === 'break' && durationSeconds > MAX_BREAK_SECONDS) ? MAX_BREAK_SECONDS : durationSeconds;

    try {
        await runTransaction(db, async (transaction) => {
            const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            const publicUserDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);

            const userDoc = await transaction.get(userDocRef);
            const publicUserDoc = await transaction.get(publicUserDocRef);

            const userDataForStreak = userDoc.data();
            if (sessionType === 'study') {
                const todayStr = new Date().toISOString().split('T')[0];
                const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

                const lastStudyDay = userDataForStreak.lastStudyDay || '';
                let currentStreak = userDataForStreak.currentStreak || 0;

                if (lastStudyDay !== todayStr) {
                    if (lastStudyDay === yesterdayStr) {
                        currentStreak++;
                    } else {
                        currentStreak = 1;
                    }
                    transaction.update(userDocRef, {
                        currentStreak: currentStreak,
                        lastStudyDay: todayStr
                    });
                }
            }

            if (!userDoc.exists()) {
                throw new Error("Transaction failed: User document not found.");
            }

            const data = userDoc.data();
            const todayStr = getCurrentDate().toISOString().split('T')[0];

            let currentDailyStudySeconds = 0;
            if (data.totalTimeToday && data.totalTimeToday.date === todayStr) {
                currentDailyStudySeconds = data.totalTimeToday.seconds || 0;
            }
            let currentDailyBreakSeconds = 0;
            if (data.totalBreakTimeToday && data.totalBreakTimeToday.date === todayStr) {
                currentDailyBreakSeconds = data.totalBreakTimeToday.seconds || 0;
            }

            const newSessionDocRef = doc(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'sessions'));
            transaction.set(newSessionDocRef, {
                subject: subject,
                durationSeconds: cappedDuration,
                endedAt: serverTimestamp(),
                type: sessionType
            });

            const updateData = {};
            if (sessionType === 'study') {
                updateData.totalStudySeconds = increment(cappedDuration);
                updateData.totalTimeToday = {
                    date: todayStr,
                    seconds: currentDailyStudySeconds + cappedDuration
                };
            } else {
                updateData.totalBreakSeconds = increment(cappedDuration);
                updateData.totalBreakTimeToday = {
                    date: todayStr,
                    seconds: currentDailyBreakSeconds + cappedDuration
                };
            }
            transaction.update(userDocRef, updateData);

            if (sessionType === 'study') {
                if (!publicUserDoc.exists()) {
                    transaction.set(publicUserDocRef, {
                        username: data.username || 'Anonymous',
                        email: data.email || currentUser.email || '',
                        totalStudySeconds: 0,
                        totalBreakSeconds: 0
                    });
                }
                transaction.update(publicUserDocRef, {
                    totalStudySeconds: increment(cappedDuration)
                });
            } else {
                if (!publicUserDoc.exists()) {
                    transaction.set(publicUserDocRef, {
                        username: data.username || 'Anonymous',
                        email: data.email || currentUser.email || '',
                        totalStudySeconds: 0,
                        totalBreakSeconds: 0
                    });
                }
                transaction.update(publicUserDocRef, {
                    totalBreakSeconds: increment(cappedDuration)
                });
            }

            // Update local state after successful transaction
            if (sessionType === 'study') {
                totalTimeTodayInSeconds = currentDailyStudySeconds + cappedDuration;
            } else {
                totalBreakTimeTodayInSeconds = currentDailyBreakSeconds + cappedDuration;
            }
        });

        updateTotalTimeDisplay(totalTimeTodayInSeconds, totalBreakTimeTodayInSeconds);
        showToast(`Session of ${formatTime(cappedDuration, false)} saved!`, "success");
        if (sessionType === 'study') {
            await checkAndAwardAchievements(cappedDuration);
        }

    } catch (error) {
        console.error("Error saving session in transaction: ", error);
        showToast("Error saving session.", "error");
    }
}

export async function checkAndAwardAchievements(completedSessionDuration) {
    if (!currentUser) return;

    try {
        const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const unlocked = userData.unlockedAchievements || [];
        let newlyUnlocked = [];

        if (!unlocked.includes('novice_scholar') && userData.totalStudySeconds >= 3600) {
            newlyUnlocked.push('novice_scholar');
        }
        if (!unlocked.includes('dedicated_learner') && userData.totalStudySeconds >= 36000) {
            newlyUnlocked.push('dedicated_learner');
        }
        if (!unlocked.includes('marathoner') && completedSessionDuration >= 7200) {
            newlyUnlocked.push('marathoner');
        }
        if (!unlocked.includes('consistent_coder') && userData.currentStreak >= 7) {
            newlyUnlocked.push('consistent_coder');
        }

        if (newlyUnlocked.length > 0) {
            await updateDoc(userDocRef, {
                unlockedAchievements: arrayUnion(...newlyUnlocked)
            });

            const achievement = ACHIEVEMENTS[newlyUnlocked[0]];
            showToast(`Achievement Unlocked: ${achievement.name}!`, 'success');
        }
    } catch (error) {
        console.error("Error checking achievements:", error);
    }
}

export async function loadDailyTotal() {
    if (!currentUser) return;
    const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
        const data = userDoc.data();
        const todayStr = getCurrentDate().toISOString().split('T')[0];

        if (data.totalTimeToday && data.totalTimeToday.date === todayStr) {
            totalTimeTodayInSeconds = data.totalTimeToday.seconds || 0;
        } else {
            totalTimeTodayInSeconds = 0;
            await updateDoc(userRef, {
                totalTimeToday: { date: todayStr, seconds: 0 }
            });
        }

        if (data.totalBreakTimeToday && data.totalBreakTimeToday.date === todayStr) {
            totalBreakTimeTodayInSeconds = data.totalBreakTimeToday.seconds || 0;
        } else {
            totalBreakTimeTodayInSeconds = 0;
            await updateDoc(userRef, {
                totalBreakTimeToday: { date: todayStr, seconds: 0 }
            });
        }

    } else {
        totalTimeTodayInSeconds = 0;
        totalBreakTimeTodayInSeconds = 0;
    }
    updateTotalTimeDisplay(totalTimeTodayInSeconds, totalBreakTimeTodayInSeconds);
    return { totalStudy: totalTimeTodayInSeconds, totalBreak: totalBreakTimeTodayInSeconds };
}


export async function joinGroup(groupId) {
    if (!currentUser) return;
    const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
    const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId);
    await setDoc(userRef, { joinedGroups: arrayUnion(groupId) }, { merge: true });
    await updateDoc(groupRef, { members: arrayUnion(currentUser.uid) });
    showToast("Group joined successfully!", "success");
}

export async function updateSubjectOrderInFirestore(subjectListContainer, currentUserRef, appIdRef) {
    if (!currentUserRef) return;
    const subjectsRef = collection(db, 'artifacts', appIdRef, 'users', currentUserRef.uid, 'subjects');

    const subjectElements = Array.from(subjectListContainer.children);

    const batch = getFirestore().batch(); // Get a new batch instance

    for (let i = 0; i < subjectElements.length; i++) {
        const subjectId = subjectElements[i].dataset.subjectId;
        const subjectDocRef = doc(subjectsRef, subjectId);
        batch.update(subjectDocRef, { order: i });
    }
    await batch.commit();
    showToast("Subject order updated!", "success");
}

export async function deleteSession(sessionId, durationSeconds, endedAt, currentUserRef, appIdRef) {
    if (!currentUserRef || !sessionId) return;

    const userRef = doc(db, 'artifacts', appIdRef, 'users', currentUserRef.uid);
    const publicUserRef = doc(db, 'artifacts', appIdRef, 'public', 'data', 'users', currentUserRef.uid);
    const sessionRef = doc(userRef, 'sessions', sessionId);

    try {
        const sessionDoc = await getDoc(sessionRef);
        const sessionType = sessionDoc.exists() ? sessionDoc.data().type || 'study' : 'study';

        await deleteDoc(sessionRef);

        if (sessionType === 'study') {
            await updateDoc(userRef, { totalStudySeconds: increment(-durationSeconds) });
            await updateDoc(publicUserRef, { totalStudySeconds: increment(-durationSeconds) });
        } else {
            await updateDoc(userRef, { totalBreakSeconds: increment(-durationSeconds) });
            await updateDoc(publicUserRef, { totalBreakSeconds: increment(-durationSeconds) });
        }

        const sessionDateStr = endedAt.toISOString().split('T')[0];
        const todayStr = getCurrentDate().toISOString().split('T')[0];
        if (sessionDateStr === todayStr) {
            if (sessionType === 'study') {
                totalTimeTodayInSeconds -= durationSeconds;
                if (totalTimeTodayInSeconds < 0) totalTimeTodayInSeconds = 0;
                await updateDoc(userRef, {
                    totalTimeToday: {
                        date: todayStr,
                        seconds: totalTimeTodayInSeconds
                    }
                });
            } else {
                totalBreakTimeTodayInSeconds -= durationSeconds;
                if (totalBreakTimeTodayInSeconds < 0) totalBreakTimeTodayInSeconds = 0;
                await updateDoc(userRef, {
                    totalBreakTimeToday: {
                        date: todayStr,
                        seconds: totalBreakTimeTodayInSeconds
                    }
                });
            }
            updateDailyTotalsInUtils(totalTimeTodayInSeconds, totalBreakTimeTodayInSeconds); // Update local state for consistency
        }

        showToast("Session deleted successfully", "success");
    } catch (error) {
        console.error("Error deleting session:", error);
        showToast("Failed to delete session.", "error");
    }
}
