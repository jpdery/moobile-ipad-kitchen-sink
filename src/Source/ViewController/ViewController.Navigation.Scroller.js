/*
---

name: ViewController.Navigation.Scroller

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewController.Navigation

provides:
	- ViewController.Navigation.Scroller

...
*/

KitchenSink.ViewController.Navigation.Scroller = new Class({

	Extends: KitchenSink.ViewController.Navigation,

	title: 'Scroller',

	viewControllerRequested: function(name) {
	
		switch (name) {
			
			case 'scroller':
				return new KitchenSink.ViewController.Scroller.Scroller('views/scroller/scroller.html');
				
			case 'scroll-view':
				return new KitchenSink.ViewController.Scroller.ScrollView('views/scroller/scroll-view.html');
				
			case 'carousel-horizontal':
				return new KitchenSink.ViewController.Scroller.CarouselHorizontal('views/scroller/carousel-horizontal.html');
				
			case 'carousel-vertical':
				return new KitchenSink.ViewController.Scroller.CarouselVertical('views/scroller/carousel-vertical.html');
		}

		return null;
	}

});