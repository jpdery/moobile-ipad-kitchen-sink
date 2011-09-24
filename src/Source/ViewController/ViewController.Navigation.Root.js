/*
---

name: ViewController.Navigation.Root

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewController.Navigation

provides:
	- ViewController.Navigation.Root

...
*/

KitchenSink.ViewController.Navigation.Root = new Class({

	Extends: KitchenSink.ViewController.Navigation,

	title: '',

	viewControllerRequested: function(name) {
	
		switch (name) {

			case 'control':
				return new KitchenSink.ViewController.Navigation.Control('views/navigation/control.html');

			case 'scroller':
				return new KitchenSink.ViewController.Navigation.Scroller('views/navigation/scroller.html');

			case 'dialog':
				return new KitchenSink.ViewController.Navigation.Dialog('views/navigation/dialog.html');

			case 'transition':
				return new KitchenSink.ViewController.Navigation.Transition('views/navigation/transition.html');
		}

		return null;
	}

});