import { EventEmitter } from 'node:events';
import type { RoundRecord } from '../db/types.js';

export interface AppEvents {
  'round:finalized': (record: RoundRecord) => void;
}

class TypedBus extends EventEmitter {
  emitRound(record: RoundRecord) {
    this.emit('round:finalized', record);
  }
  onRound(fn: (r: RoundRecord) => void) {
    this.on('round:finalized', fn);
  }
}

export const bus = new TypedBus();
