/*
---

name: ViewController.Navigation.Transition

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewController.Navigation

provides:
	- ViewController.Navigation.Transition

...
*/

KitchenSink.ViewController.Navigation.Transition = new Class({

	Extends: KitchenSink.ViewController.Navigation,

	title: 'Transitions',

	onNavigationListItemSelect: function(item) {
		
		var viewController = null;
		var viewTransition = null;
		
		switch (item.getName()) {

			case 'slide':
				viewTransition = new Moobile.ViewTransition.Slide;
				viewController = new KitchenSink.ViewController.Transition('views/transition/slide.html');
				viewController.setTitle('Slide Transition');
				break;

			case 'cubic':
				viewTransition = new Moobile.ViewTransition.Cubic;
				viewController = new KitchenSink.ViewController.Transition('views/transition/cubic.html');
				viewController.setTitle('Cubic Transition');
				break;

			case 'cover':
				viewTransition = new Moobile.ViewTransition.Cover;
				viewController = new KitchenSink.ViewController.Transition('views/transition/cover.html');
				viewController.setTitle('Cover Transition');
				break;
				
			case 'cover-center':
				viewTransition = new Moobile.ViewTransition.Cover({ presentation: 'center' });
				viewController = new KitchenSink.ViewController.Transition('views/transition/cover.html');
				viewController.setTitle('Cover Transition');
				break;				

			case 'cover-box':
				viewTransition = new Moobile.ViewTransition.Cover({ presentation: 'box' });
				viewController = new KitchenSink.ViewController.Transition('views/transition/cover.html');
				viewController.setTitle('Cover Transition');
				break;

			case 'flip':
				viewTransition = new Moobile.ViewTransition.Flip;
				viewController = new KitchenSink.ViewController.Transition('views/transition/flip.html');
				viewController.setTitle('Flip Transition');
				break;

			case 'fade':
				viewTransition = new Moobile.ViewTransition.Fade;
				viewController = new KitchenSink.ViewController.Transition('views/transition/fade.html');
				viewController.setTitle('Fade Transition');
				break;

			case 'none':
				viewTransition = new Moobile.ViewTransition.None;
				viewController = new KitchenSink.ViewController.Transition('views/transition/none.html');
				viewController.setTitle('No Transition');
				break;
		}

		this.viewControllerPanel.getMainViewController().pushViewController(viewController, viewTransition);
		
		return this;
	}

});