const MAX_VELOCITY = 127;
const NOTE_ON = 0x90;
const NOTE_OFF = 0x78;
const BPM = 480;

const QUARTER_NOTE_MS = (60.0 / BPM) * 1000;
const BAR_MS = QUARTER_NOTE_MS * 4

class Arpeggiator {
  constructor(output, notes, gap = 1, phase = 0) {
    this.output = output;
    this.notes = notes;
    this.gap = gap;
    this.phase = phase;
    this.on = false;
    this.cursor = 0;
  }

  start() {
    this.on = true;
    setTimeout(() => (this.playNextNote()), QUARTER_NOTE_MS * this.phase);
  }

  stop() {
    this.on = false;
  }

  playNextNote() {
    if (this.on) {
      this.output.send([NOTE_ON, this.notes[this.cursor], MAX_VELOCITY / 2]);
      this.output.send([NOTE_ON, this.notes[this.cursor], 0], performance.now() + QUARTER_NOTE_MS); // hold for 100ms
      this.cursor = (this.cursor + 1) % this.notes.length
      setTimeout(() => (this.playNextNote()), QUARTER_NOTE_MS * (this.gap + 1));
    }
  }
}

// -----------

class Composition {
  constructor(arps = []) {
    this.arps = arps
  }

  start() {
    this.arps.forEach(arp => arp.start())
  }

  stop() {
    this.arps.forEach(arp => arp.stop())
  }
}

// -----------

let composition;

function onMIDISuccess(midiAccess) {
  console.log("Got midi access!", midiAccess);
  let firstOutput = null;
  midiAccess.outputs.forEach((output) => {
    console.log(output);
    // pick the first output for now:
    if (firstOutput === null) {
      firstOutput = output;
    }
  });

  let arp1 = new Arpeggiator(firstOutput, [60, 63, 67, 72]);
  let arp2 = new Arpeggiator(firstOutput, [62, 65, 69], 1, 1);

  composition = new Composition([arp1, arp2]);
}

function onMIDIFailure(message) {
  console.log("Failed to access midi:", message);
}

function start() {
  composition.start();
  console.log("start called!");
}

function stop() {
  composition.stop();
  console.log("stop called!");
}

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

