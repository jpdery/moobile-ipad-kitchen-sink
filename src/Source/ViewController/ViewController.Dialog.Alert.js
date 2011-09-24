/*
---

name: ViewController.Dialog.Alert

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Dialog.Alert

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Dialog)	window.KitchenSink.ViewController.Dialog = {};


KitchenSink.ViewController.Dialog.Alert = new Class({

	Extends: Moobile.ViewController,

	title: 'Alert',

	alertHButton: null,
	
	alertVButton: null,
	
	alert: null,
	
	acceptButton: null,
	
	cancelButton: null,
	
	init: function() {
		this.alertHButton = this.view.getAlertHButton();
		this.alertVButton = this.view.getAlertVButton();
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.alertHButton.addEvent('click', this.bound('onButtonClick'));
		this.alertVButton.addEvent('click', this.bound('onButtonClick'));		
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.alertHButton.removeEvent('click', this.bound('onButtonClick'));
		this.alertVButton.removeEvent('click', this.bound('onButtonClick'));
		return this;
	},

	onButtonClick: function(e) {
		
		switch (e.target.getName()) {

			case 'alert-h-button':
			 	this.alert = new Moobile.Alert(null, { buttonLayout: 'horizontal' });
				break;

			case 'alert-v-button':
			 	this.alert = new Moobile.Alert(null, { buttonLayout: 'vertical' });
				break;
		}

		this.alert.setTitle('Title');
		this.alert.setMessage('Message');

		this.acceptButton = new Moobile.Button(null, null, 'accept');
		this.acceptButton.setLabel('OK');
		this.acceptButton.setHighlighted(true);
		this.alert.addButton(this.acceptButton);

		this.cancelButton = new Moobile.Button(null, null, 'cancel');
		this.cancelButton.setLabel('Cancel');
		this.alert.addButton(this.cancelButton);

		this.alert.addEvent('buttonclick', this.bound('onAlertButtonClick'));
		this.alert.present();
		
		return this;
	},
	
	onAlertButtonClick: function(button) {
		
		var alert = new Moobile.Alert();

		alert.setTitle('Message');

		if (button === this.acceptButton) {
			alert.setMessage('You clicked OK');
		}

		if (button == this.cancelButton) {
			alert.setMessage('You clicked Cancel');
		}

		alert.present();

		this.alert.dismiss();
		
		return this;
	}

});