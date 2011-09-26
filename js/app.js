/*
---

name: ViewController.Control.Bar

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Control.Bar

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Control)	window.KitchenSink.ViewController.Control = {};

KitchenSink.ViewController.Control.Bar = new Class({

	Extends: Moobile.ViewController,

	title: 'Bar'

});

/*
---

name: ViewController.Control.Button

description:

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Control.Button

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Control)	window.KitchenSink.ViewController.Control = {};

KitchenSink.ViewController.Control.Button = new Class({

	Extends: Moobile.ViewController,

	title: 'Button'

});

/*
---

name: ViewController.Control.List

description:

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Control.List

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Control)	window.KitchenSink.ViewController.Control = {};

KitchenSink.ViewController.Control.List = new Class({

	Extends: Moobile.ViewController,

	title: 'List'

});

/*
---

name: ViewController.Control.Slider

description:

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Control.Slider

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Control)	window.KitchenSink.ViewController.Control = {};

KitchenSink.ViewController.Control.Slider = new Class({

	Extends: Moobile.ViewController,

	title: 'Slider'

});

/*
---

name: ViewController.Dialog.Alert

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Dialog.Alert

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Dialog)	window.KitchenSink.ViewController.Dialog = {};


KitchenSink.ViewController.Dialog.Alert = new Class({

	Extends: Moobile.ViewController,

	title: 'Alert',

	alertHButton: null,
	
	alertVButton: null,
	
	alert: null,
	
	acceptButton: null,
	
	cancelButton: null,
	
	init: function() {
		this.alertHButton = this.view.getAlertHButton();
		this.alertVButton = this.view.getAlertVButton();
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.alertHButton.addEvent('click', this.bound('onButtonClick'));
		this.alertVButton.addEvent('click', this.bound('onButtonClick'));		
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.alertHButton.removeEvent('click', this.bound('onButtonClick'));
		this.alertVButton.removeEvent('click', this.bound('onButtonClick'));
		return this;
	},

	onButtonClick: function(e) {
		
		switch (e.target.getName()) {

			case 'alert-h-button':
			 	this.alert = new Moobile.Alert(null, { buttonLayout: 'horizontal' });
				break;

			case 'alert-v-button':
			 	this.alert = new Moobile.Alert(null, { buttonLayout: 'vertical' });
				break;
		}

		this.alert.setTitle('Title');
		this.alert.setMessage('Message');

		this.acceptButton = new Moobile.Button(null, null, 'accept');
		this.acceptButton.setLabel('OK');
		this.acceptButton.setHighlighted(true);
		this.alert.addButton(this.acceptButton);

		this.cancelButton = new Moobile.Button(null, null, 'cancel');
		this.cancelButton.setLabel('Cancel');
		this.alert.addButton(this.cancelButton);

		this.alert.addEvent('buttonclick', this.bound('onAlertButtonClick'));
		this.alert.present();
		
		return this;
	},
	
	onAlertButtonClick: function(button) {
		
		var alert = new Moobile.Alert();

		alert.setTitle('Message');

		if (button === this.acceptButton) {
			alert.setMessage('You clicked OK');
		}

		if (button == this.cancelButton) {
			alert.setMessage('You clicked Cancel');
		}

		alert.present();

		this.alert.dismiss();
		
		return this;
	}

});

/*
---

name: ViewController.Dialog.Modal

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Dialog.Modal

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Dialog)	window.KitchenSink.ViewController.Dialog = {};


KitchenSink.ViewController.Dialog.Modal = new Class({

	Extends: Moobile.ViewController,

	title: 'Modal View',

	modalViewDefaultButton: null,
	
	modalViewCenteredButton: null,
	
	modalViewBoxedButton: null,
	
	init: function() {
		console.log(this.view);
		this.modalViewDefaultButton = this.view.getModalViewDefaultButton();
		this.modalViewCenteredButton = this.view.getModalViewCenteredButton();
		this.modalViewBoxedButton = this.view.getModalViewBoxedButton();
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.modalViewDefaultButton.addEvent('click', this.bound('onButtonClick'));
		this.modalViewCenteredButton.addEvent('click', this.bound('onButtonClick'));
		this.modalViewBoxedButton.addEvent('click', this.bound('onButtonClick'));		
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.modalViewDefaultButton.removeEvent('click', this.bound('onButtonClick'));
		this.modalViewCenteredButton.removeEvent('click', this.bound('onButtonClick'));
		this.modalViewBoxedButton.removeEvent('click', this.bound('onButtonClick'));
		return this;
	},

	onButtonClick: function(e) {
		
		var viewController = new KitchenSink.ViewController.Dialog.ModalView('views/dialog/modal-view.html');
		
		switch (e.target.getName()) {
			
			case 'modal-view-default-button':
				this.presentModalViewController(viewController, new Moobile.ViewTransition.Cover);
				break;
			
			case 'modal-view-centered-button':
				this.presentModalViewController(viewController, new Moobile.ViewTransition.Cover({ presentation: 'center' }));
				break;
			
			case 'modal-view-boxed-button':
				this.presentModalViewController(viewController, new Moobile.ViewTransition.Cover({ presentation: 'box' }));
				break;			
		}
		
		return this;
	},
	
	didDissmissModalViewController: function() {
		
		var alert = new Moobile.Alert();

		alert.setTitle('Message');

		if (button === this.acceptButton) {
			alert.setMessage('You clicked OK');
		}

		if (button == this.cancelButton) {
			alert.setMessage('You clicked Cancel');
		}

		alert.present();

		this.alert.dismiss();
		
		return this;
	}

});

/*
---

name: ViewController.Dialog.ModalView

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Dialog.ModalView

...
*/

if (!window.KitchenSink)						window.KitchenSink = {};
if (!window.KitchenSink.ViewController)			window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Dialog)	window.KitchenSink.ViewController.Dialog = {};


KitchenSink.ViewController.Dialog.ModalView = new Class({

	Extends: Moobile.ViewController,

	title: null,

	dismissButton: null,
	
	init: function() {

		this.dismissButton = this.view.getNavigationBar().getLeftBarButton();
		
		return this;
	},
	
	attachEvents: function() {
		this.dismissButton.addEvent('click', this.bound('onDismissButtonClick'));
		return this;
	},
	
	onDismissButtonClick: function() {
		this.parentViewController.dismissModalViewController();
	}
});

/*
---

name: ViewController.Navigation

description: The base class for navigation controllers.

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Navigation

...
*/

if (!window.KitchenSink) 							window.KitchenSink = {};
if (!window.KitchenSink.ViewController)				window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Navigation)	window.KitchenSink.ViewController.Navigation = {};


KitchenSink.ViewController.Navigation = new Class({

	Extends: Moobile.ViewController,

	navigationList: null,

	init: function() {
		this.navigationList = this.view.getNavigationList();
		return this;
	},

	attachEvents: function() {
		this.navigationList.addEvent('select', this.bound('onNavigationListItemSelect'));
		return this;
	},

	detachEvents: function() {
		this.navigationList.removeEvent('select', this.bound('onNavigationListItemSelect'));
		return this;
	},

	viewWillEnter: function() {
		this.navigationList.setSelectedItem(null);
		return this;
	},
	
	viewControllerRequested: function(name) {
		return null;
	},
	
	onNavigationListItemSelect: function(item) {
			
		var viewController = this.viewControllerRequested(item.getName());
		if (viewController) {
			
			if (viewController instanceof KitchenSink.ViewController.Navigation) {
				this.viewControllerPanel.getSideViewController().pushViewController(viewController, new Moobile.ViewTransition.Slide);
			} else {
				this.viewControllerPanel.getMainViewController().pushViewController(viewController, new Moobile.ViewTransition.Fade);
			}			
		}
		
		return this;
	}

});

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

/*
---

name: ViewController.Navigation.Dialog

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- ViewController.Navigation

provides:
	- ViewController.Navigation.Dialog

...
*/

KitchenSink.ViewController.Navigation.Dialog = new Class({

	Extends: KitchenSink.ViewController.Navigation,

	title: 'Dialogs',

	viewControllerRequested: function(name) {
	
		switch (name) {
			
			case 'alert':
				return new KitchenSink.ViewController.Dialog.Alert('views/dialog/alert.html');
				
			case 'modal':
				return new KitchenSink.ViewController.Dialog.Modal('views/dialog/modal.html');
				
		}

		return null;
	}

});

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

/*
---

name: ViewController.Scroller.ScrollView

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Scroller.ScrollView

...
*/

if (!window.KitchenSink)							window.KitchenSink = {};
if (!window.KitchenSink.ViewController)				window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Scroller)	window.KitchenSink.ViewController.Scroller = {};

KitchenSink.ViewController.Scroller.ScrollView = new Class({

	Extends: Moobile.ViewController,
	
});

/*
---

name: ViewController.Transition

description: 

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Transition

...
*/

if (!window.KitchenSink)							window.KitchenSink = {};
if (!window.KitchenSink.ViewController)				window.KitchenSink.ViewController = {};
if (!window.KitchenSink.ViewController.Transition)	window.KitchenSink.ViewController.Transition = {};


KitchenSink.ViewController.Transition = new Class({

	Extends: Moobile.ViewController,

	box: null,

	init: function() {
		this.parent();
		this.box = this.view.getElement('.box');
		return this;
	},

	attachEvents: function() {
		this.parent();
		this.box.addEvent('click', this.bound('onTransitionNameClick'));
		return this;
	},

	detachEvents: function() {
		this.parent();
		this.box.removeEvent('click', this.bound('onTransitionNameClick'));
		return this;
	},

	onTransitionNameClick: function() {
		this.viewControllerStack.popViewController();
	}

});

/*
---

name: ViewController.Welcome

description:

license: MIT-style license.

authors:
	- Jean-Philippe Dery (jeanphilippe.dery@gmail.com)

requires:
	- Moobile/ViewController

provides:
	- ViewController.Control.Bar

...
*/

KitchenSink.ViewController.Welcome = new Class({

	Extends: Moobile.ViewController,

	title: 'Welcome'

});
