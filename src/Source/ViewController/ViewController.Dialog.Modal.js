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


KitchenSink.ViewController.Dialog.Modal = new Class({

	Extends: Moobile.ViewController,

	title: 'Modal View',

	modalViewDefaultButton: null,
	
	modalViewCenteredButton: null,
	
	modalViewBoxedButton: null,
	
	init: function() {
		console.log(this.view);
		this.modalViewDefaultButton = this.view.getModalViewDefaultButton();
		this.modalViewCenteredButton = this.view.getModalViewCenteredButton();
		this.modalViewBoxedButton = this.view.getModalViewBoxedButton();
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.modalViewDefaultButton.addEvent('click', this.bound('onButtonClick'));
		this.modalViewCenteredButton.addEvent('click', this.bound('onButtonClick'));
		this.modalViewBoxedButton.addEvent('click', this.bound('onButtonClick'));		
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.modalViewDefaultButton.removeEvent('click', this.bound('onButtonClick'));
		this.modalViewCenteredButton.removeEvent('click', this.bound('onButtonClick'));
		this.modalViewBoxedButton.removeEvent('click', this.bound('onButtonClick'));
		return this;
	},

	onButtonClick: function(e) {
		
		var viewController = new KitchenSink.ViewController.Dialog.ModalView('views/dialog/modal-view.html');
		
		switch (e.target.getName()) {
			
			case 'modal-view-default-button':
				this.presentModalViewController(viewController, new Moobile.ViewTransition.Cover);
				break;
			
			case 'modal-view-centered-button':
				this.presentModalViewController(viewController, new Moobile.ViewTransition.Cover({ presentation: 'center' }));
				break;
			
			case 'modal-view-boxed-button':
				this.presentModalViewController(viewController, new Moobile.ViewTransition.Cover({ presentation: 'box' }));
				break;			
		}
		
		return this;
	},
	
	didDissmissModalViewController: function() {
		
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