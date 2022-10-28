const MAX_VELOCITY = 127;
const NOTE_ON = 0x90;
const NOTE_OFF = 0x78;
const BPM = 240;

const QUARTER_NOTE_MS = (60.0 / BPM) * 1000;
const BAR_MS = QUARTER_NOTE_MS * 4

class Arpeggiator {
  constructor(output, mute, notes, gap = 1, phase = 0) {
    this.output = output;
    this.notes = notes;
    this.gap = gap;
    this.phase = phase;
    this.on = false;
    this.mute = mute;
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
      if (!this.mute) {
        this.output.send([NOTE_ON, this.notes[this.cursor], MAX_VELOCITY / 2]);
        this.output.send([NOTE_ON, this.notes[this.cursor], 0], performance.now() + QUARTER_NOTE_MS); // hold for 100ms
      }
      updateView();
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

  composition = new Composition([
    new Arpeggiator(firstOutput, false, [60, 63, 67, 70]),
    new Arpeggiator(firstOutput, true, [62, 65, 69], 1, 1),
    new Arpeggiator(firstOutput, true, [48, 51, 55, 60], 2, 0),
    new Arpeggiator(firstOutput, true, [48, 50, 51, 53], 4, 0),
  ]);

  initView();
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

function initView() {
  composition.arps.forEach((arp, index) => {
    notesElement = "";
    arp.notes.forEach((note, index) => {
      notesElement += '<div class="note ' + index + '">' + note + '</div>';
    });
    toggleElement = '<input type="checkbox" name="' + index + '" value="On"' + (!arp.mute ? " checked" : "") + '>'
    $("#plates-container").append('<div class="arp ' + (arp.mute ? "muted " : "") + index + '">' + toggleElement + notesElement + '</div>');
  });

  $('input[type="checkbox"]').change(function() {
    index = $(this).attr("name");
    console.log(index);
    composition.arps[index].mute = !this.checked;
    if (this.checked) {
      $(".arp." + index).removeClass("muted");
    } else {
      $(".arp." + index).addClass("muted");
    }
  });

  updateView();
}

function updateView() {
  $(".arp .note").removeClass("active");
  composition.arps.forEach((arp, index) => {
    $(".arp." + index + " .note." + arp.cursor).addClass("active");
  });
}

$(function() {
  console.log("Ready!");
});

