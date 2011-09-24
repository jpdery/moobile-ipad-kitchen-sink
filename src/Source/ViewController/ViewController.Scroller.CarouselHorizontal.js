/*
---

name: ViewController.Scroller.CarouselHorizontal

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Scroller.CarouselHorizontal

...
*/

if (!window.KitchenSink)							window.KitchenSink = {};
if (!window.KitchenSink.ViewController)				window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Scroller)	window.KitchenSink.ViewController.Scroller = {};


KitchenSink.ViewController.Scroller.CarouselHorizontal = new Class({

	Extends: Moobile.ViewController,
	
	title: 'Horizontal Carousel',
	
	init: function() {
		var wrapper = this.view.getElement('.carousel');
		var content = this.view.getElement('.carousel ul');
		new Moobile.Scroller.Carousel(wrapper, content);
	}

});