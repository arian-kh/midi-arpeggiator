const MAX_VELOCITY = 127;
const NOTE_ON = 0x90;
const NOTE_OFF = 0x78;
const BPM = 120;

const QUARTER_NOTE_MS = (60.0 / BPM) * 1000;
const BAR_MS = QUARTER_NOTE_MS * 4

class Arpeggiator {
  constructor(output, notes) {
    this.output = output;
    this.notes = notes;
    this.on = false;
    this.cursor = 0;
  }

  start() {
    this.on = true;
    this.playNextNote();
  }

  stop() {
    this.on = false;
  }

  playNextNote() {
    if (this.on) {
      this.output.send([NOTE_ON, this.notes[this.cursor], MAX_VELOCITY / 2]);
      this.output.send([NOTE_ON, this.notes[this.cursor], 0], performance.now() + QUARTER_NOTE_MS); // hold for 100ms
      this.cursor = (this.cursor + 1) % this.notes.length
      setTimeout(() => (this.playNextNote()), QUARTER_NOTE_MS); // all notes 1 sec apart for now
    }
  }
}

// -------

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
  arp1.start();

  let arp2 = new Arpeggiator(firstOutput, [62, 65, 69]);

  setTimeout(() => { arp2.start() }, QUARTER_NOTE_MS / 2);

  setTimeout(() => { arp1.stop(); arp2.stop() }, 4 * BAR_MS);
}

function onMIDIFailure(message) {
  console.log("Failed to access midi:", message);
}

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

