import { Mongo } from 'meteor/mongo';

import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Circuits } from '../circuits/circuits.js';

class WiresCollection extends Mongo.Collection {
  insert(doc, callback) {
    const ourDoc = doc;
    ourDoc.added = ourDoc.added || new Date();

    if (!ourDoc.name) {
      let nextNumber = Wires.find().count();
      nextNumber = nextNumber ? nextNumber + 1 : 1;
      ourDoc.name = `w${nextNumber}`;

      while (!!this.findOne({ name: ourDoc.name })) {
        // not going to be too smart here, can go past Z
        nextNumber += 1;
        ourDoc.name = `w${nextNumber}`;
      }
    }
    return super.insert(ourDoc, callback);
  }
  update(selector, modifier) {
    return super.update(selector, modifier);
  }
  remove(selector) {
    return super.remove(selector);
  }
}

export const Wires = new WiresCollection('Wires');

// Deny all client-side updates since we will be using methods to manage this collection
Wires.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

Wires.schema = new SimpleSchema({
  "name": { type: String },
  "d": { type: String },
  "type": { type: String, optional: true },
  "pins": { type: [String] },
  "added": { type: Date },
  "modified": { type: Date, optional: true },
  "cid": {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    denyUpdate: true,
  },
});

Wires.attachSchema(Wires.schema);

Wires.helpers({
  circuit() {
    return Circuits.findOne(this.cid);
  },
  editableBy(userId) {
    return this.circuit().editableBy(userId);
  },
});
