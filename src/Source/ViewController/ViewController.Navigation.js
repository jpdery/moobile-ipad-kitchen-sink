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