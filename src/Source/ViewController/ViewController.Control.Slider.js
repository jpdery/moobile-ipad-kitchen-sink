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