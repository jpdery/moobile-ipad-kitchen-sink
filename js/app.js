var KitchenSink =  {
	ViewController: {
		Control: {}
	}
};

/**
 * Root Navigation
 */
KitchenSink.ViewController.Navigation = new Class({

	Extends: Moobile.ViewController,

	list: null,

	init: function() {
		this.title = 'Home';
		this.list = this.view.getList();
		return this;
	},

	attachEvents: function() {
		this.list.addEvent('select', this.bound('onListSelect'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.list.removeEvent('select', this.bound('onListSelect'));
		this.parent();
		return this;
	},

	onListSelect: function(item) {

		var viewController = null;

		switch (item.name) {
			case 'transition':
				viewController = new KitchenSink.ViewController.Navigation.Transition('views/navigation/transition.html');
				break;
			case 'control':
				viewController = new KitchenSink.ViewController.Navigation.Control('views/navigation/control.html');
				break;
		}

		if (viewController) {
			this.viewControllerStack.pushViewController(viewController, new Moobile.ViewTransition.Slide);
		}

		return this;
	}

});

/**
 * Navigation - Transition
 */
KitchenSink.ViewController.Navigation.Transition = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Transition';
		this.list = this.view.getList();
		return this;
	},

	attachEvents: function() {
		this.list.addEvent('select', this.bound('onListSelect'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.list.removeEvent('select', this.bound('onListSelect'));
		this.parent();
		return this;
	},

	onListSelect: function(item) {

		var transition = null;
		var title = null;

		switch (item.name) {
			case 'slide':
				transition = new Moobile.ViewTransition.Slide;
				title = 'Slide Transition';
				break;
			case 'cubic':
				transition = new Moobile.ViewTransition.Cubic;
				title = 'Cubic Transition';
				break;
			case 'cover':
				transition = new Moobile.ViewTransition.Cover;
				title = 'Cover Transition';
				break;
			case 'flip':
				transition = new Moobile.ViewTransition.Flip;
				title = 'Flip Transition';
				break;
			case 'fade':
				transition = new Moobile.ViewTransition.Fade;
				title = 'Fade Transition';
				break;
			case 'none':
				transition = new Moobile.ViewTransition.None;
				title = 'No Transition';
				break;
		}

		var viewController = new KitchenSink.ViewController.Transition('views/transition/transition.html');
		viewController.setTitle(title);

		this.viewControllerPanel.getMainViewController().pushViewController(viewController, transition);

		return this;
	}

});

/**
 * Navigation - Controls
 */
KitchenSink.ViewController.Navigation.Control = new Class({

	Extends: Moobile.ViewController,

	list: null,

	viewControllers: {},

	init: function() {
		this.title = 'Controls';
		this.list = this.view.getList();
		return this;
	},

	attachEvents: function() {
		this.list.addEvent('select', this.bound('onListSelect'));
		this.parent();
		return this;
	},

	detachEvents: function() {
		this.list.removeEvent('select', this.bound('onListSelect'));
		this.parent();
		return this;
	},

	onListSelect: function(item) {

		var viewController = this.viewControllers[item.name];
		if (viewController == undefined) {

			switch (item.name) {

				case 'list':
					viewController = new KitchenSink.ViewController.Control.List('views/control/list.html');
					break;

				case 'button':
					viewController = new KitchenSink.ViewController.Control.Button('views/control/button.html');
					break;

				case 'bar':
					viewController = new KitchenSink.ViewController.Control.Bar('views/control/bar.html');
					break;

				case 'slider':
					viewController = new KitchenSink.ViewController.Control.Slider('views/control/slider.html');
					break;

			}

			this.viewControllers[item.name] = viewController;
		}

		if (viewController) {
			this.viewControllerPanel.getMainViewController().pushViewController(viewController);
		}

		return this;
	}

});

/**
 * Transition
 */

KitchenSink.ViewController.Transition = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		var title = this.view.getElement('.transition-view-title');
		if (title) {
			title.set('html', this.title);
		}
	}

});


/**
 * Controls
 */

KitchenSink.ViewController.Control.List = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'List';
	}

});

KitchenSink.ViewController.Control.Button = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Button';
	}

});

KitchenSink.ViewController.Control.Bar = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Bar Button';
	}

});

KitchenSink.ViewController.Control.Slider = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Slider';
	}

});


KitchenSink.ViewController.Welcome = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Welcome';
	}

});
