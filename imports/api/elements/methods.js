import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Elements } from './elements.js';
import { Circuits } from '../circuits/circuits.js';
import { Components } from '../components/components.js';


export const insertElement = new ValidatedMethod({
  name: 'elements.insert',

  validate: new SimpleSchema({
    "name": { type: String, optional: true },
    "component": { type: String },
    "type": { type: String, optional: true },
    "symbol": { type: String },
    "cid": { type: String, regEx: SimpleSchema.RegEx.Id },
    "pins": { type: [Object], optional: true  },
    "pins.$.id": { type: String },
    "pins.$.x": { type: Number },
    "pins.$.y": { type: Number },
    "pins.$.net": { type: String, optional: true  },
    "transform": { type: Object },
    "transform.x": { type: Number },
    "transform.y": { type: Number },
    "transform.rot": { type: Number },
  }).validator(),

  run({ name, component, type, symbol, cid, pins, transform }) {
    console.log( "METHOD elements.insert "+ component );

    const circuit = Circuits.findOne(cid);

    if (circuit.isPrivate() && circuit.userId !== this.userId) {
      throw new Meteor.Error('elements.insert.accessDenied',
        'Cannot add elements to a private circuit that is not yours');
    }

    const element = {
      name,
      component,
      type,
      symbol,
      cid,
      pins,
      transform
    };

    Elements.insert(element);
  },
});

export const rotateElement = new ValidatedMethod({
  name: 'elements.rotate',
  validate: new SimpleSchema({
    eid: { type: String },
    phi: { type: Number },
  }).validator(),

  run({ eid, phi }) {
    console.log( "METHOD elements.rotate "+ eid +" ("+ phi +")" );

    // This is complex auth stuff - perhaps denormalizing a userId onto elements
    // would be correct here?
    const element = Elements.findOne(
      { "_id": eid },
    );

    if (!element.editableBy(this.userId)) {
      throw new Meteor.Error('elements.rotate.accessDenied',
        'Cannot edit elements in a private circuit that is not yours');
    }

    Elements.update(
      { "_id": eid },
      { $set: { "transform.rot": phi } }
    );
  },
});

export const connectElementToNet = new ValidatedMethod({
  name: 'elements.connectToNet',
  validate: new SimpleSchema({
    cid: { type: String, regEx: SimpleSchema.RegEx.Id },
    name: { type: String },
    pin: { type: String },
    net: { type: String },
  }).validator(),
  run({ cid, name, pin, net }) {
    console.log( "METHOD elements.connectToNet "+ name +"-"+ pin + " ("+ net +")" );

    const element = Elements.findOne({ cid: cid, name: name });
    if (!element.editableBy(this.userId)) {
      throw new Meteor.Error('elements.connectToNet.accessDenied',
        'Cannot edit elements in a private circuit that is not yours');
    }

    Elements.update(
      { cid: cid, name: name, "pins.id": pin },
      { $set: { "pins.$.net": net } }
    );
  },
});

export const updateElementText = new ValidatedMethod({
  name: 'elements.updateText',
  validate: new SimpleSchema({
    eid: { type: String },
    newText: { type: String },
  }).validator(),
  run({ eid, newText }) {
    // This is complex auth stuff - perhaps denormalizing a userId onto elements
    // would be correct here?
    const element = Elements.findOne(eid);

    if (!element.editableBy(this.userId)) {
      throw new Meteor.Error('elements.updateText.accessDenied',
        'Cannot edit elements in a private circuit that is not yours');
    }

    Elements.update(
      { "_id": eid },
      { $set: { text: newText } }
    );
  },
});

export const removeElement = new ValidatedMethod({
  name: 'elements.remove',
  validate: new SimpleSchema({
    eid: { type: String },
  }).validator(),
  run({ eid }) {
    console.log( "METHOD elements.remove "+ eid );

    const element = Elements.findOne(eid);

    if (!element.editableBy(this.userId)) {
      throw new Meteor.Error('elements.remove.accessDenied',
        'Cannot remove elements in a private circuit that is not yours');
    }

    Elements.remove(eid);
  },
});

// Get list of all method names on Elements
const ELEMENTS_METHODS = _.pluck([
  insertElement,
  rotateElement,
  connectElementToNet,
  updateElementText,
  removeElement,
], 'name');

if (Meteor.isServer) {
  // Only allow 5 elements operations per connection per second
  DDPRateLimiter.addRule({
    name(name) {
      return _.contains(ELEMENTS_METHODS, name);
    },

    // Rate limit per connection ID
    connectionId() { return true; },
  }, 5, 1000);
}
