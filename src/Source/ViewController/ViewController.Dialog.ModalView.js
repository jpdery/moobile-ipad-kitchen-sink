/*
---

name: ViewController.Dialog.ModalView

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Dialog.ModalView

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Dialog)	window.KitchenSink.ViewController.Dialog = {};


KitchenSink.ViewController.Dialog.ModalView = new Class({

	Extends: Moobile.ViewController,

	title: null,

	dismissButton: null,
	
	init: function() {

		this.dismissButton = this.view.getNavigationBar().getLeftBarButton();
		
		return this;
	},
	
	attachEvents: function() {
		this.dismissButton.addEvent('click', this.bound('onDismissButtonClick'));
		return this;
	},
	
	onDismissButtonClick: function() {
		this.parentViewController.dismissModalViewController();
	}
});