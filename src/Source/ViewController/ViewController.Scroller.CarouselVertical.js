/*
---

name: ViewController.Scroller.CarouselVertical

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Scroller.CarouselVertical

...
*/

if (!window.KitchenSink)							window.KitchenSink = {};
if (!window.KitchenSink.ViewController)				window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Scroller)	window.KitchenSink.ViewController.Scroller = {};

KitchenSink.ViewController.Scroller.CarouselVertical = new Class({

	Extends: Moobile.ViewController,
	
	title: 'Vertical Carousel',
	
	init: function() {
		var wrapper = this.view.getElement('.carousel');
		var content = this.view.getElement('.carousel ul');
		new Moobile.Scroller.Carousel(wrapper, content, { layout: 'vertical' });
	}

});