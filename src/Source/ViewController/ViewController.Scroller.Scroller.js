/*
---

name: ViewController.Scroller.Scroller

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Scroller.Scroller

...
*/

if (!window.KitchenSink)							window.KitchenSink = {};
if (!window.KitchenSink.ViewController)				window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Scroller)	window.KitchenSink.ViewController.Scroller = {};

KitchenSink.ViewController.Scroller.Scroller = new Class({

	Extends: Moobile.ViewController,
	
	init: function() {		
		var wrapper = this.view.getElement('.box');
		var scroller = new Moobile.Scroller(wrapper);
		scroller.refresh();
	}
	
});