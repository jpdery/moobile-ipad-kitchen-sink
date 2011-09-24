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