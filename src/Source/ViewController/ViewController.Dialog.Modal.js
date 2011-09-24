/*
---

name: ViewController.Dialog.Modal

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Dialog.Modal

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Dialog)	window.KitchenSink.ViewController.Dialog = {};


KitchenSink.ViewController.PresentModalViewController = new Class({

	Extends: Moobile.ViewController,

	title: 'Present Modal View Controller',

	presentModalViewControllerButton: null,

	init: function() {
		this.presentModalViewControllerButton = this.view.getPresentModalViewControllerButton();
	},

	attachEvents: function() {
		this.parent();
		this.presentModalViewControllerButton.addEvent('click', this.bound('onPresentModalViewControllerButtonClick'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.presentModalViewControllerButton.removeEvent('click', this.bound('onPresentModalViewControllerButtonClick'));
		return this;
	},

	onPresentModalViewControllerButtonClick: function() {
		this.presentModalViewController(new KitchenSink.ViewController.ModalViewController('views/other/modal-view-controller.html'));
	}

});

KitchenSink.ViewController.ModalViewController = new Class({

	Extends: Moobile.ViewController,

	dismissButton: null,

	init: function() {
		this.dismissButton = this.view.getDismissButton();
	},

	attachEvents: function() {
		this.parent();
		this.dismissButton.addEvent('click', this.bound('onDismissButtonClick'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.dismissButton.removeEvent('click', this.bound('onDismissButtonClick'));
		return this;
	},

	onDismissButtonClick: function() {
		console.log(this);
		this.parentViewController.dismissModalViewController();
	}

});