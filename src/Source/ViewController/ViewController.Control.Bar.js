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