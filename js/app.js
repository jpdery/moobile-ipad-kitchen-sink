var KitchenSink =  {
	ViewController: {
		Control: {},
		Carousel: {}
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
			case 'carousel':
				viewController = new KitchenSink.ViewController.Navigation.Carousel('views/navigation/carousel.html');
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

				case 'alert':
					viewController = new KitchenSink.ViewController.Control.Alert('views/control/alert.html');
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

KitchenSink.ViewController.Navigation.Carousel = new Class({

	Extends: Moobile.ViewController,

	list: null,

	viewControllers: {},

	init: function() {
		this.title = 'Carousel';
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

		var viewController = this.viewControllers[item.getName()];
		if (viewController == undefined) {

			switch (item.getName()) {

				case 'vertical':
					viewController = new KitchenSink.ViewController.Carousel.Vertical('views/carousel/vertical.html');
					break;

				case 'horizontal':
					viewController = new KitchenSink.ViewController.Carousel.Horizontal('views/carousel/horizontal.html');
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
		title.addEvent('click', function() {
			this.viewControllerStack.popViewController();
		}.bind(this));
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

KitchenSink.ViewController.Control.Alert = new Class({

	Extends: Moobile.ViewController,

	alert: null,

	prompt: null,

	confirm: null,

	init: function() {
		this.title = 'Alert';

		this.alert = this.view.getAlert();
		this.prompt = this.view.getPrompt();
		this.confirm = this.view.getConfirm();

		return this;
	},

	attachEvents: function() {
		this.alert.addEvent('click', this.bound('onButtonClick'));
		this.prompt.addEvent('click', this.bound('onButtonClick'));
		this.confirm.addEvent('click', this.bound('onButtonClick'));
		return this;
	},

	detachEvents: function() {
		this.alert.removeEvent('click', this.bound('onButtonClick'));
		this.prompt.removeEvent('click', this.bound('onButtonClick'));
		this.confirm.removeEvent('click', this.bound('onButtonClick'));
	},

	onButtonClick: function(e) {

		switch (e.target.getName()) {

			case 'alert':
				var alert = new Moobile.Alert();
				alert.setTitle('Alert Title');
				alert.setMessage('This is the alert message content');
				alert.present();
				break;

			case 'confirm':

				var confirm = new Moobile.Alert(null, {buttonLayout:'horizontal'});
				confirm.setTitle('Alert Title');
				confirm.setMessage('This is the alert message content');

				var yes = new Moobile.Button();
				yes.setLabel('Yep');
				confirm.addButton(yes);

				var no = new Moobile.Button();
				no.setLabel('Nope');
				confirm.addButton(no);

				confirm.addEvent('buttonclick', function(button) {



					if (button == yes) {
						var alert1 = new Moobile.Alert();
						alert1.setTitle('Good!');
						alert1.setMessage('You clicked yes');
						alert1.present();
					}

					if (button == no) {
						var alert2 = new Moobile.Alert();
						alert2.setTitle('Good!');
						alert2.setMessage('You clicked no');
						alert2.present();
					}

					confirm.dismiss();

				});

				confirm.present();

				break;

			case 'prompt':

				break;

		}
	}

});


/**
 * Carousel
 */

KitchenSink.ViewController.Carousel.Vertical = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Vertical Carousel';

		var wrapper = this.view.getElement('.carousel');
		var content = this.view.getElement('.carousel ul');

		new Moobile.Scroller.Carousel(wrapper, content, {
			layout: 'vertical'
		});
	}

});

KitchenSink.ViewController.Carousel.Horizontal = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Horizontal Carousel';

		var wrapper = this.view.getElement('.carousel');
		var content = this.view.getElement('.carousel ul');

		new Moobile.Scroller.Carousel(wrapper, content);
	}

});

KitchenSink.ViewController.Welcome = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Welcome';
	}

});