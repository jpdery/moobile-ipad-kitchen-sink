/*
---

name: ViewController.Navigation.Dialog

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewController.Navigation

provides:
	- ViewController.Navigation.Dialog

...
*/

KitchenSink.ViewController.Navigation.Dialog = new Class({

	Extends: KitchenSink.ViewController.Navigation,

	title: 'Dialogs',

	viewControllerRequested: function(name) {
	
		switch (name) {
			
			case 'alert':
				return new KitchenSink.ViewController.Dialog.Alert('views/dialog/alert.html');
				
			case 'modal':
				return new KitchenSink.ViewController.Dialog.Modal('views/dialog/modal.html');
				
		}

		return null;
	}

});