import './flex-tab-bar.html';

import { Template } from 'meteor/peerlibrary:blaze-components';
import { Tracker } from 'meteor/tracker';
import { $ } from 'meteor/jquery';
import { TabBar } from 'meteor/flextab';
import { TAPi18n } from 'meteor/tap:i18n';

Template.Flex_tab_bar.onCreated(function() {
  this.autorun(() => {
    const visibleGroup = TabBar.getVisibleGroup();
    Tracker.nonreactive(function() {
      const openedTemplate = TabBar.getTemplate();
      let exists = false;
      TabBar.getButtons().forEach(function(button) {
        if (button.groups.indexOf(visibleGroup) !== -1 &&
        openedTemplate === button.template) {
          exists = true;
        }
      });
      if (!exists) {
        TabBar.closeFlex();
      }
    });
  });
});

Template.Flex_tab_bar.helpers({
  buttons() {
    return TabBar.getButtons();
  },
});

Template.Flex_tab_button.helpers({
  active (button) {
    return button.template === TabBar.getTemplate() && TabBar.isFlexOpen()
    ? 'active' : '';
  },
  title (button) {
    return TAPi18n.__(button.i18nTitle) || button.title;
  },
  visible (button) {
    return button.groups.indexOf(TabBar.getVisibleGroup()) === -1
    ? 'hidden' : '';
  },
});

Template.Flex_tab_bar.events({
  'click .tab-button'(e, t) {
    const button = this.button;
    e.preventDefault();
    if (TabBar.isFlexOpen() && TabBar.getTemplate() === button.template) {
      TabBar.closeFlex();
      $('.flex-tab').css('max-width', '');
    } else {
  //    if ((button.openClick === null) || button.openClick(e, t)) {
  //      if (button.width !== null) {
  //        $('.flex-tab').css('max-width', `${button.width}px`);
  //      } else {
  //        $('.flex-tab').css('max-width', '');
  //      }
  //    }
      TabBar.setTemplate(button.template, function() {
        const ref = $('.flex-tab');
        if (ref !== null) {
          const ref1 = ref.find('input[type="text"]:first');
          if (ref1 !== null) { ref1.focus(); }
        }
        const ref2 = $('.flex-tab .content');
        return ref2 !== null ? ref2.scrollTop(0) : void 0;
      });
    }
  },
});
