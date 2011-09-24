/*
---

name: ViewController.Navigation.Control

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewController.Navigation

provides:
	- ViewController.Navigation.Control

...
*/

KitchenSink.ViewController.Navigation.Control = new Class({

	Extends: KitchenSink.ViewController.Navigation,

	title: 'Controls',

	viewControllerRequested: function(name) {
	
		switch (name) {
			
			case 'bar':
				return new KitchenSink.ViewController.Control.Bar('views/control/bar.html');
			
			case 'list':
				return new KitchenSink.ViewController.Control.List('views/control/list.html');
			
			case 'button':
				return new KitchenSink.ViewController.Control.Button('views/control/button.html');
			
			case 'slider':
				return new KitchenSink.ViewController.Control.Slider('views/control/slider.html');
		}

		return null;
	}

});