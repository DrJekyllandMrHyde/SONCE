import { Template } from 'meteor/peerlibrary:blaze-components';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

import './pin-connector.js';
import './elements-item.html';
import { Elements } from '../../api/elements/elements.js';
import { Symbols } from '../../api/symbols/symbols.js';

import { displayError } from '../lib/errors.js';

Template.Elements_item.onCreated(function elementsItemOnCreated() {
  this.autorun(() => {
    new SimpleSchema({
      element: { type: Elements._helpers },
      symbol: { type: Symbols._helpers },
      editing: { type: Boolean, optional: true },
      selected: { type: Boolean, optional: true },
      setSelected: { type: Function },
    }).validate(Template.currentData());
  });

});

Template.Elements_item.onRendered(function circuitShowOnRendered() {
});


Template.Elements_item.helpers({
  symbolsSVG() {
    return Session.get("symbolsSVG");
  },
  rotation() {
    r = this.element.transform.rot;
    return r ? "rotate("+r+")":"";
  },
  nameLabel() {
    const element = this.element;
    const symbol = this.symbol;
    const textPadding = 10;
    let x = textPadding;
    if (symbol.width){
      x = textPadding + symbol.width/2;
    }
    return {x: x, y: 0, }
  },
  pinArgs(pin) {
    const element = this.element;
    const symbol = this.symbol;
    return {
      element,
      symbol,
      pin,
    }
  },

});

Template.Elements_item.events({
  'click .js-select-element'(event, instance) {
    this.selected ? this.setSelected( false ) : this.setSelected( true );
  },

  'change [type=checkbox]'(event) {
    const checked = $(event.target).is(':checked');

    setCheckedStatus.call({
      elementId: this.element._id,
      newCheckedStatus: checked,
    });
  },

  'focus input[type=text]'() {
    this.setEditing(true);
  },

  'blur input[type=text]'() {
    if (this.editing) {
      this.setEditing(false);
    }
  },

  'keydown input[type=text]'(event) {
    // ESC or ENTER
    if (event.which === 27 || event.which === 13) {
      event.preventDefault();
      event.target.blur();
    }
  },

  // update the text of the item on keypress but throttle the event to ensure
  // we don't flood the server with updates (handles the event at most once
  // every 300ms)
  'keyup input[type=text]': _.throttle(function elementsItemKeyUpInner(event) {
    updateElementText.call({
      elementId: this.element._id,
      newText: event.target.value,
    }, displayError);
  }, 300),
});