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