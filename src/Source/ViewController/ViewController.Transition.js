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

	title: 'Transition'

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