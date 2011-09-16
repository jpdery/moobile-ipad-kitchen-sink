var KitchenSink =  {
	ViewController: {
		Control: {},
		Carousel: {}
	}
};

// -----------------------------------------------------------------------------
// Navigation: Root
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Navigation = new Class({

	Extends: Moobile.ViewController,

	title: 'Home',

	list: null,

	init: function() {
		this.parent();
		this.list = this.view.getList();
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.list.addEvent('select', this.bound('onListSelect'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.list.removeEvent('select', this.bound('onListSelect'));
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

			case 'dialog':
				viewController = new KitchenSink.ViewController.Navigation.Dialog('views/navigation/dialog.html');
				break;

			case 'carousel':
				viewController = new KitchenSink.ViewController.Navigation.Carousel('views/navigation/carousel.html');
				break;

			case 'other':
				viewController = new KitchenSink.ViewController.Navigation.Other('views/navigation/other.html');
				break;
		}

		if (viewController) this.viewControllerStack.pushViewController(viewController, new Moobile.ViewTransition.Slide);

		return this;
	}

});

/// -----------------------------------------------------------------------------
// Navigation: Transitions
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Navigation.Transition = new Class({

	Extends: Moobile.ViewController,

	title: 'Transitions',

	init: function() {
		this.parent();
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

		var transitionClass = null;
		var transitionTitle = null;

		switch (item.name) {

			case 'slide':
				transitionClass = new Moobile.ViewTransition.Slide;
				transitionTitle = 'Slide Transition';
				break;

			case 'cubic':
				transitionClass = new Moobile.ViewTransition.Cubic;
				transitionTitle = 'Cubic Transition';
				break;

			case 'cover':
				transitionClass = new Moobile.ViewTransition.Cover;
				transitionTitle = 'Cover Transition';
				break;

			case 'flip':
				transitionClass = new Moobile.ViewTransition.Flip;
				transitionTitle = 'Flip Transition';
				break;

			case 'fade':
				transitionClass = new Moobile.ViewTransition.Fade;
				transitionTitle = 'Fade Transition';
				break;

			case 'none':
				transitionClass = new Moobile.ViewTransition.None;
				transitionTitle = 'No Transition';
				break;
		}

		var viewController = new KitchenSink.ViewController.Transition('views/transition/transition.html');
		viewController.setTitle(transitionTitle);
		this.viewControllerPanel.getMainViewController().pushViewController(viewController, transitionClass);

		return this;
	}

});

// -----------------------------------------------------------------------------
// Navigation: Control
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Navigation.Control = new Class({

	Extends: Moobile.ViewController,

	title: 'Controls',

	list: null,

	viewControllers: {},

	init: function() {
		this.parent();
		this.list = this.view.getList();
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.list.addEvent('select', this.bound('onListSelect'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.list.removeEvent('select', this.bound('onListSelect'));
		return this;
	},

	onListSelect: function(item) {

		var viewController = this.viewControllers[item.name];
		if (viewController == undefined) {

			switch (item.name) {

				case 'bar':
					viewController = new KitchenSink.ViewController.Control.Bar('views/control/bar.html');
					break;

				case 'list':
					viewController = new KitchenSink.ViewController.Control.List('views/control/list.html');
					break;

				case 'button':
					viewController = new KitchenSink.ViewController.Control.Button('views/control/button.html');
					break;

				case 'slider':
					viewController = new KitchenSink.ViewController.Control.Slider('views/control/slider.html');
					break;
			}

			this.viewControllers[item.name] = viewController;
		}

		if (viewController) this.viewControllerPanel.getMainViewController().pushViewController(viewController, new Moobile.ViewTransition.Fade);

		return this;
	}

});

// -----------------------------------------------------------------------------
// Navigation: Dialog
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Navigation.Dialog = new Class({

	Extends: Moobile.ViewController,

	title: 'Controls',

	list: null,

	viewControllers: {},

	init: function() {
		this.parent();
		this.list = this.view.getList();
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.list.addEvent('select', this.bound('onListSelect'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.list.removeEvent('select', this.bound('onListSelect'));
		return this;
	},

	onListSelect: function(item) {

		var viewController = this.viewControllers[item.name];
		if (viewController == undefined) {

			switch (item.name) {

				case 'alert':
					viewController = new KitchenSink.ViewController.Control.Alert('views/dialog/alert.html');
					break;
			}

			this.viewControllers[item.name] = viewController;
		}

		if (viewController) this.viewControllerPanel.getMainViewController().pushViewController(viewController);

		return this;
	}

});

// -----------------------------------------------------------------------------
// Navigation: Carousel
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Navigation.Carousel = new Class({

	Extends: Moobile.ViewController,

	title: 'Carousel',

	list: null,

	viewControllers: {},

	init: function() {
		this.parent();
		this.list = this.view.getList();
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.list.addEvent('select', this.bound('onListSelect'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.list.removeEvent('select', this.bound('onListSelect'));
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

		if (viewController) this.viewControllerPanel.getMainViewController().pushViewController(viewController);

		return this;
	}

});

// -----------------------------------------------------------------------------
// Navigation: Other
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Navigation.Other = new Class({

	Extends: Moobile.ViewController,

	title: 'Others',

	list: null,

	viewControllers: {},

	init: function() {
		this.parent();
		this.list = this.view.getList();
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.list.addEvent('select', this.bound('onListSelect'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.list.removeEvent('select', this.bound('onListSelect'));
		return this;
	},

	onListSelect: function(item) {

		var viewController = this.viewControllers[item.name];
		if (viewController == undefined) {

			switch (item.name) {

				case 'present-modal-view-controller':
					viewController = new KitchenSink.ViewController.PresentModalViewController('views/other/present-modal-view-controller.html');
					break;
			}

			this.viewControllers[item.name] = viewController;
		}

		if (viewController) this.viewControllerPanel.getMainViewController().pushViewController(viewController);

		return this;
	}

});

// -----------------------------------------------------------------------------
// Transition
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Transition = new Class({

	Extends: Moobile.ViewController,

	transitionName: null,

	init: function() {

		this.parent();

		this.transitionName = this.view.getElement('.transition-view-title');
		if (this.transitionName) {
			this.transitionName.set('html', this.title + '<br /><em style="font-size:80%">Click here to see the reciproque</em>');
		}

		return this;
	},

	attachEvents: function() {
		this.parent();
		this.transitionName.addEvent('click', this.bound('onTransitionNameClick'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.transitionName.removeEvent('click', this.bound('onTransitionNameClick'));
		return this;
	},

	onTransitionNameClick: function() {
		this.viewControllerStack.popViewController();
	}

});

// -----------------------------------------------------------------------------
// Control: List
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Control.List = new Class({

	Extends: Moobile.ViewController,

	title: 'List'

});

// -----------------------------------------------------------------------------
// Control: Button
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Control.Button = new Class({

	Extends: Moobile.ViewController,

	title: 'Button'

});

// -----------------------------------------------------------------------------
// Control: Bars
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Control.Bar = new Class({

	Extends: Moobile.ViewController,

	title: 'Bars'

});

// -----------------------------------------------------------------------------
// Control: Slider
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Control.Slider = new Class({

	Extends: Moobile.ViewController,

	title: 'Slider'

});

// -----------------------------------------------------------------------------
// Dialog
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Control.Alert = new Class({

	Extends: Moobile.ViewController,

	title: 'Alert',

	buttons: null,

	init: function() {


		this.buttons = this.view.getChildViews().filter(function(childView) {
			return childView instanceof Moobile.Button;
		});

		return this;
	},

	attachEvents: function() {
		this.parent();
		this.buttons.each(function(button) { button.addEvent('click', this.bound('onButtonClick')) }, this);
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.buttons.each(function(button) { button.removeEvent('click', this.bound('onButtonClick')) }, this);
		return this;
	},

	onButtonClick: function(e) {

		var dialog = null;

		switch (e.target.getName()) {

			case 'simple-button':
				dialog = new Moobile.Alert();
				dialog.setTitle('Alert Title');
				dialog.setMessage('This is the alert message content');
				dialog.present();
				break;

			case 'vertical-button':

				dialog = new Moobile.Alert(null, {buttonLayout:'vertical'});
				dialog.setTitle('Alert Title');
				dialog.setMessage('This is the alert message content');

				var yes = new Moobile.Button();
				yes.setLabel('Yep');
				yes.setHighlighted(true);
				dialog.addButton(yes);

				var no = new Moobile.Button();
				no.setLabel('Nope');
				dialog.addButton(no);

				dialog.addEvent('buttonclick', function(button) {

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

					dialog.dismiss();

				});

				dialog.present();

				break;

			case 'horizontal-button':

				var dialog = new Moobile.Alert(null, {buttonLayout:'horizontal'});
				dialog.setTitle('Alert Title');
				dialog.setMessage('This is the alert message content');

				var yes = new Moobile.Button();
				yes.setLabel('Yep');
				yes.setHighlighted(true);
				dialog.addButton(yes);

				var no = new Moobile.Button();
				no.setLabel('Nope');
				dialog.addButton(no);

				dialog.addEvent('buttonclick', function(button) {

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

					dialog.dismiss();

				});

				dialog.present();

				break;
		}
	}

});

// -----------------------------------------------------------------------------
// Carousel: Vertical
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Control: Horizontal
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Carousel.Horizontal = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Horizontal Carousel';

		var wrapper = this.view.getElement('.carousel');
		var content = this.view.getElement('.carousel ul');

		new Moobile.Scroller.Carousel(wrapper, content);
	}

});

// -----------------------------------------------------------------------------
// Other: Present Modal View Controller
// -----------------------------------------------------------------------------

KitchenSink.ViewController.PresentModalViewController = new Class({

	Extends: Moobile.ViewController,

	title: 'Present Modal View Controller',

	presentModalViewControllerButton: null,

	init: function() {
		this.presentModalViewControllerButton = this.view.getPresentModalViewControllerButton();
	},

	attachEvents: function() {
		this.parent();
		this.presentModalViewControllerButton.addEvent('click', this.bound('onPresentModalViewControllerButtonClick'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.presentModalViewControllerButton.removeEvent('click', this.bound('onPresentModalViewControllerButtonClick'));
		return this;
	},

	onPresentModalViewControllerButtonClick: function() {
		this.presentModalViewController(new KitchenSink.ViewController.ModalViewController('views/other/modal-view-controller.html'));
	}

});

KitchenSink.ViewController.ModalViewController = new Class({

	Extends: Moobile.ViewController,

	dismissButton: null,

	init: function() {
		this.dismissButton = this.view.getDismissButton();
	},

	attachEvents: function() {
		this.parent();
		this.dismissButton.addEvent('click', this.bound('onDismissButtonClick'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.dismissButton.removeEvent('click', this.bound('onDismissButtonClick'));
		return this;
	},

	onDismissButtonClick: function() {
		console.log(this);
		this.parentViewController.dismissModalViewController();
	}

});

// -----------------------------------------------------------------------------
// Welcome
// -----------------------------------------------------------------------------

KitchenSink.ViewController.Welcome = new Class({

	Extends: Moobile.ViewController,

	init: function() {
		this.title = 'Welcome';
	}

});